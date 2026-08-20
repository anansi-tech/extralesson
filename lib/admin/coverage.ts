import { Blueprint, Question, Topic } from '@/lib/db';
import { computeMatrix, type Matrix, type QuestionFacts } from '@/lib/targets/matrix';
import { hasShowThat } from '@/lib/targets/show-that';
import type { ModuleNumber, Profile } from '@/lib/types';

// R1.5 §4 — separate P1/P2 target matrices replace the combined coverage.
// Deficits are reported by module, objective, paper, difficulty, profile,
// archetype, and representation.

interface LeanQuestion {
  _id: unknown;
  kind: 'mcq' | 'structured';
  module: ModuleNumber;
  objective_ids: string[];
  representation?: QuestionFacts['representation'];
  archetype?: QuestionFacts['archetype'];
  difficulty: 1 | 2 | 3;
  marks: number;
  profile?: Profile;
  rubric?: { profile: Profile; mark_value: number }[];
  parts?: { slots?: { objective_id?: string; response_mode?: string }[] }[];
  status: string;
}

function topicCodeFor(
  objectiveIds: string[],
  topics: { code: string; module: number; order: number }[],
): string {
  const first = objectiveIds[0] ?? '';
  const m = first.match(/^M([123])\.(\d+)\./);
  if (!m) return '';
  const topic = topics.find((t) => t.module === Number(m[1]) && t.order === Number(m[2]));
  return topic?.code ?? '';
}

export function toFacts(
  q: LeanQuestion,
  topics: { code: string; module: number; order: number }[],
): QuestionFacts {
  const profile_marks: Record<Profile, number> = { CK: 0, AK: 0, R: 0 };
  if (q.kind === 'mcq') {
    if (q.profile) profile_marks[q.profile] = 1;
  } else {
    for (const r of q.rubric ?? []) profile_marks[r.profile] += r.mark_value;
  }
  return {
    kind: q.kind,
    module: q.module,
    topic_code: topicCodeFor(q.objective_ids, topics),
    topic_span: new Set(q.objective_ids.map((id) => topicCodeFor([id], topics))).size,
    objective_span: new Set(
      (q.parts ?? []).flatMap((part) => (part.slots ?? []).map((sl) => sl.objective_id).filter(Boolean)),
    ).size,
    has_construct: (q.parts ?? []).some((part) =>
      (part.slots ?? []).some((sl) => sl.response_mode === 'construct'),
    ),
    has_show_that: hasShowThat(q.parts),
    representation: q.representation ?? 'prose',
    archetype: q.archetype ?? 'multi-step-application',
    difficulty: q.difficulty,
    marks: q.marks,
    rubric_profile_marks: profile_marks,
  };
}

export interface CoverageBundle {
  matrix: Matrix;
  draftsRemaining: number;
  approvedTotal: number;
  objectiveApproved: Map<string, number>;
}

export async function getCoverage(): Promise<CoverageBundle> {
  const [topics, blueprints, questions] = await Promise.all([
    Topic.find().lean<{ code: string; title: string; module: ModuleNumber; order: number }[]>(),
    Blueprint.find().lean<
      { paper: 'P1' | 'P2'; module: number; allocations: { topic_codes: string[]; items?: number; marks?: number }[] }[]
    >(),
    Question.find({ status: { $in: ['draft', 'approved'] } })
      .select('kind module objective_ids representation archetype difficulty marks profile rubric status parts')
      .lean<LeanQuestion[]>(),
  ]);

  const matrix = computeMatrix(
    topics,
    blueprints,
    questions.map((q) => toFacts(q, topics)),
  );

  const objectiveApproved = new Map<string, number>();
  let draftsRemaining = 0;
  let approvedTotal = 0;
  for (const q of questions) {
    if (q.status === 'approved') {
      approvedTotal++;
      for (const id of q.objective_ids) {
        objectiveApproved.set(id, (objectiveApproved.get(id) ?? 0) + 1);
      }
    } else {
      draftsRemaining++;
    }
  }

  return { matrix, draftsRemaining, approvedTotal, objectiveApproved };
}

// Queue order (R1.5 unchanged principle): review drafts from the topic with
// the largest outstanding deficit first.
export async function getNextDraftId(): Promise<string | null> {
  const { matrix } = await getCoverage();
  const ordered = [...matrix.topics].sort((a, b) => {
    const cov = (t: typeof a) =>
      (t.p1_actual + t.p2_marks_actual) / Math.max(1, t.p1_target + t.p2_marks_target);
    return cov(a) - cov(b);
  });
  for (const t of ordered) {
    const m = t.code.match(/^M(\d)-/);
    const topicDoc = await Topic.findOne({ code: t.code }).select('module order').lean<{
      module: number;
      order: number;
    } | null>();
    if (!topicDoc || !m) continue;
    const prefix = `M${topicDoc.module}\\.${topicDoc.order}\\.`;
    const q = await Question.findOne({
      status: 'draft',
      objective_ids: { $regex: `^${prefix}` },
    })
      .select('_id')
      .lean<{ _id: unknown } | null>();
    if (q) return String(q._id);
  }
  const any = await Question.findOne({ status: 'draft' }).select('_id').lean<{ _id: unknown } | null>();
  return any ? String(any._id) : null;
}
