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
  /**
   * The transactions the questions are ABOUT. Livelihoods and goods name who
   * and what; these name the dealing, which is what the banking, wages and
   * retail settings actually turn on — and those are 54% of the corpus.
   */
  dealings: string[];
}

// MEASURED AGAINST THE PAPERS, 2026-08-26.
//
// The lists were subsistence-heavy — market vendor, fisherman, saltfish,
// callaloo, sugar cane — while the papers are commercial and modern. Counting
// context markers across the readable corpus (the 2027 specimen, the subject
// report and seven past papers; the other twenty are scans with no text layer
// and running text recognition over scans is a kill-list item, so 9 of 29
// documents is the honest base):
//
//   banking/credit 31% · retail 20% · transport 14% · bills 12% · wages 8%
//   agriculture 6.5% · appliances 6% · restaurant/tourism 2% · fishing 0%
//
// Goods were 13 of 18 produce. Agriculture stays — it does appear — but as one
// register among several rather than the default one.
export const FLAVOUR: RegionalFlavour = {
  livelihoods: [
    // Salaried and commercial, which is where the papers mostly sit.
    'a sales clerk', 'a bank teller', 'a supermarket cashier', 'a nurse',
    'a teacher', 'a hotel receptionist', 'a call centre agent', 'a security guard',
    'a shop supervisor', 'a delivery driver', 'a taxi driver', 'a bus conductor',
    'a mechanic', 'a hairdresser', 'a restaurant server',
    // Trades and self-employment, still common and still on the papers.
    'a seamstress', 'a mason', 'a carpenter', 'a plumber',
    // Agriculture and fishing, kept but no longer the default register.
    'a farmer', 'a market vendor', 'a fisherman',
  ],
  goods: [
    // Retail stock, appliances and services — the papers' usual objects.
    'a refrigerator', 'a gas stove', 'a laptop', 'a mobile phone', 'a television',
    'a washing machine', 'school uniforms', 'exercise books', 'phone credit',
    'a monthly data plan', 'an electricity bill', 'a water bill', 'bus fares',
    'a restaurant meal', 'a hotel booking',
    // Materials, for construction and measurement settings.
    'roofing sheets', 'cement blocks', 'floor tiles', 'fabric',
    // Produce, kept in proportion rather than dominating.
    'mangoes', 'plantains', 'coconuts', 'nutmeg', 'saltfish',
  ],
  names: [
    'Amara', 'Kemar', 'Mona', 'David', 'Anisa', 'Rohan', 'Tamika', 'Jerome',
    'Priya', 'Marlon', 'Chantelle', 'Rajesh', 'Nadia', 'Liam', 'Simone', 'Trevor',
  ],
  // NAMED BY THE SYLLABUS ITSELF, not inferred from the papers. CXC's own
  // wording, with occurrence counts across design/syllabus-2027.pdf:
  // depreciation 11, hire purchase 10, interest 16 (simple 9 / compound 7),
  // loan 9, utility 4, demand and supply 3, discount 3, plus salary, wages,
  // taxes, invoice, budget, insurance, mortgage, currency. Its cross-discipline
  // notes point the same way — "demand and supply functions of business
  // studies" (p37), Business Studies among the disciplines graphs link to
  // (p34).
  //
  // This is the register the corpus says we are short of — banking 28% of the
  // papers against 1% of our bank — named by the examiner rather than guessed.
  dealings: [
    'a hire-purchase agreement', 'a bank loan repaid monthly', 'a savings account',
    'simple interest over a fixed term', 'compound interest year on year',
    'depreciation on a vehicle', 'an appreciating property value',
    'a monthly salary with deductions', 'overtime at a higher rate',
    'a fortnightly wage', 'a marked price with a discount', 'a bill with sales tax',
    'an electricity bill read from a meter', 'a phone plan with a monthly cap',
    'a household budget', 'an insurance premium',
    'demand and supply at different prices',
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
  return `SETTING DETAIL: the person or business in this question is ONE of these, and nothing else — ${FLAVOUR.livelihoods.join(', ')}. Pick the one the mathematics suits and vary it question to question; the list is there so the bank is not all farmers.${avoid} Do NOT name a country or a city: sixteen territories sit this paper and a stem that names one is a stem about one of them. Name a place only where the question genuinely needs it, such as a scale drawing of a named site. Goods and materials to draw on: ${FLAVOUR.goods.join(', ')}. Where the topic is about money, the DEALING is what the question turns on — draw on: ${FLAVOUR.dealings.join(', ')}. Given names: ${FLAVOUR.names.slice(0, 12).join(', ')}.`;
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
