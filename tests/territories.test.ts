import { describe, expect, it } from 'vitest';
import { FLAVOUR, FLAVOUR_MEMORY, flavourGuidance, recentFlavour, NAMES, leastUsedName } from '@/lib/generation/territories';
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
  it('names exactly the chosen one, and forbids inventing others', () => {
    const g = flavourGuidance([], undefined, '', 'Mikayla');
    expect(g).toContain('the name is Mikayla and no other');
    expect(g).not.toMatch(/Amara, Kemar/);
  });

  it('says not to add a name where none is needed', () => {
    expect(flavourGuidance([], undefined, '', 'Mikayla')).toMatch(/do not add a name merely to use it/i);
  });

  it('forbids naming anyone when no name was chosen', () => {
    expect(flavourGuidance([], undefined, '', null)).toContain('Do not name a person');
  });
});
