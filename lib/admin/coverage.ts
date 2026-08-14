import { Blueprint, Question, Topic } from '@/lib/db';
import { topicWeights } from '@/lib/mastery/fold';

// Coverage vs blueprint targets (ROUND_1 §5): the 400-question bank target is
// distributed across topics proportionally to their blueprint weight
// (P1 items + P2 mark share). Queue order = lowest coverage first.

export const BANK_TARGET = 400;

export interface TopicCoverage {
  code: string;
  title: string;
  module: 1 | 2 | 3;
  order: number;
  objectivePrefix: string; // 'M1.5.'
  target: number;
  approved: number;
  drafts: number;
}

export async function getCoverage(): Promise<{
  topics: TopicCoverage[];
  approvedTotal: number;
  draftsRemaining: number;
}> {
  const [topics, blueprints, questions] = await Promise.all([
    Topic.find().lean<{ code: string; title: string; module: 1 | 2 | 3; order: number }[]>(),
    Blueprint.find().lean<
      { paper: 'P1' | 'P2'; module: number; allocations: { topic_codes: string[]; items?: number; marks?: number }[] }[]
    >(),
    Question.find({ status: { $in: ['draft', 'approved'] } })
      .select('objective_ids status')
      .lean<{ objective_ids: string[]; status: string }[]>(),
  ]);

  const weights = new Map<string, number>();
  for (const mod of [1, 2, 3]) {
    for (const [code, w] of topicWeights(blueprints, mod)) weights.set(code, w);
  }
  const totalWeight = [...weights.values()].reduce((s, w) => s + w, 0);

  const byPrefix = new Map<string, TopicCoverage>();
  const result: TopicCoverage[] = topics
    .sort((a, b) => a.module - b.module || a.order - b.order)
    .map((t) => {
      const cov: TopicCoverage = {
        code: t.code,
        title: t.title,
        module: t.module,
        order: t.order,
        objectivePrefix: `M${t.module}.${t.order}.`,
        target: Math.round((BANK_TARGET * (weights.get(t.code) ?? 0)) / totalWeight),
        approved: 0,
        drafts: 0,
      };
      byPrefix.set(cov.objectivePrefix, cov);
      return cov;
    });

  let approvedTotal = 0;
  let draftsRemaining = 0;
  for (const q of questions) {
    const first = q.objective_ids[0];
    const prefix = first?.slice(0, first.lastIndexOf('.') + 1);
    const cov = prefix ? byPrefix.get(prefix) : undefined;
    if (q.status === 'approved') {
      approvedTotal++;
      if (cov) cov.approved++;
    } else {
      draftsRemaining++;
      if (cov) cov.drafts++;
    }
  }

  return { topics: result, approvedTotal, draftsRemaining };
}

// The next draft to review: from the topic with the lowest approved/target
// coverage that still has drafts waiting.
export async function getNextDraftId(): Promise<string | null> {
  const { topics } = await getCoverage();
  const ordered = topics
    .filter((t) => t.drafts > 0)
    .sort((a, b) => a.approved / Math.max(1, a.target) - b.approved / Math.max(1, b.target));
  for (const t of ordered) {
    const q = await Question.findOne({
      status: 'draft',
      objective_ids: { $regex: `^${t.objectivePrefix.replace(/\./g, '\\.')}` },
    })
      .select('_id')
      .lean<{ _id: unknown } | null>();
    if (q) return String(q._id);
  }
  // Fallback: any draft (covers questions whose objectives didn't map)
  const any = await Question.findOne({ status: 'draft' }).select('_id').lean<{ _id: unknown } | null>();
  return any ? String(any._id) : null;
}
