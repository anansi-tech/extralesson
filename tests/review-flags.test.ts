import { describe, expect, it } from 'vitest';
import { reviewFlags } from '@/lib/admin/review-flags';

// Every flag is a defect class that reached a review queue and was caught by
// eye. They point; they never judge.
const base = { module: 2, stem: 'A line passes through two points.', parts: [] };

describe('review flags', () => {
  it('says nothing about a clean question', () => {
    expect(reviewFlags(base)).toEqual([]);
  });

  it('spots Module 2 function notation in a Module 3 question', () => {
    const flags = reviewFlags({ ...base, module: 3, stem: 'Calculate $fg(2)$.' });
    expect(flags[0].level).toBe('warn');
    expect(flags[0].text).toContain('Module 2 function notation');
    // The same content is unremarkable where it belongs.
    expect(reviewFlags({ ...base, module: 2, stem: 'Calculate $fg(2)$.' })).toEqual([]);
  });

  it('spots a region whose non-negativity is left to the shading', () => {
    const shown = { ...base, module: 3, stem: 'Draw the feasible region for $x \\ge 0$, $y \\ge 0$.' };
    const missing = { ...base, module: 3, stem: 'Draw the feasible region for this situation.' };
    expect(reviewFlags(missing).some((f) => f.text.includes('x ≥ 0'))).toBe(true);
    expect(reviewFlags(shown).some((f) => f.text.includes('x ≥ 0'))).toBe(false);
  });

  it('spots two answer boxes that do not say which is which', () => {
    const q = {
      ...base,
      parts: [
        {
          label: 'a',
          prompt: 'State the gradient and the intercept.',
          slots: [
            { label: 'i', answer: '2' },
            { label: 'ii', answer: '3' },
          ],
        },
      ],
    };
    expect(reviewFlags(q)[0].text).toContain('does not say which is which');
    // A label that names the quantity is the wording, and needs no prompt.
    q.parts[0].slots = [
      { label: 'gradient', answer: '2' },
      { label: 'intercept', answer: '3' },
    ];
    expect(reviewFlags(q)).toEqual([]);
  });

  it('notes what a reviewer has to judge by hand', () => {
    const q = {
      ...base,
      parts: [{ label: 'a', prompt: 'Draw the graph.', slots: [{ label: 'i', answer: 'a parabola', response_mode: 'construct' }] }],
    };
    const flags = reviewFlags(q);
    expect(flags[0].level).toBe('note');
    expect(flags[0].text).toContain('construction');
  });
});
