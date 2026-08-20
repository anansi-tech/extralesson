import { describe, expect, it } from 'vitest';
import { reviewFlags, type FlaggableQuestion } from '@/lib/admin/review-flags';

// Every flag is a defect class that reached a review queue and was caught by
// eye. They point; they never judge.
const base: FlaggableQuestion = { module: 2, stem: 'A line passes through two points.', parts: [] };

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
    const nonNeg = (q: typeof base) => reviewFlags(q).some((f) => f.text.includes('non-negativity'));
    expect(nonNeg({ ...base, module: 3, stem: 'Draw the feasible region for this situation.' })).toBe(true);
    // Stated in symbols, in the syllabus's own English, or in the region's
    // declared constraints — all three are the constraint being stated.
    expect(nonNeg({ ...base, module: 3, stem: 'Draw the feasible region for $x \\ge 0$, $y \\ge 0$.' })).toBe(false);
    expect(nonNeg({ ...base, module: 3, stem: 'Draw the feasible region where $x$ and $y$ are whole numbers.' })).toBe(false);
    expect(
      nonNeg({
        ...base,
        module: 3,
        stem: 'Draw the feasible region for this situation.',
        visual: {
          params: {
            regions: [
              {
                constraints: [
                  { a: 1, b: 0, c: 0, op: 'ge' },
                  { a: 0, b: 1, c: 0, op: 'ge' },
                ],
              },
            ],
          },
        },
      }),
    ).toBe(false);
  });

  it('does not read a single-inequality question as linear programming', () => {
    // "Which inequality represents R?" over a region that legitimately runs
    // into the negative quadrants — x >= 0 there would be wrong.
    const q = { ...base, module: 3, stem: 'The grid shows the shaded region $R$. Which inequality represents $R$?' };
    expect(reviewFlags(q)).toEqual([]);
  });

  it('spots a Module 3 method inside a Module 2 question, and the missing tag', () => {
    const q = {
      ...base,
      module: 2,
      objective_ids: ['M2.4.10'],
      worked_solution: 'Using the sine rule gives $QS = 14.2$.',
    };
    const texts = reviewFlags(q).map((f) => f.text).join(' | ');
    expect(texts).toContain('Module 3 method');
    expect(texts).toContain('Under-tagged');
    // Declaring it is the difference between assessed-and-invisible and covered.
    expect(reviewFlags({ ...q, objective_ids: ['M2.4.10', 'M3.3.7'] }).map((f) => f.text).join(' ')).not.toContain(
      'Under-tagged',
    );
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
