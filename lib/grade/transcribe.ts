import { generateObject } from 'ai';
import { z } from 'zod';
import { reader, READER_MODEL_ID } from '@/lib/ai';

/**
 * READING A PHOTOGRAPHED PAGE, AND NOTHING ELSE.
 *
 * R2 §3. This call makes no marking judgment of any kind: it says what is on
 * the page and how sure it is, and the marking pass is a separate call over
 * what it produced. Keeping them apart is what makes the transcription
 * something a student can be shown and can argue with — "this is what we read"
 * — instead of a black box that returns a number.
 *
 * The mathematics is transcribed to the conventions the grader ALREADY parses.
 * A second dialect would mean a second equivalence layer, and the kill list
 * forbids one for the same reason we only have one money parser.
 */
/**
 * Two photographs of one question, then it stands (R2 §2).
 *
 * A retake is for a bad photograph, not for a better answer: the typed answers
 * are already submitted and marked, so nothing about the marks can change here.
 * The limit exists because an unbounded retake is an unbounded bill.
 *
 * It lives beside the reader rather than in the server action because a
 * 'use server' file may export only async functions, and the client needs to
 * know how many takes are left to label its own button.
 */
export const MAX_TAKES = 2;

export const TranscriptionLineZ = z.object({
  /**
   * The part this line belongs to, as the student labelled it. Real papers
   * require the question number beside the answer and students already write
   * it; a line with no label of its own inherits the one above.
   */
  part_label: z.string().max(4).nullable(),
  slot_label: z.string().max(30).nullable(),
  text: z.string().max(400),
  confidence: z.number().min(0).max(1),
});

export const TranscriptionZ = z.object({
  lines: z.array(TranscriptionLineZ).max(80),
  legible: z.boolean(),
  notes: z.string().max(200).optional(),
});

export type TranscriptionResult = z.infer<typeof TranscriptionZ>;

const CONVENTIONS = [
  'Write mathematics the way a student would type it, with no backslash commands',
  'and no markup: 2x + 3, sqrt(5), 3/4,',
  '24 m by 16 m, 47 degrees as 47, x <= 5, 2 * 3 or 2 x 3 for a product.',
  'Keep the student\'s own values even where they are wrong. You are reading, not correcting.',
  'One line per line of working. Do not merge steps and do not invent steps that are not there.',
  'Copy a crossed-out line only if nothing replaced it; otherwise omit it.',
].join(' ');

export interface TranscribeArgs {
  /** JPEG or PNG bytes as they arrived from the device. */
  image: Uint8Array;
  contentType: string;
  /** The labels this question actually has, so the reader knows what to look for. */
  slotRefs: string[];
}

export interface TranscribeOutcome {
  transcription: TranscriptionResult;
  usage: { input_tokens?: number; output_tokens?: number };
  model: string;
}

/**
 * One retry, because the failure is transient and the cost of not retrying is
 * paid by the student.
 *
 * Structured generation occasionally returns something that does not satisfy
 * the schema — the same photograph succeeds on the next call. Without a retry
 * that surfaces as "we could not read that photo" on a page that is perfectly
 * readable, and the student is left believing their handwriting is the problem.
 * Two attempts and then it stands: an unbounded retry is an unbounded bill.
 */
const READ_ATTEMPTS = 2;

export async function transcribeWorking(args: TranscribeArgs): Promise<TranscribeOutcome> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= READ_ATTEMPTS; attempt++) {
    try {
      return await readOnce(args);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

async function readOnce(args: TranscribeArgs): Promise<TranscribeOutcome> {
  const { image, contentType, slotRefs } = args;

  const result = await generateObject({
    model: reader,
    schema: TranscriptionZ,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              `This is a photograph of a student's handwritten working for one CSEC ` +
              `Mathematics question. Transcribe it. Do not mark it, do not say whether ` +
              `anything is right, and do not solve anything.\n\n` +
              `The question has these parts and answer slots: ${slotRefs.join(', ')}. ` +
              `Attribute each line to the part the student wrote beside it. A line with ` +
              `no label of its own belongs to the same part as the line above it. If a ` +
              `line cannot be attributed, set part_label to null.\n\n` +
              `${CONVENTIONS}\n\n` +
              `confidence is your confidence in READING that line, from 0 to 1. Set ` +
              `legible to false if the photograph cannot be read at all, and use notes ` +
              `for anything that would explain a gap — a cut-off page, a shadow.`,
          },
          { type: 'image', image, mediaType: contentType },
        ],
      },
    ],
  });

  return {
    transcription: normaliseLabels(result.object),
    usage: {
      input_tokens: result.usage?.inputTokens,
      output_tokens: result.usage?.outputTokens,
    },
    model: READER_MODEL_ID,
  };
}

/**
 * THE PART IS THE PART, NOT THE SLOT REFERENCE.
 *
 * The reader is told the question's slots are "a.i", "b.i", so it labels lines
 * with the whole reference. linesForSlot then compares that against the part
 * label "a", matches nothing, and the slot is treated as having no working at
 * all — and no working means no method mark (R2 §4.3). A correctly read page
 * would have silently earned nothing.
 *
 * Found by running the eval against real photographs, which is what an eval is
 * for. Split here, once, on the way in, so everything downstream sees a part
 * label that is a part label.
 */
function normaliseLabels(t: TranscriptionResult): TranscriptionResult {
  return {
    ...t,
    lines: t.lines.map((line) => {
      const raw = (line.part_label ?? '').replace(/[()\s]/g, '');
      if (!raw) return { ...line, part_label: null };
      const [part, ...rest] = raw.split('.');
      return {
        ...line,
        part_label: part.toLowerCase() || null,
        slot_label: line.slot_label || (rest.length ? rest.join('.') : null),
      };
    }),
  };
}

/**
 * The lines belonging to one slot, with inheritance already applied.
 *
 * Marking reads this, never the raw array: a line that inherited its label is
 * the student's working for that part just as much as one that carried it.
 */
export function linesForSlot(
  transcription: TranscriptionResult,
  partLabel: string,
  slotLabel?: string,
): string[] {
  let current: { part: string | null; slot: string | null } = { part: null, slot: null };
  const out: string[] = [];
  for (const line of transcription.lines) {
    if (line.part_label) current = { part: line.part_label, slot: line.slot_label ?? null };
    else if (line.slot_label) current = { ...current, slot: line.slot_label };
    if (current.part !== partLabel) continue;
    if (slotLabel && current.slot && current.slot !== slotLabel) continue;
    out.push(line.text);
  }
  return out;
}
