// A number with a unit is not a number: a quantity parses to a value in a
// CANONICAL BASE UNIT plus a dimension, and two are equal only when both
// match. 72 cm ≠ 72 m and 0.72 m = 72 cm then fall out of one rule.

export interface Quantity {
  /** In the dimension's base unit: metre, m², m³, kilogram, second, degree. */
  value: number;
  dimension: string;
}

// Capacity and volume are ONE dimension: the syllabus teaches 1000 cm³ = 1
// litre, so a student answering in litres where the scheme says cm³ is right.
const BASE: Record<string, { dimension: string; factor: number }> = {
  mm: { dimension: 'length', factor: 0.001 },
  cm: { dimension: 'length', factor: 0.01 },
  m: { dimension: 'length', factor: 1 },
  km: { dimension: 'length', factor: 1000 },
  mg: { dimension: 'mass', factor: 1e-6 },
  g: { dimension: 'mass', factor: 0.001 },
  kg: { dimension: 'mass', factor: 1 },
  t: { dimension: 'mass', factor: 1000 },
  ml: { dimension: 'volume', factor: 1e-6 },
  cl: { dimension: 'volume', factor: 1e-5 },
  l: { dimension: 'volume', factor: 0.001 },
  s: { dimension: 'time', factor: 1 },
  min: { dimension: 'time', factor: 60 },
  h: { dimension: 'time', factor: 3600 },
  day: { dimension: 'time', factor: 86400 },
  // Percent is a dimension so that "4" against "4%" gets the same leniency for
  // an omitted unit as every other unit does.
  '%': { dimension: 'percent', factor: 0.01 },
  // One dimension, not one per currency: a question that converts states its
  // own rate, and the answer is checked against the number that rate produces.
  dollar: { dimension: 'money', factor: 1 },
  cent: { dimension: 'money', factor: 0.01 },
  '°': { dimension: 'angle', factor: 1 },
  rad: { dimension: 'angle', factor: 180 / Math.PI },
};

// One spelling per unit. The papers and the students between them write
// "metres", "meter", "sq m", "square metres", "metres squared", "m2", "m^2".
const SPELLING: Record<string, string> = {
  millimetre: 'mm', millimetres: 'mm', millimeter: 'mm', millimeters: 'mm',
  centimetre: 'cm', centimetres: 'cm', centimeter: 'cm', centimeters: 'cm',
  metre: 'm', metres: 'm', meter: 'm', meters: 'm',
  kilometre: 'km', kilometres: 'km', kilometer: 'km', kilometers: 'km',
  milligram: 'mg', milligrams: 'mg',
  gram: 'g', grams: 'g', gramme: 'g', grammes: 'g',
  kilogram: 'kg', kilograms: 'kg', kilo: 'kg', kilos: 'kg',
  tonne: 't', tonnes: 't',
  millilitre: 'ml', millilitres: 'ml', milliliter: 'ml', milliliters: 'ml',
  centilitre: 'cl', centilitres: 'cl',
  litre: 'l', litres: 'l', liter: 'l', liters: 'l',
  second: 's', seconds: 's', sec: 's', secs: 's',
  minute: 'min', minutes: 'min', mins: 'min',
  hour: 'h', hours: 'h', hr: 'h', hrs: 'h',
  days: 'day',
  dollars: 'dollar', cents: 'cent',
  degree: '°', degrees: '°', deg: '°',
  radian: 'rad', radians: 'rad',
};

// Words that are mathematics, not units. "5 pi" is a number; reading "pi" as a
// unit would reject it against 15.708, which is the same value written out.
const MATH_WORDS = new Set(['pi', 'e', 'sqrt', 'frac', 'cdot', 'times', 'text', 'log', 'ln', 'sin', 'cos', 'tan']);

function baseUnit(word: string): string {
  const w = word.trim();
  return SPELLING[w] ?? w;
}

/**
 * Compounds are matched PART-WISE against this grammar; the answer string is
 * never split globally on a multiplication sign, which is also multiplication.
 */
function resolveUnit(raw: string): { dimension: string; factor: number } | null {
  // Called directly as well as through equivalence.ts, so it cannot depend on
  // the caller having rewritten superscripts.
  let u = raw.trim().replace(/²/g, '^2').replace(/³/g, '^3').replace(/\./g, '').replace(/\s+/g, ' ');
  if (u === '') return null;

  const slash = u.split('/');
  if (slash.length === 2) {
    const top = resolveUnit(slash[0]);
    const bottom = resolveUnit(slash[1]);
    if (!top || !bottom) return null;
    return { dimension: `${top.dimension}/${bottom.dimension}`, factor: top.factor / bottom.factor };
  }

  let power = 1;
  const prefix = u.match(/^(square|sq|cubic|cu)\s+(.+)$/);
  if (prefix) {
    power = /^(square|sq)$/.test(prefix[1]) ? 2 : 3;
    u = prefix[2];
  }
  const suffixWord = u.match(/^(.+?)\s+(squared|cubed)$/);
  if (suffixWord) {
    power = suffixWord[2] === 'squared' ? 2 : 3;
    u = suffixWord[1];
  }
  const caret = u.match(/^(.+?)\s*\^?\s*([23])$/);
  if (caret && !/^\d+$/.test(caret[1])) {
    power = Number(caret[2]);
    u = caret[1];
  }

  const unit = baseUnit(u);
  const known = BASE[unit];
  if (known) {
    if (power === 1) return known;
    // A squared length is an area; a cubed one is a volume. Anything else
    // raised to a power is not a shape the syllabus asks for.
    if (known.dimension !== 'length') return null;
    return {
      dimension: power === 2 ? 'area' : 'volume',
      factor: Math.pow(known.factor, power),
    };
  }

  // An unrecognised word is still a unit: "5 pieces" is not "5 kg". It is kept
  // as its own dimension so it matches itself and nothing else. Single letters
  // are excluded — those are algebra, and "3 x" must stay an expression.
  const singular = unit.replace(/s$/, '');
  if (power === 1 && /^[a-z]{3,}$/.test(singular) && !MATH_WORDS.has(singular)) {
    return { dimension: `count:${singular}`, factor: 1 };
  }
  return null;
}

const HEAD = /^(-?\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|-?\d+(?:\.\d+)?\/\d+(?:\.\d+)?)\s*(.*)$/;

function headValue(raw: string): number | null {
  const mixed = raw.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const sign = mixed[1] === '-' ? -1 : 1;
    return sign * (Number(mixed[2]) + Number(mixed[3]) / Number(mixed[4]));
  }
  const frac = raw.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (frac) {
    const v = Number(frac[1]) / Number(frac[2]);
    return Number.isFinite(v) ? v : null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Null is the important half of the contract: the caller falls back to the
 * comparisons already there, and a parser that guessed would start rejecting
 * correct answers. Input arrives pre-cleaned by equivalence.ts.
 */
export function parseQuantity(raw: string): Quantity | null {
  const m = raw.trim().match(HEAD);
  if (!m) return null;
  const value = headValue(m[1].trim());
  if (value === null) return null;
  const tail = m[2].trim();
  if (tail === '') return null; // a bare number is not a quantity
  const unit = resolveUnit(tail);
  if (!unit) return null;
  return { value: value * unit.factor, dimension: unit.dimension };
}

export function sameDimension(a: Quantity, b: Quantity): boolean {
  return a.dimension === b.dimension;
}


// Students type the multiplication sign with whatever the phone keyboard
// gives them. The rule is POSITIONAL, never a substitution: a separator is a
// multiplication sign only when a quantity sits on both sides of it, so "3x"
// and "2x + 5" keep their x instead of turning into arithmetic.
const SEPARATOR = /\s*\*\s*|\s+[x×]\s+|\s+by\s+/i;

export function parseQuantityProduct(raw: string): Quantity[] | null {
  const pieces = raw.trim().split(SEPARATOR);
  if (pieces.length < 2) return null;
  const parsed = pieces.map((p) => parseQuantity(p));
  if (parsed.some((q) => q === null)) return null;
  return parsed as Quantity[];
}

/** Two products match when they hold the same quantities, in any order. */
export function productsEqual(a: Quantity[], b: Quantity[], equal: (x: number, y: number) => boolean): boolean {
  if (a.length !== b.length) return false;
  const used = new Array<boolean>(b.length).fill(false);
  return a.every((qa) => {
    const i = b.findIndex((qb, j) => !used[j] && qb.dimension === qa.dimension && equal(qa.value, qb.value));
    if (i === -1) return false;
    used[i] = true;
    return true;
  });
}
