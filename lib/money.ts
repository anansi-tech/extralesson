// Money is STORED as an escaped \$ and rendered as a bare $, so the math
// segmenter never sees a naked dollar it could mistake for a delimiter.
// No currency prefix: across every text-layer paper there are 61 bare dollar
// signs and none prefixed, CXC being territory-neutral by design. The only
// prefixed amounts sit in a conversion question, where the currency IS the ask.

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
 * Inside a math segment a BARE $ is a syntax error, so money that reaches KaTeX
 * stays escaped. Prose gets the bare sign a student reads, maths gets the
 * escape, and both print the same glyph.
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
 * Money is marked as a QUANTITY, not removed: stripping it left $70 matching
 * 70 m. Only the ESCAPED sign and the currency codes are money — a bare $ is a
 * KaTeX delimiter, so treating it as currency would make every number an amount.
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

export function normaliseDigitGroups(value: string): string {
  return value.replace(/(\d)[  ,](?=\d{3}\b)/g, '$1');
}

/** Write a number the way the papers write it: 17 400, not 17,400. */
export function formatThousands(n: number): string {
  const [whole, fraction] = String(n).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);
  return fraction ? `${grouped}.${fraction}` : grouped;
}
