import { embedMany } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Internal dedup gate (R1.5 §5): a new draft is compared against the APPROVED
// bank only — normalized-stem containment plus a cheap embedding cosine with
// a conservative threshold. Only the score is stored. There are NO similarity
// checks against external corpora — archive text never enters the system.

export const DEDUP_COSINE_THRESHOLD = 0.93; // conservative: near-verbatim only
const EMBEDDING_MODEL = 'text-embedding-3-small';

// Lead-ins that carry no question identity. A stem of nothing but boilerplate
// is contained in every other stem that opens the same way, which made one
// approved question ("Use the information above to answer the parts below")
// reject 25 consecutive drafts on the same recipe.
const BOILERPLATE =
  /\b(?:use|refer to|study)\s+(?:the\s+)?(?:information|table|graph|diagram|figure|sketch|chart|grid|data)(?:\s+(?:above|below|shown|provided))?\s+(?:to\s+)?(?:answer|and answer)\s+(?:the\s+)?(?:parts?|questions?|following)(?:\s+(?:below|that follow|which follow))?\b/g;

export function normalizeStem(s: string): string {
  return s
    .toLowerCase()
    .replace(BOILERPLATE, ' ')
    .replace(/\$[^$]*\$/g, ' _math_ ') // math content varies freely
    .replace(/\d+(\.\d+)?/g, ' _n_ ') // numbers vary freely
    .replace(/[^a-z_\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Containment: the shorter normalized stem appearing inside the longer one.
export function stemContained(a: string, b: string): boolean {
  const na = normalizeStem(a);
  const nb = normalizeStem(b);
  if (na.length < 40 || nb.length < 40) return na === nb;
  const [short, long] = na.length <= nb.length ? [na, nb] : [nb, na];
  return long.includes(short);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    ma += a[i] * a[i];
    mb += b[i] * b[i];
  }
  if (ma === 0 || mb === 0) return 0;
  return dot / (Math.sqrt(ma) * Math.sqrt(mb));
}

export interface DedupResult {
  duplicate: boolean;
  reason?: 'stem-containment' | 'embedding-cosine';
  score: number; // max cosine vs approved bank (0 when bank empty)
}

export async function checkDuplicate(
  candidateStem: string,
  approvedStems: string[],
): Promise<DedupResult> {
  if (approvedStems.length === 0) return { duplicate: false, score: 0 };

  for (const s of approvedStems) {
    if (stemContained(candidateStem, s)) {
      return { duplicate: true, reason: 'stem-containment', score: 1 };
    }
  }

  const openai = createOpenAI({ apiKey: process.env.AI_API_KEY });
  const { embeddings } = await embedMany({
    model: openai.textEmbeddingModel(EMBEDDING_MODEL),
    values: [candidateStem, ...approvedStems],
  });
  const [candidate, ...bank] = embeddings;
  let max = 0;
  for (const e of bank) max = Math.max(max, cosine(candidate, e));
  return {
    duplicate: max >= DEDUP_COSINE_THRESHOLD,
    reason: max >= DEDUP_COSINE_THRESHOLD ? 'embedding-cosine' : undefined,
    score: Math.round(max * 1000) / 1000,
  };
}
