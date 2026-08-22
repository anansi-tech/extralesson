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
    'Amara', 'Kemar', 'Mona', 'David', 'Anisa', 'Rohan', 'Tamika', 'Jerome',
    'Priya', 'Marlon', 'Chantelle', 'Rajesh', 'Nadia', 'Liam', 'Simone', 'Trevor',
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
 * The actor is chosen from a CLOSED LIST, the way the setting category is.
 *
 * Measured over 416 approved questions: farmer opens 32, contractor 20,
 * shopkeeper 16, manufacturer 12, market vendor 11 — five actors carrying 42%
 * of the bank. Four of those five were the words this prompt printed in its own
 * prose, and the other two the model invented and then reused freely.
 *
 * The avoid-ledger was already running and is not the answer: consecutive
 * questions on one objective repeat their actor only 4% of the time, and
 * repeat their setting CATEGORY 6% against a 7% chance rate. A memory of the
 * last ten prevents ADJACENCY, not CONCENTRATION — thirty-two farmers spread
 * evenly through the bank never trip it.
 *
 * What made settings converge — fifteen categories, largest at 13% — was that
 * they are picked from an enumerated list. So actors are now enumerated too,
 * and the prompt names no actor of its own to anchor on.
 */
export function flavourGuidance(
  recentTexts: string[],
  category: ContextCategory | undefined,
  seed = '',
): string {
  const used = [...new Set([...recentFlavour(recentTexts), ...recentActors(recentTexts)])];
  const avoid = used.length ? ` Not these, which this topic has just used: ${used.slice(0, 10).join(', ')}.` : '';
  void category;
  void seed;
  return `SETTING DETAIL: the person or business in this question is ONE of these, and nothing else — ${FLAVOUR.livelihoods.join(', ')}. Pick the one the mathematics suits and vary it question to question; the list is there so the bank is not all farmers.${avoid} Do NOT name a country or a city: sixteen territories sit this paper and a stem that names one is a stem about one of them. Name a place only where the question genuinely needs it, such as a scale drawing of a named site. Goods and materials to draw on: ${FLAVOUR.goods.join(', ')}. Given names: ${FLAVOUR.names.slice(0, 12).join(', ')}.`;
}

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
