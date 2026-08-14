import targetsJson from '@/design/research/question-bank-targets.json';
import { Question, Topic } from '@/lib/db';
import { QuestionBankTargetsArtifactZ } from '@/lib/generation/question-bank-targets';
import { QuestionVisualZ } from '@/lib/validation/question-visual';

// Coverage vs blueprint targets (ROUND_1 §5): the 400-question bank target is
// distributed across topics proportionally to their blueprint weight
// (P1 items + P2 mark share). Queue order = lowest coverage first.

const bankTargets = QuestionBankTargetsArtifactZ.parse(targetsJson);
export const BANK_TARGET = bankTargets.summary.bank_target;

export interface TopicCoverage {
  code: string;
  title: string;
  module: 1 | 2 | 3;
  order: number;
  objectivePrefix: string; // 'M1.5.'
  target: number;
  targetMcq: number;
  targetStructured: number;
  targetVisual: number;
  approved: number;
  approvedMcq: number;
  approvedStructured: number;
  approvedVisual: number;
  drafts: number;
}

export async function getCoverage(): Promise<{
  topics: TopicCoverage[];
  bankTarget: number;
  approvedTotal: number;
  draftsRemaining: number;
}> {
  const [topics, questions] = await Promise.all([
    Topic.find().lean<{ code: string; title: string; module: 1 | 2 | 3; order: number }[]>(),
    Question.find({ status: { $in: ['draft', 'approved'] } })
      .select('objective_ids status kind visual')
      .lean<{ objective_ids: string[]; status: string; kind: 'mcq' | 'structured'; visual?: unknown }[]>(),
  ]);

  const targetsByTopic = new Map(bankTargets.topics.map((topic) => [topic.topic_code, topic]));

  const byPrefix = new Map<string, TopicCoverage>();
  const result: TopicCoverage[] = topics
    .sort((a, b) => a.module - b.module || a.order - b.order)
    .map((t) => {
      const target = targetsByTopic.get(t.code);
      const cov: TopicCoverage = {
        code: t.code,
        title: t.title,
        module: t.module,
        order: t.order,
        objectivePrefix: `M${t.module}.${t.order}.`,
        target: target?.target_questions.total ?? 0,
        targetMcq: target?.target_questions.mcq ?? 0,
        targetStructured: target?.target_questions.structured ?? 0,
        targetVisual: (target?.target_visual_questions.mcq ?? 0) +
          (target?.target_visual_questions.structured ?? 0),
        approved: 0,
        approvedMcq: 0,
        approvedStructured: 0,
        approvedVisual: 0,
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
      if (cov) {
        cov.approved++;
        if (q.kind === 'mcq') cov.approvedMcq++;
        else cov.approvedStructured++;
        if (QuestionVisualZ.safeParse(q.visual).success) cov.approvedVisual++;
      }
    } else {
      draftsRemaining++;
      if (cov) cov.drafts++;
    }
  }

  return { topics: result, bankTarget: BANK_TARGET, approvedTotal, draftsRemaining };
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
