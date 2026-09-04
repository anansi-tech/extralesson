import { describe, expect, it } from 'vitest';
import { deriveTemplate, scopeOf, type ScopeSlot } from '@/lib/grade/claim-template';

// ROUND_5 Task 1: a criterion becomes a claim by replacing every literal that
// is a canonical value in scope with a reference. Constants stay; anything
// two-faced is reported, not guessed.
const cocoa = new Map<string, ScopeSlot>([
  ['a.i', { ref: 'a.i', answer: '144 000' }],
  ['b.i', { ref: 'b.i', answer: '1 056 000', depends_on: ['a.i'] }],
  ['b.ii', { ref: 'b.ii', answer: '88%', depends_on: ['b.i'] }],
  ['c.ii', { ref: 'c.ii', answer: '$2.4 \\times 10^4$', depends_on: ['b.i'] }],
]);
const text = 'A cocoa farmer sorts a harvest of 1 200 000 cocoa beans. 12% are rejected. at least 90% suitable';

describe('deriveTemplate', () => {
  it('references the value of a slot in scope and keeps question constants', () => {
    const d = deriveTemplate({ criterion: 'Subtracts "their" 144 000 from 1 200 000', slotRef: 'b.i', slots: cocoa, questionText: text });
    expect(d.template).toBe('Subtracts "their" {a.i} from 1 200 000');
    expect(d.refs).toEqual(['a.i']);
  });

  it('reads a percentage against a slot stored as one', () => {
    const d = deriveTemplate({ criterion: 'CAO $88\\%$', slotRef: 'b.ii', slots: cocoa, questionText: text });
    expect(d.template).toBe('CAO ${b.ii}\\%$');
  });

  it('never reaches outside the depends_on chain', () => {
    // c.ii depends on b.i, not on b.ii: 88 in a row on c.ii stays literal.
    const d = deriveTemplate({ criterion: 'Uses 88% and 1 056 000', slotRef: 'c.ii', slots: cocoa, questionText: text });
    expect(d.template).toBe('Uses 88% and {b.i}');
  });

  it('reports a literal that is both a constant and an answer', () => {
    const slots = new Map<string, ScopeSlot>([['a.i', { ref: 'a.i', answer: '12' }]]);
    const d = deriveTemplate({ criterion: 'Obtains 12', slotRef: 'a.i', slots, questionText: 'Twelve is written as 12 here.' });
    expect(d.template).toBe('Obtains 12');
    expect(d.ambiguous).toMatch(/12 is a question constant and the value of a\.i/);
  });

  it('reports a literal that matches two slots', () => {
    const slots = new Map<string, ScopeSlot>([
      ['a.i', { ref: 'a.i', answer: '5' }],
      ['b.i', { ref: 'b.i', answer: '5', depends_on: ['a.i'] }],
    ]);
    const d = deriveTemplate({ criterion: 'Obtains 5', slotRef: 'b.i', slots, questionText: '' });
    expect(d.ambiguous).toMatch(/5 matches (a\.i and b\.i|b\.i and a\.i)/);
    expect(d.template).toBe('Obtains 5');
  });

  it('is the spec example: the divisor and the result are the same digit', () => {
    const slots = new Map<string, ScopeSlot>([
      ['b.iqr', { ref: 'b.iqr', answer: '4' }],
      ['c.i', { ref: 'c.i', answer: '2', depends_on: ['b.iqr'] }],
    ]);
    const d = deriveTemplate({ criterion: 'Halves "their" interquartile range: $4\\div2=2$', slotRef: 'c.i', slots, questionText: 'Show that the semi-interquartile range is 2 minutes.' });
    expect(d.ambiguous).toMatch(/2 is a question constant/);
  });

  it('leaves a multi-value slot alone: a component is not the slot', () => {
    const slots = new Map<string, ScopeSlot>([['a.i', { ref: 'a.i', answer: '18 kg, 27 kg, 36 kg' }]]);
    const d = deriveTemplate({ criterion: 'Gives 18', slotRef: 'a.i', slots, questionText: '' });
    expect(d.template).toBe('Gives 18');
    expect(d.refs).toEqual([]);
  });

  it('walks depends_on transitively', () => {
    expect(scopeOf('c.ii', cocoa).map((s) => s.ref)).toEqual(['c.ii', 'b.i', 'a.i']);
  });
});
