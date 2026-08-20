// A number with a unit is not a number.
//
// The old path matched "<number> <word>" and returned the number, throwing the
// unit away — so every quantity collapsed to its numeric head and any two
// answers with the same head matched. 72 cm equalled 72 m; 5 cm equalled 5 kg;
// 336 m equalled 336 square metres. It also rejected 336 m² against 336 square
// metres, because "²" was not in the character class the regex allowed. Both
// failures are the same missing idea: the unit was never compared.
//
// A quantity is parsed into a value in a CANONICAL BASE UNIT and a dimension.
// Two quantities are equal when their dimensions match and their base values
// match. That makes 72 cm ≠ 72 m and 0.72 m = 72 cm fall out of one rule
// instead of a list of cases.

export interface Quantity {
  /** In the dimension's base unit: metre, m², m³, kilogram, second, degree. */
  value: number;
  dimension: string;
}

// Every unit we recognise, as a factor to its dimension's base.
//
// Capacity and volume are ONE dimension. A litre is a cubic decimetre, the
// syllabus teaches 1000 cm³ = 1 litre, and a student who answers in litres
// where the scheme says cm³ is right — splitting them would reject that.
const BASE: Record<string, { dimension: string; factor: number }> = {
  // length → metre
  mm: { dimension: 'length', factor: 0.001 },
  cm: { dimension: 'length', factor: 0.01 },
  m: { dimension: 'length', factor: 1 },
  km: { dimension: 'length', factor: 1000 },
  // mass → kilogram
  mg: { dimension: 'mass', factor: 1e-6 },
  g: { dimension: 'mass', factor: 0.001 },
  kg: { dimension: 'mass', factor: 1 },
  t: { dimension: 'mass', factor: 1000 },
  // volume/capacity → cubic metre
  ml: { dimension: 'volume', factor: 1e-6 },
  cl: { dimension: 'volume', factor: 1e-5 },
  l: { dimension: 'volume', factor: 0.001 },
  // time → second
  s: { dimension: 'time', factor: 1 },
  min: { dimension: 'time', factor: 60 },
  h: { dimension: 'time', factor: 3600 },
  day: { dimension: 'time', factor: 86400 },
  // money → dollar. One dimension, not one per currency: a question that
  // converts between currencies states its own rate, and the answer is checked
  // against the number that rate produces.
  dollar: { dimension: 'money', factor: 1 },
  cent: { dimension: 'money', factor: 0.01 },
  // angle → degree
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
 * A unit expression to a dimension and a factor.
 *
 * Handles the powers a syllabus uses — m^2, square metres, metres squared,
 * sq m, cubic cm — and rates written with a slash, km/h. Compounds are matched
 * PART-WISE against this grammar; the answer string is never split globally on
 * a multiplication sign, which is also multiplication.
 */
function resolveUnit(raw: string): { dimension: string; factor: number } | null {
  // Unicode superscripts are exponents. equivalence.ts rewrites them before
  // calling, but the parser is also used directly and must not depend on its
  // caller having done that.
  let u = raw.trim().replace(/²/g, '^2').replace(/³/g, '^3').replace(/\./g, '').replace(/\s+/g, ' ');
  if (u === '') return null;

  // A rate: "km/h", "m/s". Each side resolves on its own.
  const slash = u.split('/');
  if (slash.length === 2) {
    const top = resolveUnit(slash[0]);
    const bottom = resolveUnit(slash[1]);
    if (!top || !bottom) return null;
    return { dimension: `${top.dimension}/${bottom.dimension}`, factor: top.factor / bottom.factor };
  }

  // "square metres" / "cubic cm" / "sq m" / "metres squared" / "m^2" / "m2".
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
 * A quantity, or null for anything that is not one.
 *
 * Null is the important half of the contract: the caller falls back to the
 * comparisons that were already there. A parser that guessed would start
 * rejecting correct answers, which is worse than what it replaced.
 *
 * Input is expected pre-cleaned by equivalence.ts — lowercased, ² already
 * rewritten as ^2, KaTeX dressing removed.
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
