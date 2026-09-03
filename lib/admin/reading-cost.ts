import { Transcription } from '@/lib/db';

/**
 * Measured from recorded token usage, never estimated — see ROUND_2 §7. The
 * reader tier's rates live here and nowhere else, so a price change is one edit
 * and the figure cannot quietly become a guess.
 */
export const READER_INPUT_PER_M = 0.2;
export const READER_OUTPUT_PER_M = 1.2;

export interface ReadingCost {
  reads: number;
  inputTokens: number;
  outputTokens: number;
  totalUsd: number;
  perReadUsd: number;
}

export async function readingCost(): Promise<ReadingCost> {
  const rows = await Transcription.find()
    .select('usage')
    .lean<{ usage?: { input_tokens?: number; output_tokens?: number } }[]>();

  const inputTokens = rows.reduce((n, r) => n + (r.usage?.input_tokens ?? 0), 0);
  const outputTokens = rows.reduce((n, r) => n + (r.usage?.output_tokens ?? 0), 0);
  const totalUsd =
    (inputTokens * READER_INPUT_PER_M + outputTokens * READER_OUTPUT_PER_M) / 1_000_000;

  return {
    reads: rows.length,
    inputTokens,
    outputTokens,
    totalUsd,
    perReadUsd: rows.length > 0 ? totalUsd / rows.length : 0,
  };
}
