import { parseNumeric } from './equivalence';
import type { AnswerFormat } from '@/lib/types';

// R1.6 §2 — format-aware marking.
//
// The equivalence layer deliberately treats 1/2 and 0.5 as the same answer,
// which is right for general marking and wrong when the FORM is what is being
// tested: "give your answer in exact form", "correct to 3 significant
// figures", "in the form a√b". When a part declares an answer_format, a
// candidate whose value is right but whose form is wrong is marked incorrect,
// with feedback that says so rather than implying the maths was wrong.

export interface FormatCheck {
  ok: boolean;
  /** Shown to the student when the value is right but the form is not. */
  feedback?: string;
}

// A fraction reaches us written either way — "3/4" from a student typing, and
// \frac{3}{4} from a canonical answer written in KaTeX. They are one object,
// and a form check that only knows the first marks a correct answer wrong.
function asFraction(raw: string): [number, number] | null {
  const v = value_(raw);
  const katex = v.match(/^(-?)\\[dt]?frac\s*\{\s*(-?\d+)\s*\}\s*\{\s*(-?\d+)\s*\}$/);
  if (katex) {
    const sign = katex[1] === '-' ? -1 : 1;
    return [sign * Number(katex[2]), Number(katex[3])];
  }
  const ascii = v.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  return ascii ? [Number(ascii[1]), Number(ascii[2])] : null;
}
const SURD = /(?:√|\\sqrt)/;
const STANDARD_FORM = /^-?\d(?:\.\d+)?\s*(?:×|x|\*|\\times)\s*10\s*(?:\^|\*\*)\s*\{?-?\d+\}?$/i;
const DECIMAL = /^-?\d+\.\d+$/;

// Surface tidy-up only. Kept separate from label stripping because
// equation_form is a claim about the whole expression, including its "=".
function clean(raw: string): string {
  return raw.trim().replace(/\$/g, '').replace(/\s+/g, ' ').trim();
}

// "x = 3.14" states a value of 3.14: the label is not part of the number whose
// form is being judged.
function value_(raw: string): string {
  return clean(raw).replace(/^[a-z]\s*=\s*/i, '').trim();
}

function decimalPlaces(s: string): number | null {
  const m = value_(s).match(/^-?\d+\.(\d+)$/);
  return m ? m[1].length : null;
}

// Significant figures in a written numeral: leading zeros never count,
// trailing zeros after a decimal point do.
function significantFigures(s: string): number | null {
  const t = value_(s).replace(/^-/, '');
  if (!/^\d*\.?\d+$/.test(t)) return null;
  const digits = t.replace('.', '');
  const trimmed = digits.replace(/^0+/, '');
  if (trimmed === '') return 1; // "0" / "0.0"
  // A whole number's trailing zeros are ambiguous; count them as written.
  return trimmed.length;
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

export function checkAnswerFormat(raw: string, format: AnswerFormat): FormatCheck {
  const whole = clean(raw);
  const value = value_(raw);

  if (format === 'exact') {
    // An exact answer keeps its fraction, surd or π; a rounded decimal loses it.
    if (DECIMAL.test(value)) {
      return {
        ok: false,
        feedback: 'Correct value, but the question asks for the EXACT form — leave it as a fraction, surd or multiple of π rather than a decimal.',
      };
    }
    return { ok: true };
  }

  if (format === 'surd') {
    if (!SURD.test(value)) {
      return {
        ok: false,
        feedback: 'Correct value, but the question asks for surd form, so leave a root such as $\\sqrt{2}$ in the answer rather than a decimal.',
      };
    }
    return { ok: true };
  }

  if (format === 'standard_form') {
    if (!STANDARD_FORM.test(value)) {
      return {
        ok: false,
        feedback: 'Correct value, but the question asks for standard form: a number between 1 and 10 multiplied by a power of 10, such as $3.4 \\times 10^{5}$.',
      };
    }
    return { ok: true };
  }

  if (format === 'lowest_terms') {
    const frac = asFraction(raw);
    if (!frac) {
      return {
        ok: false,
        feedback: 'Correct value, but the question asks for a fraction in its lowest terms.',
      };
    }
    const [n, d] = frac;
    if (Math.abs(gcd(n, d)) !== 1) {
      return {
        ok: false,
        feedback: `Correct value, but ${value} is not in its lowest terms — divide the numerator and denominator by ${Math.abs(gcd(n, d))}.`,
      };
    }
    return { ok: true };
  }

  if (format === 'integer') {
    if (!/^-?\d+$/.test(value)) {
      return {
        ok: false,
        feedback: 'Correct value, but the question asks for a whole number.',
      };
    }
    return { ok: true };
  }

  if (format === 'equation_form') {
    if (!whole.includes('=')) {
      return {
        ok: false,
        feedback: 'Correct value, but the question asks for the answer as an equation, in the form it specifies.',
      };
    }
    return { ok: true };
  }

  const sf = /^sf:(\d)$/.exec(format);
  if (sf) {
    const want = Number(sf[1]);
    const got = significantFigures(value);
    if (got === null) {
      return { ok: false, feedback: `Correct value, but the question asks for a number correct to ${want} significant figures.` };
    }
    if (got !== want) {
      return {
        ok: false,
        feedback: `Correct value, but the question asks for ${want} significant figures and this is written to ${got}.`,
      };
    }
    return { ok: true };
  }

  const dp = /^dp:(\d)$/.exec(format);
  if (dp) {
    const want = Number(dp[1]);
    const got = decimalPlaces(value);
    if (want === 0) {
      if (!/^-?\d+$/.test(value)) {
        return { ok: false, feedback: 'Correct value, but the question asks for an answer to the nearest whole number.' };
      }
      return { ok: true };
    }
    if (got !== want) {
      return {
        ok: false,
        feedback: `Correct value, but the question asks for ${want} decimal place${want === 1 ? '' : 's'}${
          got === null ? '' : ` and this is written to ${got}`
        }.`,
      };
    }
    return { ok: true };
  }

  return { ok: true };
}

// True when the value is numerically right — used to distinguish "wrong form"
// from "wrong answer" so feedback can say which.
export function valueLooksRight(candidate: string, canonical: string): boolean {
  const a = parseNumeric(candidate);
  const b = parseNumeric(canonical);
  if (a === null || b === null) return false;
  const scale = Math.max(Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= Math.max(1e-9, scale * 5e-3);
}
