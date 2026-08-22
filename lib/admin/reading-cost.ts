import { Transcription } from '@/lib/db';

/**
 * WHAT READING HANDWRITING ACTUALLY COSTS.
 *
 * R2 §7 asks for the real figure rather than the estimate: token usage is
 * recorded on every transcription, so this is measured, and if it diverges from
 * the expected cent it is a product decision made with numbers instead of a
 * surprise on an invoice.
 *
 * The rates are the reader tier's published price. They are stated here as
 * constants and nowhere else, so a price change is one edit and the figure
 * cannot quietly become a guess.
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
