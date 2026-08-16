import { describe, expect, it } from 'vitest';
import { categorise } from '@/scripts/backfill-context-category';

// The setting ledger can only measure monotony over questions that carry a
// setting tag, and 33 predated the field. These are the rules that placed them.
describe('categorise — tagging settings written before the ledger existed', () => {
  it('does not match a keyword inside a longer word', () => {
    // "cement" is in "displacement": the first draft filed a vector question
    // under construction because the word boundaries in an alternation bind
    // only to the first and last alternative.
    expect(categorise('A safety rope runs from $D$ to $E$ and its displacement is $\\frac{3}{2}$ of $AB$.')).not.toBe(
      'construction',
    );
    expect(categorise('A farmer harvests a crop of mangoes.')).toBe('agriculture');
    expect(categorise('A surveyor stands on level ground.')).toBe('construction');
  });

  it('reads a marina plan as transport, which is the setting it names', () => {
    expect(categorise('On a marina plan, a jetty runs from $A(2,1)$ to $B(8,5)$.')).toBe('transport');
  });

  it("calls a bare item 'none' — the papers' commonest Paper 1 shape", () => {
    expect(categorise('The statement $m + 6 = 15$ is true. What number does $m$ represent?')).toBe('none');
    expect(categorise('Let $P=\\begin{pmatrix}1&2\\\\0&1\\end{pmatrix}$.')).toBe('none');
    expect(categorise('A pentagonal prism has five rectangular side faces. How many edges?')).toBe('none');
  });

  it('leaves a setting it recognises but cannot place untagged', () => {
    // Named actor from the isBare list, matching no category rule.
    expect(categorise('A puppeteer club prepares a set of marionettes.')).toBeNull();
  });

  it('KNOWN LIMIT: an actor the list does not know reads as bare', () => {
    // This is why the backfill was read by eye before it was applied, and why
    // these rules are not a classifier to reuse on data nobody has looked at.
    expect(categorise('A puppeteer prepares a set of marionettes.')).toBe('none');
  });
});
