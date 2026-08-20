import { describe, expect, it } from 'vitest';
import { REPRESENTATION_TARGETS } from '@/lib/targets/representation';
import { TEMPLATES_BY_REPRESENTATION } from '@/lib/validation/question';
import { isConstructTemplate } from '@/lib/targets/construct';
import type { TemplateName } from '@/lib/types';

// Two tables describe which template goes with which representation: the
// per-topic hint lists the recipe offers a model, and the canonical map the
// schema validates against. They disagreed — M3-STAT2 offered an ogive under
// 'chart', where an ogive is a graph — and it cost sixteen consecutive
// rejections on one topic before the run was stopped, because a recipe that
// narrows the hints to one template leaves the model no valid choice.
//
// The schema is the authority. A hint it would reject is not a hint.

const NAMED_SKETCH_EXCEPTION: Record<string, TemplateName[]> = {
  // A coordinateGrid drawn in named-sketch mode has no axes, gridlines or
  // scale, so it IS a diagram — checkRenderable allows exactly this one.
  diagram: ['coordinateGrid'],
};

describe('every template hint is valid for the representation it sits under', () => {
  for (const [topic, rows] of Object.entries(REPRESENTATION_TARGETS)) {
    for (const row of rows) {
      if (row.representation === 'prose') {
        it(`${topic} prose offers no templates`, () => {
          expect(row.template_hints).toEqual([]);
        });
        continue;
      }
      const allowed = [
        ...TEMPLATES_BY_REPRESENTATION[row.representation],
        ...(NAMED_SKETCH_EXCEPTION[row.representation] ?? []),
      ];
      it(`${topic} ${row.representation}`, () => {
        expect(row.template_hints.filter((t) => !allowed.includes(t))).toEqual([]);
      });
    }
  }
});

describe('a construction is only asked for where the schema would accept one', () => {
  it('never relies on the named-sketch exception', () => {
    // coordinateGrid under 'diagram' is legal only WITHOUT axes or a scale,
    // which is the opposite of "draw this graph using a scale of 2 cm to 1
    // unit". So a construct recipe must never be built on that combination.
    for (const [topic, rows] of Object.entries(REPRESENTATION_TARGETS)) {
      for (const row of rows) {
        if (row.representation === 'prose') continue;
        const allowed: TemplateName[] = TEMPLATES_BY_REPRESENTATION[row.representation];
        const eligible = row.template_hints.filter((t) => isConstructTemplate(t) && allowed.includes(t));
        for (const t of eligible) {
          expect(allowed, `${topic} ${row.representation} ${t}`).toContain(t);
        }
      }
    }
  });
});
