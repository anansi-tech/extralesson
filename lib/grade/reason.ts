import { parseQuantity, parseQuantityProduct } from './quantity';
import { parseNumeric } from './equivalence';
import { readInputShape, isMultiValue } from './input-shape';

/**
 * WHY A SLOT WAS MARKED WRONG, SAID BESIDE THE SLOT. Derived from the SAME
 * comparison that produced the verdict, so it cannot claim what the marker did
 * not find; where the marker only disagrees, say so and never guess a diagnosis.
 */
const DIMENSION_WORDS: Record<string, string> = {
  length: 'a length',
  area: 'an area',
  volume: 'a volume',
  mass: 'a mass',
  time: 'a time',
  angle: 'an angle',
  money: 'an amount of money',
  percent: 'a percentage',
};

function dimensionWord(dimension: string): string {
  if (DIMENSION_WORDS[dimension]) return DIMENSION_WORDS[dimension];
  return dimension.startsWith('count:') ? `a number of ${dimension.slice(6)}` : 'a different quantity';
}

/** The numerals in a string, ignoring any units around them. */
function numerals(s: string): string[] {
  return [...s.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => m[0]);
}

export function missReason(
  given: string,
  canonicalAnswer: string,
  enteredValues?: string[],
): string | undefined {
  const typed = given.trim();
  if (typed === '') return 'You left this blank.';

  const key = readInputShape(canonicalAnswer);

  // The wrong NUMBER of values, which a box count makes easy to do.
  if (isMultiValue(key.shape) && enteredValues) {
    const filled = enteredValues.filter((v) => v.trim() !== '').length;
    if (filled !== key.values.length) {
      return `This needs ${key.values.length} value${key.values.length === 1 ? '' : 's'}; you gave ${filled}.`;
    }
  }

  // A quantity of the wrong KIND: an area where a length was asked for.
  const g = parseQuantity(typed.toLowerCase());
  const k = parseQuantity(canonicalAnswer.toLowerCase().replace(/\$|\\text\{|\}/g, ''));
  if (g && k && g.dimension !== k.dimension) {
    return `That is ${dimensionWord(g.dimension)}; this asks for ${dimensionWord(k.dimension)}.`;
  }

  // The right numbers in the wrong unit: if the numerals agree and the answer
  // still does not, the units are what differ.
  const gn = numerals(typed);
  const kn = numerals(canonicalAnswer);
  if (gn.length > 0 && gn.join(',') === kn.join(',')) {
    return 'The numbers are right, but the units are not — check what each one is measured in.';
  }

  // A product where one factor carries a different unit from the other.
  const gp = parseQuantityProduct(typed.toLowerCase());
  if (gp && new Set(gp.map((q) => q.dimension)).size === 1) {
    const written = typed.match(/[a-z]+/gi) ?? [];
    if (new Set(written.map((w) => w.toLowerCase())).size > 1) {
      return 'Both parts of this need to be in the same unit.';
    }
  }

  if (parseNumeric(typed) !== null) return 'That is not the value this asks for.';
  return 'That is not the answer this asks for.';
}
