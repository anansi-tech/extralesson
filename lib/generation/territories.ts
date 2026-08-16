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
export function flavourGuidance(recentTexts: string[], category: ContextCategory | undefined): string {
  const used = recentFlavour(recentTexts);
  const avoid = used.length ? ` Recently used here: ${used.slice(0, 8).join(', ')} — pick differently.` : '';
  void category;
  return `SETTING DETAIL: keep it generic, as the papers do — "a market vendor", "a farmer", "the school canteen" — and do NOT name a country or a city. Sixteen territories sit this paper and a stem that names one is a stem about one of them; name a place only where the question genuinely needs it (a scale drawing of a named site, say). Vary the people and the goods: livelihoods such as ${FLAVOUR.livelihoods.slice(0, 6).join(', ')}; goods such as ${FLAVOUR.goods.slice(0, 6).join(', ')}; names such as ${FLAVOUR.names.slice(0, 6).join(', ')}.${avoid}`;
}
