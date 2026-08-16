import { describe, expect, it } from 'vitest';
import { TERRITORIES, recentTerritories, territoryGuidance } from '@/lib/generation/territories';
import { renderMathHtml, renderAnswerHtml } from '@/lib/katex';
import { answersEquivalent } from '@/lib/grade/equivalence';

// Of 34 questions naming a place, 28 were St Lucia or Grenada and none were set
// in Jamaica, Trinidad, Guyana, Belize or the Bahamas. The cause was our own
// currency rule: "always EC$" is the Eastern Caribbean dollar, so every priced
// question had to be set in the seven territories that use it.
describe('territories', () => {
  it('covers the region CXC serves, with the right money', () => {
    const byName = new Map(TERRITORIES.map((t) => [t.name, t.currency]));
    expect(byName.get('Jamaica')).toBe('J$');
    expect(byName.get('Trinidad and Tobago')).toBe('TT$');
    expect(byName.get('Guyana')).toBe('G$');
    expect(byName.get('Barbados')).toBe('BB$');
    expect(byName.get('Belize')).toBe('BZ$');
    expect(byName.get('Grenada')).toBe('EC$');
    expect(TERRITORIES.length).toBeGreaterThanOrEqual(16);
  });

  it('spots a territory from the town a stem names, not just the country', () => {
    expect(recentTerritories(['A vendor in Castries sells mangoes.'])).toEqual(['Saint Lucia']);
    expect(recentTerritories(['A bus leaves Port of Spain at 06:15.'])).toEqual(['Trinidad and Tobago']);
  });

  it('tells generation which ones a topic has just used', () => {
    const g = territoryGuidance(['A shop in Kingston…', 'A farm near Georgetown…']);
    expect(g).toContain('Jamaica');
    expect(g).toContain('Guyana');
    expect(g).toContain('set this one somewhere else');
  });

  it('says plainly not to write everything in the Eastern Caribbean', () => {
    expect(territoryGuidance([])).toContain('do not write every question in the Eastern Caribbean');
    expect(territoryGuidance([])).toContain('largest candidate entries');
  });
});

describe('currency renders for every territory, not only the OECS', () => {
  for (const [amount, label] of [
    ['J$1250', 'Jamaica'],
    ['TT$48', 'Trinidad'],
    ['BB$99.50', 'Barbados'],
    ['BZ$90', 'Belize'],
    ['G$3 000', 'Guyana'],
    ['EC$12', 'the OECS'],
    ['US$1,200', 'US dollars'],
  ] as const) {
    it(`keeps ${amount} intact (${label})`, () => {
      expect(renderMathHtml(`The price is ${amount} today.`)).toContain(amount);
      expect(renderAnswerHtml(amount)).toContain(amount);
    });
  }

  it('still treats a capital letter before a closing delimiter as maths', () => {
    // "$P$ and $Q$" must not read P$ as a currency prefix
    const html = renderMathHtml('The points $P$ and $Q$ lie on the circle.');
    expect(html).toContain('katex');
    expect(html.replace(/<[^>]*>/g, '')).not.toContain('P$');
  });

  it('compares two prices of the same value across notations', () => {
    expect(answersEquivalent('J$1250', '1250')).toBe(true);
    expect(answersEquivalent('TT$48', '48')).toBe(true);
    expect(answersEquivalent('BZ$90', '90')).toBe(true);
    expect(answersEquivalent('J$1250', 'J$1350')).toBe(false);
  });
});
