import { parseNumeric } from './equivalence';
import { normaliseDigitGroups, stripMoney } from '@/lib/money';
import type { AnswerFormat } from '@/lib/types';

// Format-aware marking — see ROUND_1_6 §2. Equivalence treats 1/2 and 0.5 as
// one answer, which is wrong when the FORM is what is tested. A right value in
// a wrong form is marked incorrect, with feedback saying the form was wrong
// rather than implying the mathematics was.

export interface FormatCheck {
  ok: boolean;
  /** Shown to the student when the value is right but the form is not. */
  feedback?: string;
}

// A fraction arrives as "3/4" from a student and \frac{3}{4} from a canonical
// answer. A check that knows only the first marks a correct answer wrong.
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
  // A student may write 17 400 or 17,400 and the papers write the first;
  // neither is a mathematical error, so the check sees one number either way.
  return normaliseDigitGroups(stripMoney(raw)).trim().replace(/\s+/g, ' ').trim();
}

// KaTeX dressing is not part of the number: "$203.0\text{ m}^2$" and
// "203.0 m^2" state the same value.
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
 * A UNIT IS NOT PART OF THE NUMBER WHOSE FORM IS JUDGED: requiring bare digits
 * withheld the mark from 59 of the 256 format-declaring slots, whose canonical
 * answers failed their own format. The lookbehind keeps "2\pi" intact.
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
 * The numeral a rounding instruction is about — an answer may carry more than
 * the number ("53.1° north of east"). Only the numeric form checks use this:
 * exact and standard form are claims about the whole expression and keep it.
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

/**
 * A RANGE, because a trailing zero in an integer is a placeholder or a
 * significant digit and the numeral cannot say which: 2540 is three figures
 * and also four, so both are accepted. A decimal point removes the ambiguity.
 */
function significantFigureRange(s: string): [number, number] | null {
  const t = numeral(s).replace(/^-/, '');
  if (!/^\d*\.?\d+$/.test(t)) return null;
  const digits = t.replace('.', '');
  const trimmed = digits.replace(/^0+/, '');
  if (trimmed === '') return [1, 1]; // "0" / "0.0"
  const written = trimmed.length;
  if (t.includes('.')) return [written, written];
  const withoutTrailingZeros = trimmed.replace(/0+$/, '');
  return [Math.max(1, withoutTrailingZeros.length), written];
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
    const range = significantFigureRange(value);
    if (range === null) {
      return { ok: false, feedback: `Correct value, but the question asks for a number correct to ${want} significant figures.` };
    }
    const [least, most] = range;
    if (want < least || want > most) {
      return {
        ok: false,
        feedback: `Correct value, but the question asks for ${want} significant figures and this is written to ${
          least === most ? least : `${least}–${most}`
        }.`,
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
