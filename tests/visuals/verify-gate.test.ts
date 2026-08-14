import { describe, expect, it } from 'vitest';
import { verifyQuestionVisual } from '@/lib/visuals/verify';
import { paramsDocFor, renderVisual, describeVisual } from '@/lib/visuals';
import { TEMPLATES } from '@/lib/visuals';
import type { TemplateName } from '@/lib/types';

describe('visual verify gate', () => {
  it('registry contains all 16 templates with consistent names', () => {
    const names = Object.keys(TEMPLATES) as TemplateName[];
    expect(names).toHaveLength(16);
    for (const n of names) expect(TEMPLATES[n].name).toBe(n);
  });

  it('paramsDocFor documents every template non-trivially', () => {
    for (const n of Object.keys(TEMPLATES) as TemplateName[]) {
      const doc = paramsDocFor([n]);
      expect(doc, n).toContain(n);
      expect(doc.length, n).toBeGreaterThan(30);
      expect(doc, n).not.toContain('unknown');
    }
  });

  it('rejects unknown templates and malformed params', () => {
    const bad = verifyQuestionVisual(
      { template: 'noSuchTemplate' as TemplateName, params: {} },
      { stem: 'x', partPrompts: [] },
    );
    expect(bad.ok).toBe(false);
    const malformed = verifyQuestionVisual(
      { template: 'barChart', params: { bars: 'nope' } },
      { stem: 'x', partPrompts: [] },
    );
    expect(malformed.ok).toBe(false);
    expect(malformed.issues[0]).toContain('barChart.params');
  });

  it('a deliberately inconsistent visual (triangle angles ≠ 180) is rejected', () => {
    const result = verifyQuestionVisual(
      {
        template: 'triangleLabeled',
        params: {
          vertices: ['A', 'B', 'C'],
          angles: [
            { vertex: 0, label: '95°', value: 95 },
            { vertex: 1, label: '50°', value: 50 },
            { vertex: 2, label: '45°', value: 45 },
          ],
        },
      },
      {
        stem: 'In triangle $ABC$, angle $A = 95°$ and angle $B = 50°$. The third angle is marked 45°... but the drawing claims otherwise.',
        partPrompts: [],
      },
    );
    // 95 + 50 + 45 = 190 ≠ 180 — must fail regardless of text agreement.
    expect(result.ok).toBe(false);
    expect(result.issues.join(' ')).toMatch(/sum|180/);
  });

  it('render and describe work through the registry for a valid visual', () => {
    const visual = {
      template: 'barChart' as TemplateName,
      params: {
        y_step: 5,
        bars: [
          { label: 'Mon', value: 10 },
          { label: 'Tue', value: 15 },
        ],
      },
    };
    expect(renderVisual(visual)).toContain('<svg');
    expect(describeVisual(visual)).toContain('Mon: 10');
  });
});
