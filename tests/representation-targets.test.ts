import { describe, expect, it } from 'vitest';
import { REPRESENTATION_TARGETS } from '@/lib/targets/representation';
import { TEMPLATES_BY_REPRESENTATION } from '@/lib/validation/question';
import { TEMPLATES } from '@/lib/visuals';
import type { TemplateName } from '@/lib/types';

const rows = Object.entries(REPRESENTATION_TARGETS);

describe('representation targets — every template is reachable, in its own kind', () => {
  it('splits each topic into shares that sum to 100', () => {
    for (const [topic, targets] of rows) {
      expect(targets.reduce((sum, t) => sum + t.share, 0), topic).toBe(100);
    }
  });

  // A template listed in NO topic can never be chosen, however good the deficit
  // ordering is: vectorFigure was implemented, hinted nowhere, and sat at zero
  // questions while the coverage matrix — which counts representations, not
  // templates — reported the category healthy.
  it('hints every implemented template from at least one topic', () => {
    const hinted = new Set(rows.flatMap(([, ts]) => ts.flatMap((t) => t.template_hints)));
    const orphans = (Object.keys(TEMPLATES) as TemplateName[]).filter((t) => !hinted.has(t));
    expect(
      orphans,
      `implemented and unreachable — no topic can ask for: ${orphans.join(', ')}`,
    ).toEqual([]);
  });

  // A hint under the wrong representation is worse than no hint: the question
  // validates against TEMPLATES_BY_REPRESENTATION and is rejected every time,
  // so the recipe loops. cumulativeFrequency is a graph and belongs under a
  // graph row; vectorFigure is a diagram and belongs under a diagram row.
  it('places every hint under the representation the schema gives it', () => {
    const wrong: string[] = [];
    for (const [topic, targets] of rows) {
      for (const t of targets) {
        if (t.representation === 'prose') {
          expect(t.template_hints, `${topic} prose row`).toEqual([]);
          continue;
        }
        const allowed = TEMPLATES_BY_REPRESENTATION[t.representation];
        for (const hint of t.template_hints) {
          if (allowed.includes(hint)) continue;
          // The one exception validation makes: a diagram may carry a
          // coordinateGrid when its params are a named sketch — labelled points
          // with no axes to read against, which is what a transformation
          // question draws. checkVisual in lib/validation/question.ts.
          if (t.representation === 'diagram' && hint === 'coordinateGrid') continue;
          wrong.push(`${topic}: ${hint} hinted as ${t.representation}`);
        }
      }
    }
    expect(wrong, `these would be rejected by the schema every time: ${wrong.join('; ')}`).toEqual([]);
  });
});
