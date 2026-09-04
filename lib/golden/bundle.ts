import { Attempt, CapturedImage, LineRejected, MarkDispute, Question, Transcription } from '@/lib/db';
import { markableSlots } from '@/lib/grade/mark';
import { splitStoredAnswer } from '@/lib/study/attempt-answers';

/**
 * A DISPUTE AS A GOLDEN CASE (ROUND_5 Task 3): the exact shape of
 * design/golden, so the eval grows from the pages the product got wrong in
 * the field. Every rubric row is PROPOSED from what the marker and the grader
 * decided, the disputed row is flagged, and nothing here is ground truth
 * until a person approves it. No student identifier travels: writer is
 * "w-field", and the id is the read's, not the student's.
 */
export interface GoldenBundle {
  version: 1;
  id: string;
  image?: { filename: string; content_type: string; base64: string };
  set: {
    id: string;
    question_id: string;
    writer: 'w-field';
    mode: 'photo' | 'typed';
    image?: string;
    transcript: { part_label: string | null; text: string }[];
  };
  review: {
    id: string;
    case: string;
    student_answers: Record<string, string>;
    marks: { code: string; awarded: boolean; reason: string; proposed: true; disputed?: true }[];
    proposed: true;
  };
  source: { dispute_id: string; code: string; transcription_id: string; attempt_id: string; exported_at: string };
}

export async function buildGoldenBundle(disputeId: string): Promise<GoldenBundle | null> {
  const dispute = await MarkDispute.findById(disputeId).lean<{
    _id: unknown; attempt_id: unknown; transcription_id: unknown; code: string; ts: Date;
  } | null>();
  if (!dispute) return null;
  const read = await Transcription.findById(dispute.transcription_id).lean<{
    _id: unknown;
    question_id: unknown;
    lines: { part_label?: string | null; text: string }[];
    method_marks?: { code: string; awarded: boolean; reason: string }[];
  } | null>();
  const attempt = await Attempt.findById(dispute.attempt_id).lean<{ answer: string | number; rubric_awarded: string[] } | null>();
  if (!read || !attempt) return null;
  const question = await Question.findById(read.question_id).lean<{
    _id: unknown;
    parts?: { label: string; slots: { label: string; response_mode?: string }[] }[];
    rubric?: { code: string; criterion: string }[];
  } | null>();
  if (!question) return null;

  const rejected = new Set(
    (await LineRejected.find({ transcription_id: read._id }).select('line_index').lean<{ line_index: number }[]>()).map((r) => r.line_index),
  );
  const transcript = read.lines
    .filter((_, i) => !rejected.has(i))
    .map((l) => ({ part_label: l.part_label ?? null, text: l.text }));

  const image = await CapturedImage.findOne({ attempt_id: dispute.attempt_id })
    .sort({ take: -1 })
    .lean<{ data: Buffer; content_type: string } | null>();
  const id = `f-${String(read._id).slice(-6)}`;
  // Under field/, which is gitignored: a real student's page stays on the
  // machine that imported it, while the entry commits like any other.
  const filename = `field/${id}.${image?.content_type === 'image/png' ? 'png' : 'jpg'}`;

  const byMarker = new Map((read.method_marks ?? []).map((m) => [m.code, m]));
  const earned = new Set(attempt.rubric_awarded ?? []);
  const marks = (question.rubric ?? []).map((r) => {
    const m = byMarker.get(r.code);
    const verdict = m
      ? { awarded: m.awarded, reason: m.reason }
      : earned.has(r.code)
        ? { awarded: true, reason: 'Awarded by the grader on the typed answer.' }
        : { awarded: false, reason: 'Not earned by the typed answer, and not sent to the marker.' };
    return { code: r.code, ...verdict, proposed: true as const, ...(r.code === dispute.code ? { disputed: true as const } : {}) };
  });

  return {
    version: 1,
    id,
    // lean() hands back a bson Binary, whose bytes sit under .buffer.
    image: image ? { filename, content_type: image.content_type, base64: Buffer.from((image.data as unknown as { buffer?: Uint8Array }).buffer ?? image.data).toString('base64') } : undefined,
    set: {
      id,
      question_id: String(question._id),
      writer: 'w-field',
      mode: image ? 'photo' : 'typed',
      ...(image ? { image: filename } : {}),
      transcript,
    },
    review: {
      id,
      case: `Field dispute on ${dispute.code}: the student queried "${byMarker.get(dispute.code)?.reason ?? 'a withheld row'}".`,
      student_answers: splitStoredAnswer(String(attempt.answer), markableSlots(question.parts ?? [])),
      marks,
      proposed: true,
    },
    source: {
      dispute_id: String(dispute._id),
      code: dispute.code,
      transcription_id: String(read._id),
      attempt_id: String(dispute.attempt_id),
      exported_at: new Date().toISOString(),
    },
  };
}
