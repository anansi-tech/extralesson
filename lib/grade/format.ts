import { parseNumeric } from './equivalence';
import { normaliseDigitGroups, stripMoney } from '@/lib/money';
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
  // Money and thousands grouping are understood in lib/money.ts. A student may
  // write 17 400 or 17,400; the papers write the first and neither is a
  // mathematical error, so the form check sees the same number either way.
  return normaliseDigitGroups(stripMoney(raw)).trim().replace(/\s+/g, ' ').trim();
}

// KaTeX dressing is not part of the number either. A canonical answer is
// written "$203.0\text{ m}^2$" and a student types "203.0 m^2"; both state a
// value of 203.0.
function bareMath(s: string): string {
  return s
    .replace(/^\$+|\$+$/g, '')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\^\s*\{?\s*\\circ\s*\}?/g, '°')
    .replace(/\\%/g, '%')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A UNIT IS NOT PART OF THE NUMBER WHOSE FORM IS BEING JUDGED.
 *
 * "73.7°" is one decimal place and "203.0 m^2" is one decimal place, but the
 * check could not read a number out of either — it required bare digits — so it
 * reported the form wrong and withheld the format mark from every answer that
 * carried a unit. Measured before the fix: 59 of the 256 slots declaring a
 * format had a canonical answer that failed ITS OWN declared format. The mark
 * scheme's own answer could not have earned the mark.
 *
 * The lookbehind is what keeps "2\pi" intact: a unit follows a DIGIT, and the
 * "pi" there follows a backslash.
 */
const TRAILING_UNIT = /(?<=\d)\s*(?:%|°|[a-z]{1,3}(?:\/[a-z]{1,3})?(?:\^\{?[23]\}?)?)$/i;

function withoutUnit(s: string): string {
  const stripped = s.replace(TRAILING_UNIT, '').trim();
  return /\d/.test(stripped) ? stripped : s;
}

// "x = 3.14" states a value of 3.14: the label is not part of the number whose
// form is being judged.
function value_(raw: string): string {
  return withoutUnit(bareMath(clean(raw)).replace(/^[a-z]\s*=\s*/i, '').trim());
}

/**
 * The numeral a rounding instruction is about.
 *
 * "Correct to 1 decimal place" is a claim about the NUMBER, and an answer may
 * carry more than the number: a bearing is "53.1° north of east" and a rate is
 * "1.93 m^2 per litre". Reading the whole string as a numeral failed on those
 * and reported the form wrong.
 *
 * Only the numeric form checks use this. "Exact form" and standard form are
 * claims about the whole expression and must keep it.
 */
function numeral(raw: string): string {
  const v = value_(raw);
  if (/^-?\d+(\.\d+)?$/.test(v)) return v;
  const m = v.match(/-?\d+(?:\.\d+)?/);
  return m ? m[0] : v;
}

function decimalPlaces(s: string): number | null {
  const m = numeral(s).match(/^-?\d+\.(\d+)$/);
  return m ? m[1].length : null;
}

// Significant figures in a written numeral: leading zeros never count,
// trailing zeros after a decimal point do.
function significantFigures(s: string): number | null {
  const t = numeral(s).replace(/^-/, '');
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
    if (!/^-?\d+$/.test(numeral(raw))) {
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
      if (!/^-?\d+$/.test(numeral(raw))) {
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
