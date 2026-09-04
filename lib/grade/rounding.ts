import type { AnswerFormat } from '@/lib/types';

/**
 * TOLERANCE ONLY WHERE ROUNDING IS ASKED FOR. A scheme answer that says
 * "to 3 s.f." is itself rounded, so an unrounded 3.8977 is that value; one
 * that says nothing is exact, and 26.5 is not 27. Read from the declared
 * format first, then from the wording of the question.
 */
export interface Rounding {
  kind: 'sf' | 'dp';
  /** Figures, or decimal places — negative places round to tens, hundreds. */
  n: number;
}

const NEAREST: Record<string, number> = {
  'whole number': 0, integer: 0, unit: 0, one: 0,
  ten: -1, hundred: -2, thousand: -3,
  cent: 2, penny: 2,
  dollar: 0, degree: 0, metre: 0, meter: 0, kilometre: 0, kilometer: 0, km: 0, cm: 0, mm: 0,
  gram: 0, kilogram: 0, kg: 0, litre: 0, liter: 0, minute: 0, second: 0, hour: 0, year: 0,
  percent: 0, 'per cent': 0,
};

export function roundingOf(args: { answer_format?: AnswerFormat | string; prompts?: (string | undefined)[] }): Rounding | null {
  const f = args.answer_format ?? '';
  const sf = f.match(/^sf:(\d+)$/);
  if (sf) return { kind: 'sf', n: Number(sf[1]) };
  const dp = f.match(/^dp:(\d+)$/);
  if (dp) return { kind: 'dp', n: Number(dp[1]) };
  if (f === 'integer') return { kind: 'dp', n: 0 };

  const text = (args.prompts ?? []).filter(Boolean).join(' ').toLowerCase();
  const sfText = text.match(/(\d+)\s*(?:s\.?\s?f\.?|significant figures?)\b/);
  if (sfText) return { kind: 'sf', n: Number(sfText[1]) };
  const dpText = text.match(/(\d+)\s*(?:d\.?\s?p\.?|decimal places?)\b/);
  if (dpText) return { kind: 'dp', n: Number(dpText[1]) };
  const nearest = text.match(/nearest (whole number|integer|unit|ten|hundred|thousand|cent|penny|dollar|degree|metre|meter|kilometre|kilometer|km|cm|mm|gram|kilogram|kg|litre|liter|minute|second|hour|year|percent|per cent)/);
  if (nearest) return { kind: 'dp', n: NEAREST[nearest[1]] };
  return null;
}

export function roundTo(x: number, r: Rounding): number {
  if (r.kind === 'sf') return Number(x.toPrecision(Math.max(1, r.n)));
  const scale = 10 ** r.n;
  return Math.round(x * scale) / scale;
}
