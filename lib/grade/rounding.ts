import { evaluate } from 'mathjs';
import type { AnswerFormat } from '@/lib/types';

/**
 * WHICH ROUNDING A COMPARISON IS ALLOWED. A stated one wins: "to 3 s.f." in
 * the format or the wording. Otherwise the CSEC general instruction applies —
 * answers not exact are given to 3 s.f. — so a canonical that cannot
 * terminate (a surd, a third, a multiple of π) is compared at 3 s.f., and one
 * that does (an integer, 12.68) is exact: 26.5 is not 27.
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

const GENERAL_INSTRUCTION: Rounding = { kind: 'sf', n: 3 };

export function roundingOf(args: {
  answer_format?: AnswerFormat | string;
  prompts?: (string | undefined)[];
  /** The scheme's answer; decides the default when nothing is stated. */
  canonical?: string;
}): Rounding | null {
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
  return args.canonical !== undefined && !terminates(args.canonical) ? GENERAL_INSTRUCTION : null;
}

/**
 * Whether every value in a scheme answer is written out exactly. A recurring
 * decimal, a surd or π never is; a fraction is when its denominator has only
 * twos and fives. Anything that cannot be evaluated is taken as exact.
 */
export function terminates(canonical: string): boolean {
  const s = canonical.replace(/\$/g, '').replace(/\\text\{[^{}]*\}/g, '').replace(/\\,/g, '');
  if (/\\dot|\.\.\.|recurring/i.test(s)) return false;
  const expr = s
    .replace(/\\[dt]?frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))')
    .replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)')
    .replace(/√\s*\(?([\d.]+)\)?/g, 'sqrt($1)')
    .replace(/\\pi|π/g, 'pi')
    .replace(/\\times|×/g, '*')
    .replace(/\^\s*\{([^{}]+)\}/g, '^($1)')
    .replace(/(\d)\s+(\d+\/\d+)/g, '($1+$2)');
  const pieces = expr.split(/\s*(?:,|;|\bor\b|\band\b)\s*/).map((p) => p.replace(/^[a-z]\s*=\s*/i, '').trim()).filter(Boolean);
  for (const piece of pieces) {
    const numeric = piece.match(/-?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?|sqrt\([^()]*\)|pi/g);
    if (!numeric || !/sqrt|pi|\//.test(piece)) continue;
    try {
      const v = evaluate(piece.replace(/[a-z]+(?!\w*\()/gi, (m) => (m === 'pi' ? 'pi' : m === 'sqrt' ? 'sqrt' : '1')));
      if (typeof v !== 'number' || !Number.isFinite(v)) continue;
      if (Math.abs(v - Number(v.toFixed(10))) > 1e-12) return false;
    } catch {
      if (/sqrt|pi/.test(piece)) return false;
    }
  }
  return true;
}

export function roundTo(x: number, r: Rounding): number {
  if (r.kind === 'sf') return Number(x.toPrecision(Math.max(1, r.n)));
  const scale = 10 ** r.n;
  return Math.round(x * scale) / scale;
}
