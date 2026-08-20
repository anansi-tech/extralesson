// The one place money is understood. R1.8 correction.
//
// Our old rule — "currency is always EC$" — began life as a fix for a KaTeX
// delimiter clash and leaked into content. Measured against the papers it is
// simply wrong: across every text-layer paper there are 61 bare dollar signs
// and no EC$, J$ or BB$ at all. The only prefixed amounts sit inside a currency
// conversion question, where naming the currency IS the question. CXC is
// territory-neutral by design — sixteen countries sit the same paper — so a
// prefix makes us less authentic, not more.
//
// The delimiter problem is solved here instead, deterministically: money is
// STORED as an escaped \$ and rendered as a bare $, and the math segmenter
// never sees a naked dollar it could mistake for a delimiter. One rule, no
// heuristics, no guessing from what follows the sign.

/** How money is written in stored content and in model output. */
export const MONEY_TOKEN = '\\$';

/** Internal placeholder: never appears in stored content or in output. */
const MONEY_SENTINEL = '';

/** Escaped money -> sentinel, so `$...$` segmentation cannot see it. */
export function protectMoney(text: string): string {
  return text.replace(/\\\$/g, MONEY_SENTINEL);
}

/** Sentinel -> the bare dollar sign a student reads. */
export function restoreMoney(text: string): string {
  return text.replace(new RegExp(MONEY_SENTINEL, 'g'), '$');
}

/**
 * The sentinel, restored for KaTeX rather than for prose.
 *
 * Inside a math segment a BARE $ is a syntax error — "Can't use function '$' in
 * math mode" — so money that reaches KaTeX has to stay escaped. Prose gets the
 * bare sign a student reads; maths gets the escape KaTeX understands, and both
 * print the same glyph.
 */
export function restoreMoneyForMath(text: string): string {
  return text.replace(new RegExp(MONEY_SENTINEL, 'g'), '\\$');
}

/** True when the sentinel is present — used to keep a value out of KaTeX. */
export function hasProtectedMoney(text: string): boolean {
  return text.includes(MONEY_SENTINEL);
}

/**
 * Currency codes a conversion question may legitimately name. Everywhere else
 * money is unprefixed, exactly as the papers write it.
 */
const CURRENCY_CODES = ['EC', 'US', 'TT', 'BB', 'BDS', 'BZ', 'KY', 'GY', 'JA', 'J', 'G', 'B'];

/**
 * Money markers removed for comparison: the escape, a bare sign, and the
 * currency codes a conversion question is allowed to use.
 */
/**
 * Money marked as a QUANTITY rather than deleted.
 *
 * stripMoney removes the currency so the number can be compared, which made
 * every amount dimensionless: $70 matched 70 m, because by the time the two
 * reached the comparison neither carried a unit. Rewriting the marker as a unit
 * word instead lets the quantity parser give money its own dimension — so $70
 * is 70 dollars, is not 70 metres, and is still 70 to a student who left the
 * sign off.
 *
 * Only the ESCAPED sign and the currency codes are money. A bare $ is a KaTeX
 * delimiter — "$70$" is the number seventy in maths mode — so treating it as
 * currency would turn every typeset number into an amount.
 */
export function markMoney(value: string): string {
  const codes = CURRENCY_CODES.join('|');
  const amount = String.raw`(\d[\d\s.,]*)`;
  return value
    .replace(new RegExp(String.raw`\b(?:${codes})\s*\\?\$\s*` + amount, 'gi'), '$1 dollars')
    .replace(new RegExp(String.raw`\\\$\s*` + amount, 'g'), '$1 dollars')
    .replace(new RegExp(String.raw`\b(?:${codes})\s*` + amount, 'gi'), '$1 dollars');
}

export function stripMoney(value: string): string {
  const codes = CURRENCY_CODES.join('|');
  return value
    .replace(/\\\$/g, '')
    .replace(new RegExp(`\\b(${codes})\\s*\\$`, 'gi'), '')
    .replace(new RegExp(`\\b(${codes})\\s*(?=\\d)`, 'gi'), '')
    .replace(/\$/g, '');
}

/**
 * The papers group thousands with a SPACE — 27 instances of "17 400" and none
 * of "17,400". We write that; we accept either from a student, because a comma
 * is not a mathematical error.
 */
export const THOUSANDS_SEPARATOR = ' ';

/** Remove a thousands separator of either kind from between digits. */
export function normaliseDigitGroups(value: string): string {
  return value.replace(/(\d)[  ,](?=\d{3}\b)/g, '$1');
}

/** Write a number the way the papers write it: 17 400, not 17,400. */
export function formatThousands(n: number): string {
  const [whole, fraction] = String(n).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);
  return fraction ? `${grouped}.${fraction}` : grouped;
}
