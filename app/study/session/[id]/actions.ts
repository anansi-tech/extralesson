'use server';

import { z } from 'zod';
import { dbConnect, Attempt, PracticeSession, Question, SessionDraft, Transcription } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { markMcq, markStructuredParts, markableSlots } from '@/lib/grade/mark';
import { GRADER_VERSION, questionFingerprint, rubricHash } from '@/lib/grade/version';
import { answersEquivalentAny } from '@/lib/grade/equivalence';
import { componentsEquivalent, composeAnswer } from '@/lib/grade/components';
import { forStudent, missReason, schemeLine } from '@/lib/grade/reason';
import { earnableByMethod } from '@/lib/grade/method-marks';
import { readInputShape } from '@/lib/grade/input-shape';
import { renderMathHtml } from '@/lib/katex';
import type { ProfileMarks, QuestionPart, RubricItem, TemplateName } from '@/lib/types';
import { ANSWER_REF_RE } from '@/lib/notation';
import { renderVisual } from '@/lib/visuals';
import { constructActs, constructFamily, figureGivesAnswer } from '@/lib/targets/construct';
import { markWorking, type CaptureResult } from './mark-working';
import { MAX_TAKES, type TranscriptionResult } from '@/lib/grade/transcribe';
import { isDuplicateKey } from '@/lib/db';
import { splitStoredAnswer } from '@/lib/study/attempt-answers';

const SubmitZ = z.object({
  sessionId: z.string().regex(/^[a-f0-9]{24}$/),
  questionIndex: z.number().int().min(0),
  // mcq: single entry with label 'a' whose answer is the option index.
  // Otherwise answers are addressed by slot — 'a.i', 'b.r5.S' — up to 8 slots
  // across 10 lettered parts (ROUND_1_8).
  answers: z
    .array(
      z.object({
        label: z.string().regex(ANSWER_REF_RE),
        // Empty is a legitimate answer: a candidate leaves a blank and hands
        // the paper in, and a blank is marked wrong. Requiring a character here
        // would reject the whole submission over one unanswered slot (§2).
        answer: z.string().max(2000),
        // One entry per box, when the slot was rendered as a typed input. The
        // student never typed a delimiter, so marking never parses one: these
        // are compared with the mark scheme value in the SAME POSITION.
        values: z.array(z.string().max(200)).max(24).optional(),
      }),
    )
    .min(1)
    .max(40),
  durationMs: z.number().int().min(0).max(60 * 60 * 1000).catch(0),
});

export interface Feedback {
  correct: boolean;
  profile_marks: ProfileMarks;
  rubric_awarded: string[];
  /**
   * Per slot: whether the VALUE was right, whether a form row was withheld,
   * and for a wrong value the scheme's own line for the slot.
   */
  partResults: { label: string; correct: boolean; formWithheld?: boolean; reasonHtml?: string }[];
  feedbackTitleHtml: string;
  feedbackHtml: string;
  isMisconception: boolean;
  /** Right value, wrong required form (R1.6 §2). */
  formatFeedbackHtml?: string;
  /**
   * What to check the drawing against, travelling back with the marking and
   * never on the page being answered: the figure when the figure IS the answer,
   * otherwise the written description, there being no stored picture of it.
   */
  construction?: { figureHtml: string; describes?: string; acts: string[] };
  /**
   * The attempt just written. A photograph of the working is attached to it
   * afterwards (ROUND_2 §2), never before: the typed answers are the
   * deterministic record and the reveal must not influence the photograph.
   */
  attemptId: string;
  /**
   * How many rubric rows a photograph of the working could still earn. Zero
   * means the camera is not offered: it would cost the student time and us a
   * model call for a foregone conclusion.
   */
  earnableByMethod: number;
  /** A page photographed before submit, now linked to the attempt and marked. */
  working?: CaptureResult;
}

export async function submitAnswer(input: {
  sessionId: string;
  questionIndex: number;
  answers: { label: string; answer: string; values?: string[] }[];
  durationMs?: number;
}): Promise<Feedback | { error: string }> {
  const auth = await requireSession();
  const parsed = SubmitZ.safeParse({ durationMs: 0, ...input });
  if (!parsed.success) return { error: 'Invalid submission.' };
  const { sessionId, questionIndex, answers, durationMs } = parsed.data;

  await dbConnect();
  const session = await PracticeSession.findOne({
    _id: sessionId,
    student_id: auth.student_id,
  }).lean<{ question_ids: unknown[] } | null>();
  if (!session) return { error: 'Session not found.' };

  // A question already answered is read back, never re-marked: the unique
  // index on {session_id, question_index} makes the double submit below a
  // read too, so a second tap can neither insert nor mark twice.
  const already = await Attempt.findOne({ session_id: sessionId, question_index: questionIndex }).lean<StoredAttempt | null>();
  if (already) return feedbackFor(already, sessionId, questionIndex);
  const attemptCount = await Attempt.countDocuments({ session_id: sessionId });
  if (questionIndex !== attemptCount || questionIndex >= session.question_ids.length) {
    return { error: 'Out of sequence — reload the page.' };
  }

  const question = await Question.findById(session.question_ids[questionIndex]).lean<{
    kind: 'mcq' | 'structured';
    options?: string[];
    answer_key?: number;
    profile?: 'CK' | 'AK' | 'R';
    marks: number;
    parts?: QuestionPart[];
    rubric?: RubricItem[];
    stimulus?: string;
    stem: string;
    visual?: { template: TemplateName; params: Record<string, unknown> };
    worked_solution: string;
    misconceptions: { trigger: string; name: string; remediation: string }[];
  } | null>();
  if (!question) return { error: 'Question not found.' };

  let result;
  let partResults: Feedback['partResults'];
  let storedAnswer: string | number;
  if (question.kind === 'mcq') {
    const idx = Number(answers[0]?.answer);
    storedAnswer = idx;
    result = markMcq(question.profile!, question.marks, idx, question.answer_key!);
    partResults = [{ label: 'a', correct: result.correct }];
  } else {
    const parts = question.parts ?? [];
    const slotByRef = new Map(
      parts.flatMap((p) =>
        p.slots.map((slot) => [`${p.label}.${slot.label}` as string, slot] as const),
      ),
    );
    // A typed slot arrives as values, not as a line of text. The line is
    // composed HERE, from the shape of the mark scheme answer, so the record
    // reads the way the papers write it and nothing has to guess a delimiter.
    const entered = answers.map((a) => {
      const slot = slotByRef.get(a.label);
      const values = a.values?.map((v) => v.trim()).filter(Boolean) ?? [];
      if (!slot?.answer || values.length === 0) return { ...a, values: undefined, text: a.answer };
      const reading = readInputShape(slot.answer);
      return { ...a, values, text: composeAnswer(values, reading.shape, reading) };
    });
    const inputs = entered.map((a) => ({ ref: a.label, answer: a.text, values: a.values }));
    const marked = markStructuredParts(question.rubric ?? [], parts, inputs);
    result = marked;
    const inputByRef = new Map(entered.map((a) => [a.label, a]));
    const slotByRef2 = new Map(parts.flatMap((p) => p.slots.map((s) => [`${p.label}.${s.label}` as string, s] as const)));
    // A wrong value is told the scheme's line for the slot, never a comment on
    // the answer; a cross on its own says nothing a student can act on.
    partResults = marked.slot_results.map((s) => {
      const given = inputByRef.get(s.ref);
      const slot = slotByRef2.get(s.ref);
      const line = s.correct ? undefined : schemeLine(question.rubric ?? [], s.ref) ?? missReason(given?.text ?? '', slot?.answer ?? '', given?.values);
      return { label: s.ref, correct: s.correct, formWithheld: s.form_withheld, reasonHtml: line ? renderMathHtml(forStudent(line)) : undefined };
    });
    storedAnswer = entered.map((a) => `(${a.label}) ${a.text}`).join('; ');
  }

  // The draft was scratch for an unanswered question. The attempt is now the
  // record, so the scratch goes.
  await SessionDraft.deleteOne({ session_id: sessionId, question_index: questionIndex });

  // Append-only: attempts are never mutated (§3.5).
  let written;
  try {
    written = await Attempt.create({
      student_id: auth.student_id,
      question_id: session.question_ids[questionIndex],
      session_id: sessionId,
      question_index: questionIndex,
      answer: storedAnswer,
      rubric_awarded: result.rubric_awarded,
      profile_marks: result.profile_marks,
      correct: result.correct,
      duration_ms: durationMs,
      grader_version: GRADER_VERSION,
      question_fingerprint: questionFingerprint(question as never),
      rubric_hash: rubricHash(question.rubric),
      rubric: question.rubric?.map(({ code, profile, criterion, mark_value, slot_ref, part_label, for_format }) => ({ code, profile, criterion, mark_value, slot_ref, part_label, for_format })),
      ts: new Date(),
    });
  } catch (e) {
    if (!isDuplicateKey(e)) throw e;
    // The other submit landed first: its attempt is the record.
    const theirs = await Attempt.findOne({ session_id: sessionId, question_index: questionIndex }).lean<StoredAttempt | null>();
    if (!theirs) throw e;
    return feedbackFor(theirs, sessionId, questionIndex);
  }

  let feedbackTitleHtml = 'Worked solution';
  let feedbackHtml = renderMathHtml(question.worked_solution);
  let isMisconception = false;
  if (!result.correct) {
    const wrongAnswers =
      question.kind === 'mcq'
        ? [question.options?.[Number(answers[0]?.answer)] ?? String(answers[0]?.answer)]
        : partResults.filter((p) => !p.correct).map((p) => answers.find((a) => a.label === p.label)?.answer ?? '');
    const match = question.misconceptions.find((m) =>
      wrongAnswers.some((w) => answersEquivalentAny(w, m.trigger)),
    );
    if (match) {
      feedbackTitleHtml = renderMathHtml(match.name);
      feedbackHtml = renderMathHtml(match.remediation);
      isMisconception = true;
    }
  }

  // The construction, released now that the reads are committed. The acts are
  // the family's, not the question's: they are what an examiner credits for
  // that kind of drawing, which does not vary question to question.
  let construction: Feedback['construction'];
  const family = constructFamily(question.visual?.template);
  if (
    family &&
    (question.parts ?? []).some((p) => p.slots?.some((sl) => sl.response_mode === 'construct'))
  ) {
    try {
      // The figure is only the construction when it IS the answer. A pattern
      // question's figure is the premise the student was given, so showing it
      // as "your drawing should look like this" hands back the question and
      // tells a correct student they got it wrong. Those questions have the
      // construct slot's written answer instead, which says what to check.
      const givesAnswer = figureGivesAnswer(question.visual?.template as never);
      const constructSlot = (question.parts ?? [])
        .flatMap((p) => p.slots ?? [])
        .find((sl) => sl.response_mode === 'construct');
      construction = {
        figureHtml: givesAnswer
          ? renderVisual(question.visual as never, {
              stimulus: question.stimulus,
              stem: question.stem,
              partPrompts: (question.parts ?? []).flatMap((p) => [
                p.prompt,
                ...(p.slots ?? []).map((sl) => sl.prompt ?? ''),
              ]),
            })
          : '',
        describes: givesAnswer ? undefined : renderMathHtml(constructSlot?.answer ?? ''),
        acts: constructActs(question.visual),
      };
    } catch {
      construction = undefined;
    }
  }

  // A read taken before submit is marked now, from what was stored then.
  const photographed = await Transcription.exists({ session_id: sessionId, question_index: questionIndex });
  const working = photographed ? (await markWorking(String(written._id))) ?? undefined : undefined;
  const earnedByPhoto = working?.method.filter((m) => m.awarded).map((m) => m.code) ?? [];

  return {
    correct: result.correct,
    profile_marks: result.profile_marks,
    rubric_awarded: result.rubric_awarded,
    partResults,
    feedbackTitleHtml,
    feedbackHtml,
    isMisconception,
    formatFeedbackHtml: result.format_feedback ? renderMathHtml(result.format_feedback) : undefined,
    construction,
    attemptId: String(written._id),
    earnableByMethod:
      question.kind === 'structured'
        ? earnableByMethod(question as never, [...result.rubric_awarded, ...earnedByPhoto]).length
        : 0,
    working,
  };
}


interface StoredAttempt {
  _id: unknown;
  question_id: unknown;
  answer: string | number;
  rubric_awarded: string[];
  profile_marks: ProfileMarks;
  correct: boolean;
}

/**
 * THE OUTCOME OF AN ATTEMPT THAT ALREADY EXISTS (ROUND_6 Task 4): the marks
 * are what was stored, the per-slot verdicts are recomputed from the stored
 * answers with the same grader, and the marked read comes back as it stands.
 * Nothing here writes, marks, or reads an image.
 */
async function feedbackFor(attempt: StoredAttempt, sessionId: string, questionIndex: number): Promise<Feedback | { error: string }> {
  const question = await Question.findById(attempt.question_id).lean<{
    kind: 'mcq' | 'structured';
    parts?: QuestionPart[];
    rubric?: RubricItem[];
    worked_solution: string;
  } | null>();
  if (!question) return { error: 'Question not found.' };
  let partResults: Feedback['partResults'] = [{ label: 'a', correct: attempt.correct }];
  if (question.kind === 'structured') {
    const parts = question.parts ?? [];
    const refs = markableSlots(parts);
    const answers = splitStoredAnswer(String(attempt.answer), refs);
    const marked = markStructuredParts(question.rubric ?? [], parts, refs.map((ref) => ({ ref, answer: answers[ref] ?? '' })));
    partResults = marked.slot_results.map((sr) => {
      const line = sr.correct ? undefined : schemeLine(question.rubric ?? [], sr.ref);
      return { label: sr.ref, correct: sr.correct, formWithheld: sr.form_withheld, reasonHtml: line ? renderMathHtml(forStudent(line)) : undefined };
    });
  }
  const read = await Transcription.findOne({ session_id: sessionId, question_index: questionIndex, marker_version: { $exists: true } })
    .sort({ take: -1 })
    .lean<{ _id: unknown; take: number; lines: TranscriptionResult['lines']; answers?: TranscriptionResult['answers']; legible: boolean; notes?: string; method_marks?: { code: string; awarded: boolean; reason: string; mark_value: number }[]; slips?: { part: string; quote: string; sentence: string }[] } | null>();
  const working: CaptureResult | undefined = read
    ? {
        transcription: { lines: read.lines, answers: read.answers ?? [], legible: read.legible, notes: read.notes },
        transcriptionId: String(read._id),
        rejected: [],
        take: read.take,
        takesLeft: MAX_TAKES - (await Transcription.countDocuments({ session_id: sessionId, question_index: questionIndex })),
        method: (read.method_marks ?? []).map(({ code, awarded, reason, mark_value }) => ({ code, awarded, reason, mark_value })),
        marksAdded: (read.method_marks ?? []).filter((m) => m.awarded).reduce((n, m) => n + m.mark_value, 0),
        slips: read.slips ?? [],
        marked: true,
      }
    : undefined;
  return {
    correct: attempt.correct,
    profile_marks: attempt.profile_marks,
    rubric_awarded: attempt.rubric_awarded,
    partResults,
    feedbackTitleHtml: 'Worked solution',
    feedbackHtml: renderMathHtml(question.worked_solution),
    isMisconception: false,
    attemptId: String(attempt._id),
    earnableByMethod: 0,
    working,
  };
}

const DraftZ = z.object({
  sessionId: z.string().regex(/^[a-f0-9]{24}$/),
  questionIndex: z.number().int().min(0).max(99),
  answers: z.record(z.string().regex(ANSWER_REF_RE), z.string().max(2000)).default({}),
  values: z.record(z.string().regex(ANSWER_REF_RE), z.array(z.string().max(200)).max(24)).default({}),
  selected: z.number().int().min(0).max(9).optional(),
});

/**
 * Keep what has been typed so far, so a question survives a phone call. Writes
 * a DRAFT, never an attempt: attempts are append-only and written once, on
 * submit. Overwritten on every save, deleted when the answer is handed in.
 */
export async function saveDraft(input: {
  sessionId: string;
  questionIndex: number;
  answers?: Record<string, string>;
  values?: Record<string, string[]>;
  selected?: number;
}): Promise<{ ok: boolean }> {
  const auth = await requireSession();
  const parsed = DraftZ.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { sessionId, questionIndex, answers, values, selected } = parsed.data;

  await dbConnect();
  // The session has to be this student's, or a draft is a way to write to
  // someone else's row.
  const owned = await PracticeSession.exists({ _id: sessionId, student_id: auth.student_id });
  if (!owned) return { ok: false };

  await SessionDraft.updateOne(
    { session_id: sessionId, question_index: questionIndex },
    { $set: { answers, values, selected, updated_at: new Date() } },
    { upsert: true },
  );
  return { ok: true };
}
