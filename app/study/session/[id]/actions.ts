'use server';

import { z } from 'zod';
import { dbConnect, Attempt, PracticeSession, Question, SessionDraft } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { markMcq, markStructuredParts } from '@/lib/grade/mark';
import { GRADER_VERSION, questionFingerprint } from '@/lib/grade/version';
import { answersEquivalentAny } from '@/lib/grade/equivalence';
import { componentsEquivalent, composeAnswer } from '@/lib/grade/components';
import { missReason } from '@/lib/grade/reason';
import { earnableByMethod } from '@/lib/grade/method-marks';
import { readInputShape } from '@/lib/grade/input-shape';
import { renderMathHtml } from '@/lib/katex';
import type { ProfileMarks, QuestionPart, RubricItem, TemplateName } from '@/lib/types';
import { ANSWER_REF_RE } from '@/lib/notation';
import { renderVisual } from '@/lib/visuals';
import { constructActs, constructFamily, figureGivesAnswer } from '@/lib/targets/construct';

const SubmitZ = z.object({
  sessionId: z.string().regex(/^[a-f0-9]{24}$/),
  questionIndex: z.number().int().min(0),
  // mcq: single entry with label 'a' whose answer is the option index.
  // a-j and up to 10: the part cap rose from 6 in R1.6 §5 and this schema did
  // not follow, so a 7-part question could not be submitted at all.
  // R1.8: answers are addressed by slot — 'a.i', 'b.r5.S' — up to 8 slots
  // across 10 lettered parts.
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
  working: z.string().max(10000).default(''),
  durationMs: z.number().int().min(0).max(60 * 60 * 1000).catch(0),
});

export interface Feedback {
  correct: boolean;
  profile_marks: ProfileMarks;
  rubric_awarded: string[];
  /** Per slot: whether it earned its marks, and when it did not, why. */
  partResults: { label: string; correct: boolean; reason?: string }[];
  feedbackTitleHtml: string;
  feedbackHtml: string;
  isMisconception: boolean;
  /** Right value, wrong required form (R1.6 §2). */
  formatFeedback?: string;
  /**
   * The figure, for a construct question only. It is the ANSWER to part (a) —
   * showing it beside the question would hand the student every read the later
   * parts ask for — so it travels back with the marking, as the answers do,
   * and is not in the page the student is answering on.
   */
  /**
   * What to check the drawing against. A figure when the question's own figure
   * IS the answer; otherwise the written description of what should have been
   * drawn, because there is no stored picture of it.
   */
  construction?: { figureHtml: string; describes?: string; acts: string[] };
  /**
   * The attempt just written. A photograph of the working is attached to it
   * afterwards (R2 §2), never before: the typed answers are the deterministic
   * record and the reveal must not influence what gets photographed.
   */
  attemptId: string;
  /**
   * How many rubric rows a photograph of the working could still earn. Zero
   * means the camera is not offered: nothing is on offer, so it would cost the
   * student their time and us a model call for a foregone conclusion.
   */
  earnableByMethod: number;
}

export async function submitAnswer(input: {
  sessionId: string;
  questionIndex: number;
  answers: { label: string; answer: string; values?: string[] }[];
  working?: string;
  durationMs?: number;
}): Promise<Feedback | { error: string }> {
  const auth = await requireSession();
  const parsed = SubmitZ.safeParse({ working: '', durationMs: 0, ...input });
  if (!parsed.success) return { error: 'Invalid submission.' };
  const { sessionId, questionIndex, answers, working, durationMs } = parsed.data;

  await dbConnect();
  const session = await PracticeSession.findOne({
    _id: sessionId,
    student_id: auth.student_id,
  }).lean<{ question_ids: unknown[] } | null>();
  if (!session) return { error: 'Session not found.' };

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
  let partResults: { label: string; correct: boolean }[];
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
      return { ...a, values, text: composeAnswer(values, readInputShape(slot.answer).shape) };
    });
    const inputs = entered.map((a) => ({ ref: a.label, answer: a.text, working, values: a.values }));
    result = markStructuredParts(question.rubric ?? [], parts, inputs);
    const inputByRef = new Map(entered.map((a) => [a.label, a]));
    partResults = parts.flatMap((p) =>
      p.slots
        .filter((slot) => (slot.response_mode ?? 'answer') === 'answer')
        .map((slot) => {
          const ref = `${p.label}.${slot.label}`;
          const given = inputByRef.get(ref);
          const correct = given?.values?.length
            ? componentsEquivalent(given.values, slot.answer, slot.accept)
            : answersEquivalentAny(given?.text ?? '', slot.answer, slot.accept);
          return {
            label: ref,
            correct,
            // Said beside the box, not only as a struck-through code in a strip
            // at the bottom. A cross on its own reports that something is wrong
            // and nothing about what.
            reason: correct
              ? undefined
              : missReason(given?.text ?? '', slot.answer, given?.values),
          };
        }),
    );
    storedAnswer = entered.map((a) => `(${a.label}) ${a.text}`).join('; ');
  }

  // The draft was scratch for an unanswered question. The attempt is now the
  // record, so the scratch goes.
  await SessionDraft.deleteOne({ session_id: sessionId, question_index: questionIndex });

  // Append-only: attempts are never mutated (§3.5).
  const written = await Attempt.create({
    student_id: auth.student_id,
    question_id: session.question_ids[questionIndex],
    session_id: sessionId,
    answer: storedAnswer,
    rubric_awarded: result.rubric_awarded,
    profile_marks: result.profile_marks,
    correct: result.correct,
    duration_ms: durationMs,
    grader_version: GRADER_VERSION,
    question_fingerprint: questionFingerprint(question as never),
    ts: new Date(),
  });

  // Miss -> matching misconception remediation, else worked solution.
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
      // THE FIGURE IS ONLY THE CONSTRUCTION WHEN IT IS THE ANSWER.
      //
      // A pattern question's figure is Figures 1 to 3 — the premise the student
      // was given and had to continue. Rendering it under "your drawing should
      // look like this" hands back the question as though it were the answer,
      // and a student checking their Figure 4 against Figures 1 to 3 is being
      // told they got it wrong by an image of something else. Fifteen of the
      // sixty construct questions in the bank are this family.
      //
      // What those questions DO have is the construct slot's written answer,
      // which says what the drawing should show. That is what to check against.
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

  return {
    correct: result.correct,
    profile_marks: result.profile_marks,
    rubric_awarded: result.rubric_awarded,
    partResults,
    feedbackTitleHtml,
    feedbackHtml,
    isMisconception,
    formatFeedback: 'format_feedback' in result ? result.format_feedback : undefined,
    construction,
    attemptId: String(written._id),
    earnableByMethod:
      question.kind === 'structured'
        ? earnableByMethod(question as never, result.rubric_awarded).length
        : 0,
  };
}


const DraftZ = z.object({
  sessionId: z.string().regex(/^[a-f0-9]{24}$/),
  questionIndex: z.number().int().min(0).max(99),
  answers: z.record(z.string().regex(ANSWER_REF_RE), z.string().max(2000)).default({}),
  values: z.record(z.string().regex(ANSWER_REF_RE), z.array(z.string().max(200)).max(24)).default({}),
  selected: z.number().int().min(0).max(9).optional(),
  working: z.string().max(10000).default(''),
});

/**
 * Keep what has been typed so far, so a question survives a phone call.
 *
 * Writes a DRAFT, never an attempt: attempts are append-only and are written
 * once, on submit. This is overwritten on every save and deleted when the
 * answer is handed in, and nothing reads it except the page that restores it.
 */
export async function saveDraft(input: {
  sessionId: string;
  questionIndex: number;
  answers?: Record<string, string>;
  values?: Record<string, string[]>;
  selected?: number;
  working?: string;
}): Promise<{ ok: boolean }> {
  const auth = await requireSession();
  const parsed = DraftZ.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { sessionId, questionIndex, answers, values, selected, working } = parsed.data;

  await dbConnect();
  // The session has to be this student's, or a draft is a way to write to
  // someone else's row.
  const owned = await PracticeSession.exists({ _id: sessionId, student_id: auth.student_id });
  if (!owned) return { ok: false };

  await SessionDraft.updateOne(
    { session_id: sessionId, question_index: questionIndex },
    { $set: { answers, values, selected, working, updated_at: new Date() } },
    { upsert: true },
  );
  return { ok: true };
}
