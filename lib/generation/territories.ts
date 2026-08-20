import type { ContextCategory } from '@/lib/types';

// R1.8 correction — what this module is FOR.
//
// The repetitiveness diagnosis held: 28 of 34 questions naming a place were set
// in St Lucia or Grenada. The remedy did not. Measured against the papers, a
// real question names no country and no city at all — the settings are generic
// ("a vendor", "a farmer", "the school"), because sixteen territories sit the
// same paper and a paper that named one would be a paper about that one.
//
// So this module drives VARIETY — the flavour of a setting and the names in it
// — and never currency, which lib/money.ts owns, and never a place name in a
// stem unless a question genuinely needs one.

export interface RegionalFlavour {
  /** Everyday work and trade a stem can be built from, region-wide. */
  livelihoods: string[];
  /** Produce, goods and materials that appear in a Caribbean question. */
  goods: string[];
  /** Given names, so people in questions are not all called the same thing. */
  names: string[];
}

export const FLAVOUR: RegionalFlavour = {
  livelihoods: [
    'a market vendor', 'a fisherman', 'a farmer', 'a seamstress', 'a taxi driver',
    'a shopkeeper', 'a baker', 'a mason', 'a hotel worker', 'a bus conductor',
    'a mechanic', 'a hairdresser', 'a carpenter', 'a nurse', 'a teacher',
    'a delivery rider', 'a boat operator', 'a stall holder', 'a plumber', 'a tailor',
  ],
  goods: [
    'mangoes', 'breadfruit', 'saltfish', 'plantains', 'coconuts', 'cocoa', 'nutmeg',
    'sugar cane', 'callaloo', 'yams', 'sweet potatoes', 'peppers', 'bananas',
    'roofing sheets', 'cement blocks', 'fabric', 'school supplies', 'phone credit',
  ],
  names: [
    'Amara', 'Kemar', 'Shanice', 'Devon', 'Anisa', 'Rohan', 'Tamika', 'Jerome',
    'Priya', 'Marlon', 'Chantelle', 'Rajesh', 'Nadia', 'Everton', 'Simone', 'Trevor',
  ],
};

/** How many recent questions a flavour choice should stay clear of. */
export const FLAVOUR_MEMORY = 8;

/** Flavour words a topic has used recently, so generation reaches elsewhere. */
export function recentFlavour(texts: string[]): string[] {
  const used: string[] = [];
  const all = [...FLAVOUR.livelihoods, ...FLAVOUR.goods, ...FLAVOUR.names];
  for (const text of texts.slice(0, FLAVOUR_MEMORY)) {
    for (const word of all) {
      const bare = word.replace(/^an? /, '');
      if (new RegExp(`\\b${bare}\\b`, 'i').test(text) && !used.includes(bare)) used.push(bare);
    }
  }
  return used;
}

/**
 * Prompt block: keep the setting generic and the details varied. Deliberately
 * says nothing about currency — money is written the same way everywhere and
 * lib/money.ts owns that rule.
 */
/**
 * A rotating window over a list, so the same six are not shown every time.
 *
 * The examples WERE the defaults. This prompt named "a market vendor", "a
 * farmer", "the school canteen" and then always printed the first six
 * livelihoods, and the bank came out with farmer in 32 questions, shopkeeper in
 * 16 and market vendor in 11 — four of the five commonest actors were the ones
 * standing at the front of the list. A model shown the same examples writes the
 * same world.
 */
function window(list: string[], seed: number, size = 6): string[] {
  const start = Math.abs(seed) % list.length;
  return Array.from({ length: Math.min(size, list.length) }, (_, i) => list[(start + i) % list.length]);
}

function seedFrom(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return h;
}

export function flavourGuidance(
  recentTexts: string[],
  category: ContextCategory | undefined,
  seed = '',
): string {
  const used = [...new Set([...recentFlavour(recentTexts), ...recentActors(recentTexts)])];
  const avoid = used.length ? ` Recently used here: ${used.slice(0, 10).join(', ')} — pick differently.` : '';
  void category;
  const n = seedFrom(seed + recentTexts.length);
  return `SETTING DETAIL: keep it generic, as the papers do, and do NOT name a country or a city. Sixteen territories sit this paper and a stem that names one is a stem about one of them; name a place only where the question genuinely needs it (a scale drawing of a named site, say). Vary the people and the goods: livelihoods such as ${window(FLAVOUR.livelihoods, n).join(', ')}; goods such as ${window(FLAVOUR.goods, n).join(', ')}; names such as ${window(FLAVOUR.names, n).join(', ')}.${avoid}`;
}

/**
 * The actor a recent stem actually opened with, whatever it was.
 *
 * recentFlavour only recognises words from FLAVOUR, so the two favourites the
 * model invented for itself — "a contractor" in 20 questions and "a
 * manufacturer" in 12 — were invisible to the avoid list and free to repeat.
 */
export function recentActors(texts: string[]): string[] {
  const found: string[] = [];
  for (const text of texts.slice(0, FLAVOUR_MEMORY)) {
    const m = text
      .replace(/\$[^$]*\$/g, ' ')
      .match(/\b(?:A|An|The|At a|At an|In a|During a|On a)\s+([a-z][a-z' -]{2,28}?)\s+(?:plans|records|is|are|has|have|sells|makes|buys|uses|prepares|wants|needs|orders|packs|runs|owns|tracks|models|compares|charges|delivers|offers|installs|designs|builds|stores|ships|collects|measures|surveys|begins|opens|operates|produces|supplies|manages|hires|rents|plants|harvests|bakes|repairs|transports|imports|exports|stocks|sews|paints|mixes|fills|loads|serves|cuts|weighs|counts)\b/);
    const actor = m?.[1]?.trim().toLowerCase();
    if (actor && !found.includes(actor)) found.push(actor);
  }
  return found;
}
