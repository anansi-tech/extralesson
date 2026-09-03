import type { ContextCategory } from '@/lib/types';

// Drives VARIETY — the flavour of a setting and the names in it — never
// currency, which lib/money.ts owns, and never a place name in a stem:
// sixteen territories sit the same paper. See ROUND_1_8 PART 0.

export interface RegionalFlavour {
  livelihoods: string[];
  goods: string[];
  /** The transactions the questions are ABOUT — banking, wages and retail are 54% of the corpus. */
  dealings: string[];
}

// Context markers over the 9 readable documents of 29: banking/credit 31% ·
// retail 20% · transport 14% · bills 12% · wages 8% · agriculture 6.5% ·
// appliances 6% · restaurant/tourism 2% · fishing 0%. Agriculture is one
// register among several, not the default one.
/**
 * ONE FLAT LIST: least-used selection already spreads evenly, so name pools
 * would be a mechanism without a purpose.
 */
export const NAMES = [
  'Liam', 'Cairo', 'David', 'Shari', 'Amari', 'Ayden', 'Aniyah', 'Damion',
  'Aliyah', 'Mickel', 'Mikayla', 'Stoney', 'Michael', 'Brian', 'Mallissa',
  'Amara', 'Kemar', 'Mona', 'Anisa', 'Rohan', 'Tamika', 'Jerome', 'Priya',
  'Marlon', 'Chantelle', 'Rajesh', 'Nadia', 'Simone', 'Trevor', 'Johnson',
];

/**
 * 19.1% of Paper 2 questions name a person (naming.py, 14 papers, 178 chunks);
 * grammatical detection makes that a FLOOR, the safe direction for a target.
 * Decided here because prose saying a role MAY stay unnamed was read as never.
 */
export const NAMING_RATE = 0.19;

export function namesAPerson(text: string): boolean {
  return NAMES.some((n) => new RegExp(`\\b${n}\\b`).test(text));
}

/**
 * Below the measured rate it should name, above it should not: a share
 * converges against the total, or it does not converge.
 */
export function shouldNamePerson(stems: string[], rate = NAMING_RATE): boolean {
  if (stems.length === 0) return true;
  const named = stems.filter(namesAPerson).length;
  return named / stems.length < rate;
}

/**
 * Deterministic: ties break by list order, so one bank yields one choice.
 * Only the CHOSEN name reaches the prompt — handing over twelve and asking for
 * variety is what let the model concentrate on a few.
 */
export function leastUsedName(stems: string[]): string {
  const hay = stems.join(' \u0000 ');
  let best = NAMES[0];
  let bestCount = Infinity;
  for (const name of NAMES) {
    const n = (hay.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length;
    if (n < bestCount) {
      bestCount = n;
      best = name;
    }
  }
  return best;
}

export const FLAVOUR: RegionalFlavour = {
  livelihoods: [
    'a sales clerk', 'a bank teller', 'a supermarket cashier', 'a nurse',
    'a teacher', 'a hotel receptionist', 'a call centre agent', 'a security guard',
    'a shop supervisor', 'a delivery driver', 'a taxi driver', 'a bus conductor',
    'a mechanic', 'a hairdresser', 'a restaurant server',
    'a seamstress', 'a mason', 'a carpenter', 'a plumber',
    'a farmer', 'a market vendor', 'a fisherman',
  ],
  goods: [
    'a refrigerator', 'a gas stove', 'a laptop', 'a mobile phone', 'a television',
    'a washing machine', 'school uniforms', 'exercise books', 'phone credit',
    'a monthly data plan', 'an electricity bill', 'a water bill', 'bus fares',
    'a restaurant meal', 'a hotel booking',
    'roofing sheets', 'cement blocks', 'floor tiles', 'fabric',
    'mangoes', 'plantains', 'coconuts', 'nutmeg', 'saltfish',
  ],
  // CXC's own wording from design/syllabus-2027.pdf, not inferred from the
  // papers. This is the register the corpus says we are short of: banking is
  // 28% of the papers against 1% of our bank.
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

export function recentFlavour(texts: string[]): string[] {
  const used: string[] = [];
  const all = [...FLAVOUR.livelihoods, ...FLAVOUR.goods, ...NAMES];
  for (const text of texts.slice(0, FLAVOUR_MEMORY)) {
    for (const word of all) {
      const bare = word.replace(/^an? /, '');
      if (new RegExp(`\\b${bare}\\b`, 'i').test(text) && !used.includes(bare)) used.push(bare);
    }
  }
  return used;
}

/**
 * The actor comes from a CLOSED LIST, like the setting category: five actors
 * carried 42% of 416 approved questions, four of them words this prompt printed
 * itself. An avoid-ledger prevents ADJACENCY, not CONCENTRATION.
 */
export function flavourGuidance(
  recentTexts: string[],
  category: ContextCategory | undefined,
  seed = '',
  name?: string | null,
): string {
  const used = [...new Set([...recentFlavour(recentTexts), ...recentActors(recentTexts)])];
  const avoid = used.length ? ` Not these, which this topic has just used: ${used.slice(0, 10).join(', ')}.` : '';
  void category;
  void seed;
  return `SETTING DETAIL: the person or business in this question is ONE of these, and nothing else — ${FLAVOUR.livelihoods.join(', ')}. Pick the one the mathematics suits and vary it question to question; the list is there so the bank is not all farmers.${avoid} Do NOT name a country or a city: sixteen territories sit this paper and a stem that names one is a stem about one of them. Name a place only where the question genuinely needs it, such as a scale drawing of a named site. Goods and materials to draw on: ${FLAVOUR.goods.join(', ')}. Where the topic is about money, the DEALING is what the question turns on — draw on: ${FLAVOUR.dealings.join(', ')}. ${
    name
      ? `Name exactly ONE person in this question and call them ${name}, no other name. Mention them where the question needs them — the papers rarely thread a name through every part.`
      : 'Name nobody. Refer to the person by their role — "a bank teller", "the shop supervisor" — throughout.'
  }`;
}

/**
 * Nouns that take an actor's grammatical position without being one — an actor
 * measurement that counts "results" is one nothing can be steered on.
 */
const NOT_AN_ACTOR = new Set([
  'results', 'result', 'values', 'value', 'figures', 'figure', 'data', 'numbers',
  'number', 'points', 'point', 'graph', 'table', 'diagram', 'chart', 'grid',
  'information', 'cost', 'price', 'total', 'distance', 'time', 'speed', 'amount',
  'sum', 'mass', 'area', 'volume', 'length', 'width', 'height', 'rate', 'answer',
  'question', 'visual', 'curve', 'line', 'shape', 'region', 'scale',
]);

/**
 * Words that never appear INSIDE an actor. Half the verb list doubles as a
 * noun, so "The table shows the charges" would otherwise match with "table
 * shows the" as the actor. A real one is one or two content words.
 */
const NOT_IN_AN_ACTOR = new Set([
  'the', 'a', 'an', 'of', 'for', 'in', 'on', 'at', 'to', 'and', 'or',
  'is', 'are', 'was', 'were', 'be', 'been', 'shows', 'shown', 'showing',
  'this', 'that', 'these', 'those', 'her', 'his', 'their', 'its', 'each',
  'one', 'two', 'three', 'four', 'five', 'first', 'second', 'third',
]);

export function recentActors(texts: string[]): string[] {
  const found: string[] = [];
  for (const text of texts.slice(0, FLAVOUR_MEMORY)) {
    const m = text
      .replace(/\$[^$]*\$/g, ' ')
      .match(/\b(?:A|An|The|At a|At an|In a|During a|On a)\s+([a-z][a-z' -]{2,28}?)\s+(?:plans|records|sells|makes|buys|uses|prepares|wants|needs|orders|packs|runs|owns|tracks|models|compares|charges|delivers|offers|installs|designs|builds|stores|ships|collects|measures|surveys|begins|opens|operates|produces|supplies|manages|hires|rents|plants|harvests|bakes|repairs|transports|imports|exports|stocks|sews|paints|mixes|fills|loads|serves|cuts|weighs|counts)\b/);
    const actor = m?.[1]?.trim().toLowerCase();
    if (!actor || NOT_AN_ACTOR.has(actor) || found.includes(actor)) continue;
    const words = actor.split(/[\s-]+/);
    if (words.some((w) => NOT_AN_ACTOR.has(w) || NOT_IN_AN_ACTOR.has(w))) continue;
    found.push(actor);
  }
  return found;
}
