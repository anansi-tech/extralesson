import { describe, expect, it } from 'vitest';
import {
  FLAVOUR,
  FLAVOUR_MEMORY,
  flavourGuidance,
  recentFlavour,
  NAMES,
  leastUsedName,
  recentActors,
  shouldNamePerson,
  namesAPerson,
  NAMING_RATE,
} from '@/lib/generation/territories';
import { renderMathHtml, renderAnswerHtml } from '@/lib/katex';
import { answersEquivalent } from '@/lib/grade/equivalence';
import { formatThousands, normaliseDigitGroups, stripMoney } from '@/lib/money';
import { svgPlainLabel } from '@/lib/visuals/svg';

// R1.8 correction. The repetitiveness was real — 28 of 34 questions naming a
// place were St Lucia or Grenada — but naming territories was the wrong remedy.
// A real paper names no country and no city: sixteen sit the same paper.
describe('regional flavour, not place names', () => {
  it('offers generic livelihoods, goods and names', () => {
    expect(FLAVOUR.livelihoods.length).toBeGreaterThan(10);
    expect(FLAVOUR.goods.length).toBeGreaterThan(10);
    expect(NAMES.length).toBeGreaterThan(10);
  });

  // Measured against the papers 2026-08-26: banking 31%, retail 20%, transport
  // 14%, bills 12%, wages 8%, agriculture 6.5%, fishing 0%. The lists were
  // subsistence-heavy — goods were 13 of 18 produce — which set a register the
  // papers do not use. Agriculture stays because it does appear; it is the
  // DOMINANCE that was wrong, so that is what this pins.
  it('keeps agriculture present without letting it dominate', () => {
    const all = [...FLAVOUR.livelihoods, ...FLAVOUR.goods];
    const agri = all.filter((x) =>
      /farmer|market vendor|fisherman|mango|plantain|coconut|nutmeg|saltfish/.test(x),
    );
    expect(agri.length, 'agriculture should still appear').toBeGreaterThan(3);
    expect(agri.length / all.length, 'but not as the default register').toBeLessThan(0.3);
  });

  it('carries the commercial register the papers mostly use', () => {
    const all = [...FLAVOUR.livelihoods, ...FLAVOUR.goods].join(' ');
    // Banking, wages, bills and retail are 71% of the papers' markers and had
    // no vocabulary here at all — the generator had nothing to reach for.
    for (const word of ['bank teller', 'electricity bill', 'data plan', 'sales clerk']) {
      expect(all, word).toContain(word);
    }
  });

  it('tells generation not to name a country or a city', () => {
    const g = flavourGuidance([], undefined);
    // Case-insensitive: the rule is what matters, not where the sentence
    // happens to start.
    expect(g).toMatch(/do NOT name a country or a city/i);
    expect(g).toMatch(/name a place only where the question genuinely needs it/i);
  });

  it('says nothing whatever about currency — money is one rule elsewhere', () => {
    const g = flavourGuidance([], undefined);
    expect(g).not.toMatch(/EC\$|J\$|currency|dollar/i);
  });

  it('spots the flavour a topic has just used, and asks for something else', () => {
    const used = recentFlavour(['A market vendor sells mangoes.', 'Kemar buys cement blocks.']);
    expect(used).toContain('market vendor');
    expect(used).toContain('mangoes');
    expect(used).toContain('Kemar');
    // The ledger now names what to avoid rather than saying "pick
    // differently" — it is an adjacency guard, which is all it ever was.
    const g = flavourGuidance(['A market vendor sells mangoes.'], undefined);
    expect(g).toMatch(/this topic has just used/i);
    expect(g).toContain('market vendor');
  });

  it('remembers only the recent past', () => {
    const many = Array.from({ length: 30 }, (_, i) => `${NAMES[i % NAMES.length]} buys fabric.`);
    expect(recentFlavour(many).length).toBeLessThanOrEqual(FLAVOUR_MEMORY + FLAVOUR.goods.length);
  });
});

// Across every text-layer paper: 61 bare dollar signs, no EC$/J$/BB$ anywhere,
// and prefixes only inside a currency-conversion question.
describe('money is a bare dollar sign, encoded so it can never be a delimiter', () => {
  const strip = (h: string) =>
    h.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  it('renders escaped money as a bare $', () => {
    expect(strip(renderMathHtml('The bag costs \\$85.'))).toBe('The bag costs $85.');
    expect(strip(renderAnswerHtml('\\$70'))).toBe('$70');
  });

  it('leaves the maths around it alone', () => {
    const html = renderMathHtml('Solve $2x + 1 = 7$ when the fee is \\$12.');
    expect(html).toContain('katex');
    expect(strip(html)).toContain('$12');
  });

  it('keeps money out of a figure label without eating the sign', () => {
    expect(svgPlainLabel('\\$1 250')).toBe('$1 250');
  });

  it('compares a price with its bare value, and with a legacy prefix', () => {
    expect(answersEquivalent('\\$85', '85')).toBe(true);
    expect(answersEquivalent('\\$70', '70')).toBe(true); // questions written before the correction
    expect(answersEquivalent('\\$85', '58')).toBe(false);
  });

  it('strips every money marker in one place', () => {
    expect(stripMoney('\\$1 250').trim()).toBe('1 250');
    expect(stripMoney('US$40').trim()).toBe('40');
  });
});

describe('thousands are grouped with a space', () => {
  it('writes them the way the papers write them', () => {
    expect(formatThousands(17400)).toBe('17 400');
    expect(formatThousands(1250.5)).toBe('1 250.5');
    expect(formatThousands(999)).toBe('999');
  });

  it('accepts either separator from a student', () => {
    expect(answersEquivalent('17 400', '17400')).toBe(true);
    expect(answersEquivalent('17 400', '17,400')).toBe(true);
    expect(answersEquivalent('\\$17 400', '17400')).toBe(true);
    expect(answersEquivalent('17 400', '17 500')).toBe(false);
  });

  it('normalises grouping without touching ordinary spacing', () => {
    expect(normaliseDigitGroups('17 400')).toBe('17400');
    expect(normaliseDigitGroups('x + 400')).toBe('x + 400');
  });
});

// THE DEALING IS WHAT A MONEY QUESTION TURNS ON.
//
// Livelihoods and goods name who and what; neither can express "compound
// interest year on year" or "a hire-purchase agreement". Banking, wages and
// retail are 54% of the corpus and 9% of our bank, and the vocabulary for them
// did not exist here — the generator had nothing to reach for.
//
// These words are CXC's own: the syllabus says hire purchase 10 times,
// depreciation 11, interest 16, loan 9, and names Business Studies among the
// disciplines it links to.
describe('dealings', () => {
  it('carries the transactions the syllabus itself names', () => {
    const all = FLAVOUR.dealings.join(' ');
    for (const w of ['hire-purchase', 'compound interest', 'depreciation', 'salary', 'sales tax']) {
      expect(all, w).toContain(w);
    }
  });

  it('reaches the prompt, or it is a list nothing reads', () => {
    const g = flavourGuidance([], undefined);
    expect(g).toContain('hire-purchase');
    expect(g).toMatch(/the DEALING is what the question turns on/);
  });

  it('still says nothing about currency, which lib/money.ts owns', () => {
    expect(FLAVOUR.dealings.join(' ')).not.toMatch(/currency|dollar|EC\$|J\$/i);
  });
});

// ONE NAME, CHOSEN — not twelve, offered.
describe('leastUsedName', () => {
  it('picks the name the bank has used least', () => {
    const stems = ['Liam sells fabric.', 'Liam buys tiles.', 'Cairo counts stock.'];
    // Every other name has zero uses; list order breaks the tie deterministically.
    expect(leastUsedName(stems)).toBe('David');
  });

  it('is deterministic — the same bank yields the same name', () => {
    const stems = ['Liam and Cairo and David met.'];
    expect(leastUsedName(stems)).toBe(leastUsedName(stems));
  });

  it('moves on once a name has been used', () => {
    const used: string[] = [];
    for (let i = 0; i < 4; i++) used.push(leastUsedName(used.map((n) => `${n} runs a stall.`)));
    expect(new Set(used).size, 'four picks should be four different names').toBe(4);
  });

  it('matches whole words, so Amara is not a use of Amari', () => {
    const stems = Array(5).fill('Amari packs boxes.');
    expect(leastUsedName(stems)).not.toBe('Amari');
  });

  it('is one flat list with no pools', () => {
    expect(Array.isArray(NAMES)).toBe(true);
    expect(NAMES).toContain('Johnson');
    expect(new Set(NAMES).size, 'no duplicates').toBe(NAMES.length);
  });
});

describe('the prompt gets one name or none', () => {
  it('names exactly the chosen one, and offers no list to choose from', () => {
    const g = flavourGuidance([], undefined, '', 'Mikayla');
    expect(g).toContain('call them Mikayla');
    expect(g).not.toMatch(/Amara, Kemar/);
  });

  it('gives an instruction, not a judgment', () => {
    // The wording this replaced — "a role may stay unnamed, do not add a name
    // merely to use it" — asked the model to decide, and it decided never.
    const g = flavourGuidance([], undefined, '', 'Mikayla');
    expect(g).not.toMatch(/may stay unnamed|merely to use it/i);
  });

  it('forbids naming anyone when no name was chosen', () => {
    expect(flavourGuidance([], undefined, '', null)).toContain('Name nobody');
  });
});

// AN ACTOR IS A PERSON OR A BUSINESS, NOT A NOUN IN AN ACTOR'S POSITION.
//
// Measured over the last batch, recentActors reported "results" and "graph for
// this information" as actors. The cause was is/are/has/have in the verb list:
// copulas attach to any noun, so "the results are shown" and "the total is 40"
// both parsed as somebody doing something. A measurement that over-reports is
// one nothing can be steered on.
describe('recentActors counts actors only', () => {
  it('ignores abstract nouns standing where an actor stands', () => {
    for (const s of [
      'The results are shown in the table below.',
      'The total is 40 and the values are given.',
      'Draw a graph for this information.',
      'The diagram is not drawn to scale.',
    ]) {
      expect(recentActors([s]), s).toEqual([]);
    }
  });

  it('still finds a real actor', () => {
    expect(recentActors(['A bank teller records the deposits.'])).toEqual(['bank teller']);
    expect(recentActors(['The shop supervisor orders more stock.'])).toEqual(['shop supervisor']);
    expect(recentActors(['A market vendor sells mangoes.'])).toEqual(['market vendor']);
  });

  it('rejects a phrase whose head noun is not an actor', () => {
    // "graph for this information" has a role-shaped position and a noun head.
    expect(recentActors(['A graph for this information records the totals.'])).toEqual([]);
  });

  // HALF THE VERB LIST DOUBLES AS A NOUN.
  //
  // "The table shows the charges" matches with "charges" as the verb and
  // "table shows the" as the actor — a sentence fragment, counted as somebody
  // in the standing measurement. Eight approved questions produced one, and a
  // distribution with prose in its tail cannot be trusted at the margin.
  it('rejects a fragment that a noun-verb dragged in', () => {
    for (const s of [
      'The table shows the charges for one ticket.',
      'The grid shows two orders received by a school canteen.',
      'The dot patterns shown are designs for score cards.',
      'The rectangular part of the plan measures 7.0 cm by 4.5 cm.',
      'The paving slabs are supplied in packs which cover 12 m^2.',
      'A second section of the ramp makes the same angle with the ground.',
    ]) {
      expect(recentActors([s]), s).toEqual([]);
    }
  });

  it('keeps a two-word role, which is what a real actor looks like', () => {
    expect(recentActors(['A taxi driver records the distance.'])).toEqual(['taxi driver']);
    expect(recentActors(['A school canteen orders bread.'])).toEqual(['school canteen']);
  });
});

// NAMING IS A RATE THE RECIPE DECIDES, NOT A JUDGMENT THE PROMPT MAKES.
//
// Prose said a role may stay unnamed and not to add a name merely to use one.
// The generator read that as never and went twenty for twenty unnamed. Measured
// over 14 Paper 2 papers and 178 question chunks: 19.1% name a person, and of
// those 79% name exactly one.
describe('the naming rate', () => {
  it('names somebody while the bank is below the measured rate', () => {
    expect(shouldNamePerson([])).toBe(true);
    expect(shouldNamePerson(Array(20).fill('A nurse records the times.'))).toBe(true);
  });

  it('stops once the rate is met, so it converges instead of drifting', () => {
    const mixed = [...Array(4).fill('Amara buys fabric.'), ...Array(16).fill('A nurse records.')];
    expect(shouldNamePerson(mixed)).toBe(false);
  });

  it('reads NAMES, a list we declare, rather than guessing what looks like a name', () => {
    expect(namesAPerson('Kemar sells mangoes.')).toBe(true);
    expect(namesAPerson('A nurse records the times.')).toBe(false);
    // Not a substring match: Amari is not a use of Amara.
    expect(namesAPerson('Amarillo is a place.')).toBe(false);
  });

  it('tells the prompt to name exactly one, or nobody at all', () => {
    expect(flavourGuidance([], undefined, '', 'Mikayla')).toMatch(/exactly ONE person/);
    expect(flavourGuidance([], undefined, '', null)).toMatch(/Name nobody/);
  });

  it('is a floor, not an exact figure — the detection misses possessives', () => {
    expect(NAMING_RATE).toBeGreaterThan(0.1);
    expect(NAMING_RATE).toBeLessThan(0.3);
  });
});
