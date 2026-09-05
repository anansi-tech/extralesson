import { Transcription } from '@/lib/db';

/**
 * Measured from recorded token usage, never estimated — see ROUND_2 §7. Three
 * calls can sit behind one read: the reader, the drawing check (reader tier),
 * and the marker. The rates live here and nowhere else, so a price change is
 * one edit and the figure cannot quietly become a guess.
 */
export const READER_INPUT_PER_M = 0.2;
export const READER_OUTPUT_PER_M = 1.2;
export const MARKER_INPUT_PER_M = 1.25;
export const MARKER_OUTPUT_PER_M = 10;

export interface CallCost {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  usd: number;
}

export interface ReadingCost {
  reads: number;
  reading: CallCost;
  drawing: CallCost;
  marking: CallCost;
  totalUsd: number;
  perReadUsd: number;
  /** Which of the three were recorded at all, so a zero is never mistaken for free. */
  present: ('reading' | 'drawing' | 'marking')[];
}

interface Usage {
  input_tokens?: number;
  output_tokens?: number;
  marking_input?: number;
  marking_output?: number;
  drawing_input?: number;
  drawing_output?: number;
}

const tally = (rows: { usage?: Usage }[], inKey: keyof Usage, outKey: keyof Usage, inRate: number, outRate: number): CallCost => {
  const with_ = rows.filter((r) => typeof r.usage?.[inKey] === 'number' || typeof r.usage?.[outKey] === 'number');
  const inputTokens = with_.reduce((n, r) => n + (r.usage?.[inKey] ?? 0), 0);
  const outputTokens = with_.reduce((n, r) => n + (r.usage?.[outKey] ?? 0), 0);
  return { calls: with_.length, inputTokens, outputTokens, usd: (inputTokens * inRate + outputTokens * outRate) / 1_000_000 };
};

export function readingCostOf(rows: { usage?: Usage }[]): ReadingCost {
  const reading = tally(rows, 'input_tokens', 'output_tokens', READER_INPUT_PER_M, READER_OUTPUT_PER_M);
  const drawing = tally(rows, 'drawing_input', 'drawing_output', READER_INPUT_PER_M, READER_OUTPUT_PER_M);
  const marking = tally(rows, 'marking_input', 'marking_output', MARKER_INPUT_PER_M, MARKER_OUTPUT_PER_M);
  const totalUsd = reading.usd + drawing.usd + marking.usd;
  const present = ([['reading', reading], ['drawing', drawing], ['marking', marking]] as const).filter(([, c]) => c.calls > 0).map(([k]) => k);
  return { reads: rows.length, reading, drawing, marking, totalUsd, perReadUsd: rows.length > 0 ? totalUsd / rows.length : 0, present };
}

export async function readingCost(): Promise<ReadingCost> {
  const rows = await Transcription.find().select('usage').lean<{ usage?: Usage }[]>();
  return readingCostOf(rows);
}
