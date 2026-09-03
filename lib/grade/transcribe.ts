import { generateObject } from 'ai';
import { z } from 'zod';
import { reader, READER_MODEL_ID } from '@/lib/ai';

/**
 * READING A PHOTOGRAPHED PAGE, AND NOTHING ELSE: marking is a separate call
 * over what this produced, in the conventions the grader already parses. A
 * retake is for a bad photograph, not a better answer. ROUND_2 §2, §3.
 */
export const MAX_TAKES = 2;

/**
 * ~1.5MB after the device has scaled it down; a phone photo is far larger.
 * The server-action body limit is asserted against this — the two must agree.
 */
export const MAX_BYTES = 1_500_000;

export const TranscriptionLineZ = z.object({
  /** As the student labelled it, or the whole slot ref; normaliseLabels splits it. */
  part_label: z.string().max(30).nullable(),
  slot_label: z.string().max(30).nullable(),
  text: z.string().max(400),
  confidence: z.number().min(0).max(1),
});

/** The final answer the student wrote for one slot, as the grader would parse it. */
export const TranscribedAnswerZ = z.object({
  /** The slot ref exactly as it was listed to the reader: 'a', 'b.ii'. */
  slot_label: z.string().max(30),
  text: z.string().max(200),
});

export const TranscriptionZ = z.object({
  lines: z.array(TranscriptionLineZ).max(80),
  /** Prefill for the answer boxes (ROUND_4 Task 1). A slot with no final answer is absent. */
  answers: z.array(TranscribedAnswerZ).max(20).default([]),
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
 * Structured generation occasionally returns something off-schema and the same
 * photograph succeeds next call; without a retry the student is told a
 * perfectly readable page could not be read. Two attempts, then it stands.
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
              `In answers, give the student's FINAL answer for each slot listed above that ` +
              `has one, written the same way: slot_label is the slot exactly as listed, text ` +
              `is what they wrote as their answer — the value they boxed, underlined or wrote ` +
              `last for that slot, even if it is wrong. Leave out a slot with no final answer. ` +
              `Never work one out.\n\n` +
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
 * THE PART IS THE PART, NOT THE SLOT REFERENCE. The reader labels lines with
 * the whole reference ("a.i"); matched against part "a" nothing is found, and
 * no working means no method mark (ROUND_2 §4). Split once, on the way in.
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
