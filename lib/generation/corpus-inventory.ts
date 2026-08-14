import { z } from 'zod';

export const CorpusSourceZ = z.enum(['csechub', 'csecpastpapers-drive']);
export const CorpusClassificationZ = z.enum([
  'question-paper',
  'paper-bundle',
  'solution-or-answer',
  'mock-or-sample',
  'reference',
  'unknown',
]);
export const CorpusFormatZ = z.enum(['pdf', 'jpeg', 'other']);

export const DiscoveredCorpusEntryZ = z.object({
  id: z.string().min(1),
  source: CorpusSourceZ,
  filename: z.string().min(1),
  fetch_url: z.string().url(),
});

export const CorpusEntryZ = DiscoveredCorpusEntryZ.extend({
  classification: CorpusClassificationZ,
  paper: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable(),
  year: z.number().int().min(1900).max(2100).nullable(),
  session: z.enum(['january', 'may-june']).nullable(),
  eligible_for_pattern_analysis: z.boolean(),
  exclusion_reasons: z.array(z.string()),
  fetch: z.discriminatedUnion('status', [
    z.object({
      status: z.literal('ok'),
      http_status: z.number().int(),
      content_type: z.string(),
      bytes: z.number().int().nonnegative(),
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
      format: CorpusFormatZ,
    }),
    z.object({
      status: z.literal('failed'),
      http_status: z.number().int().nullable(),
      error: z.string().min(1),
    }),
  ]),
  duplicate_group: z.string().nullable(),
  duplicate_of: z.string().nullable(),
  exam_key: z.string().nullable(),
  same_exam_group: z.string().nullable(),
  same_exam_of: z.string().nullable(),
});

export type DiscoveredCorpusEntry = z.infer<typeof DiscoveredCorpusEntryZ>;
export type CorpusEntry = z.infer<typeof CorpusEntryZ>;
export type CorpusClassification = z.infer<typeof CorpusClassificationZ>;

export const CorpusInventoryZ = z.object({
  schema_version: z.literal(1),
  generated_at: z.string().datetime(),
  mode: z.literal('unlicensed-metadata-only'),
  policy: z.object({
    raw_files_retained: z.literal(false),
    extracted_question_content_retained: z.literal(false),
    purpose: z.string().min(1),
  }),
  sources: z.array(z.object({
    id: CorpusSourceZ,
    landing_url: z.string().url(),
    discovered_entries: z.number().int().nonnegative(),
  })).length(2),
  summary: z.object({
    listed_entries: z.number().int().nonnegative(),
    fetched_entries: z.number().int().nonnegative(),
    failed_entries: z.number().int().nonnegative(),
    unique_file_hashes: z.number().int().nonnegative(),
    exact_duplicate_groups: z.number().int().nonnegative(),
    same_exam_groups: z.number().int().nonnegative(),
    eligible_entries: z.number().int().nonnegative(),
    classifications: z.record(CorpusClassificationZ, z.number().int().nonnegative()),
  }),
  entries: z.array(CorpusEntryZ),
});

export type CorpusInventory = z.infer<typeof CorpusInventoryZ>;

const decodeHtml = (value: string) => value
  .replaceAll('&amp;', '&')
  .replaceAll('&#8211;', '–')
  .replaceAll('&#8212;', '—')
  .replaceAll('&#039;', "'")
  .replaceAll('&quot;', '"');

export function parseCsecHubManifest(renderedHtml: string): DiscoveredCorpusEntry[] {
  const baseMatch = renderedHtml.match(/const BASE_URL = "([^"]+)"/);
  const filenamesMatch = renderedHtml.match(/const FILENAMES = \[([\s\S]*?)\];/);
  if (!baseMatch || !filenamesMatch) throw new Error('CSECHub manifest constants were not found');

  const baseUrl = baseMatch[1];
  const filenames = [...filenamesMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  return z.array(DiscoveredCorpusEntryZ).min(1).parse(filenames.map((filename) => ({
    id: `csechub:${filename}`,
    source: 'csechub',
    filename,
    fetch_url: new URL(filename, baseUrl).toString(),
  })));
}

export function parseDriveFolderHtml(html: string): DiscoveredCorpusEntry[] {
  const matches = [...html.matchAll(
    /<div class="flip-entry" id="entry-([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/g,
  )];
  return z.array(DiscoveredCorpusEntryZ).min(1).parse(matches.map((match) => {
    const remoteId = match[1];
    const filename = decodeHtml(match[2].trim());
    return {
      id: `csecpastpapers-drive:${remoteId}`,
      source: 'csecpastpapers-drive',
      filename,
      fetch_url: `https://drive.usercontent.google.com/download?id=${encodeURIComponent(remoteId)}&export=download&confirm=t`,
    };
  }));
}

export function classifyCorpusFilename(filename: string): {
  classification: CorpusClassification;
  paper: 1 | 2 | 3 | null;
  year: number | null;
  session: 'january' | 'may-june' | null;
} {
  const normalized = filename.toLowerCase().replaceAll('_', ' ');
  const paperMatch = normalized.match(/(?:\bp|\bpaper\s*)([123])\b/);
  const paper = paperMatch ? Number(paperMatch[1]) as 1 | 2 | 3 : null;
  const yearMatches = [...normalized.matchAll(/(?:19|20)\d{2}/g)].map((match) => Number(match[0]));
  const year = yearMatches.at(-1) ?? null;
  const session = /\bjan(?:uary)?\b/.test(normalized)
    ? 'january'
    : /\b(?:may|june|july|mj)\b/.test(normalized)
      ? 'may-june'
      : null;

  let classification: CorpusClassification = 'unknown';
  if (/solution|answer/.test(normalized)) classification = 'solution-or-answer';
  else if (/mock|sample|specimen/.test(normalized)) classification = 'mock-or-sample';
  else if (/formula/.test(normalized)) classification = 'reference';
  else if (/sorted by topic|past papers|\bto\b/.test(normalized)) classification = 'paper-bundle';
  else if (paper !== null && year !== null) classification = 'question-paper';

  return { classification, paper, year, session };
}

export function determineEligibility(args: {
  classification: CorpusClassification;
  paper: 1 | 2 | 3 | null;
  format: 'pdf' | 'jpeg' | 'other' | null;
  fetchSucceeded: boolean;
}): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!args.fetchSucceeded) reasons.push('fetch-failed');
  if (args.format !== 'pdf') reasons.push('not-pdf');
  if (!['question-paper', 'paper-bundle'].includes(args.classification)) {
    reasons.push(`classification:${args.classification}`);
  }
  if (args.classification === 'paper-bundle') reasons.push('bundle-requires-page-level-deduplication');
  if (args.paper === 3) reasons.push('paper-3-out-of-scope');
  if (args.paper === null && args.classification !== 'paper-bundle') reasons.push('paper-unverified');
  return { eligible: reasons.length === 0, reasons };
}
