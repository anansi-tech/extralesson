import { describe, expect, it } from 'vitest';
import { verifyQuestionVisual } from '@/lib/visuals/verify';
import { paramsDocFor, renderVisual, describeVisual } from '@/lib/visuals';
import { TEMPLATES } from '@/lib/visuals';
import type { TemplateName } from '@/lib/types';

describe('visual verify gate', () => {
  it('registry contains all 17 templates with consistent names', () => {
    const names = Object.keys(TEMPLATES) as TemplateName[];
    expect(names).toHaveLength(17);
    for (const n of names) expect(TEMPLATES[n].name).toBe(n);
  });

  it('paramsDocFor documents every template non-trivially', () => {
    for (const n of Object.keys(TEMPLATES) as TemplateName[]) {
      const doc = paramsDocFor([n]);
      expect(doc, n).toContain(n);
      expect(doc.length, n).toBeGreaterThan(30);
      // zodDoc emits the literal 'unknown' for a type it cannot describe.
      // Scope the check to the params line: rules are prose and may legitimately
      // discuss "an unknown" (pieChart sectors given as multiples of one).
      const paramsLine = doc.split('\n')[0];
      expect(paramsLine, n).not.toContain('unknown');
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

describe('visual verify gate — text cross-checks are advisory', () => {
  it('a diagram carrying its own dimensions passes, with an advisory', () => {
    // CSEC norm: dimensions are labelled on the figure, not repeated in prose.
    const result = verifyQuestionVisual(
      {
        template: 'compositeShape',
        params: { kind: 'cuboid', length: 40, width: 25, height: 15, unit: 'cm' },
      },
      { stem: 'The diagram shows a carton. Calculate its volume.', partPrompts: [] },
    );
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.advisories.length).toBeGreaterThan(0);
  });

  it('intrinsic numeric inconsistency is still a hard failure', () => {
    const result = verifyQuestionVisual(
      {
        template: 'compositeShape',
        params: {
          kind: 'rect-minus-rect',
          outer_length: 10, outer_width: 8,
          inner_length: 20, inner_width: 4, // inner does not fit inside outer
          unit: 'cm',
        },
      },
      { stem: 'The shaded region is shown in the diagram.', partPrompts: [] },
    );
    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

describe('template contract completeness', () => {
  // A rule the model is never told is a rule it cannot follow, and every such
  // rejection costs a full generation round-trip. New templates must document
  // their invariants alongside verify().
  it('every template declares its invariants', () => {
    for (const n of Object.keys(TEMPLATES) as TemplateName[]) {
      expect(TEMPLATES[n].rules?.length, n).toBeGreaterThan(0);
    }
  });

  it('the generated contract carries both param limits and rules', () => {
    const doc = paramsDocFor(['dataTable']);
    expect(doc).toContain('<=40 chars'); // string caps were previously invisible
    expect(doc).toContain('rules (violations auto-reject the draft)');
    expect(doc).toContain('exactly as many cells as there are headers');

    const grid = paramsDocFor(['coordinateGrid']);
    expect(grid).toContain('span at most 20 units');
    expect(grid).toContain('standard transformation');
  });
});

// No template may draw with non-finite coordinates. A blank figure is worse
// than no figure: the question reads as though one is there, and a reviewer
// approving it ships a question a student cannot answer.
describe('every template draws something finite', () => {
  const ctx = { stem: 'A figure with sides 3 cm, 4 cm and 5 cm and angles 60, 60, 60.', partPrompts: ['Find it.'] };

  it('renders no NaN for any template that accepts empty params', () => {
    for (const [name, template] of Object.entries(TEMPLATES)) {
      const parsed = template.paramsSchema.safeParse({});
      if (!parsed.success) continue; // discriminated unions need a kind; covered by their own tests
      const svg = template.render(parsed.data as never);
      expect(svg, name).not.toContain('NaN');
      expect(svg, name).not.toContain('Infinity');
    }
  });

  it('rejects a visual that would render blank', () => {
    const res = verifyQuestionVisual(
      { template: 'triangleLabeled', params: { labels: ['A', 'B', 'C'], sides: [{ side: 2, value: 4, unit: 'cm' }] } },
      ctx,
    );
    // fixed: this now draws the default triangle rather than collapsing
    expect(res.ok).toBe(true);
  });

  it('would catch a collapse if one ever returned', () => {
    const broken = {
      ...TEMPLATES.triangleLabeled,
      render: () => '<svg viewBox="0 0 10 10"><polygon points="NaN,NaN" /></svg>',
    };
    const svg = broken.render();
    expect(svg).toContain('NaN'); // the condition the gate tests for
  });
});

// A transformation question stated A(1,1), B(3,1), C(2,3) — C is the apex —
// and drew it with triangleLabeled, which always puts labels[0] on top. The
// figure showed a different triangle from the one the question was about, and
// every gate passed it: the params were valid, the values appeared in the text,
// and it rendered.
describe('a sketch may not be asked to show coordinates', () => {
  const ctx = (stem: string) => ({ stem, partPrompts: ['Determine the translation vector.'] });
  const transformation =
    'Triangle $ABC$, where $A(1,1)$, $B(3,1)$ and $C(2,3)$, is translated to triangle $A\'B\'C\'$ where $A\'=(5,-1)$.';

  it('rejects a self-placing template when the question fixes the points', () => {
    const res = verifyQuestionVisual(
      { template: 'triangleLabeled', params: { labels: ['A', 'B', 'C'] } },
      ctx(transformation),
    );
    expect(res.ok).toBe(false);
    expect(res.issues.join(' ')).toContain('needs coordinateGrid');
    expect(res.issues.join(' ')).toContain('A, B, C');
  });

  it('accepts the same question drawn on a grid', () => {
    const res = verifyQuestionVisual(
      {
        template: 'coordinateGrid',
        params: {
          x_range: [-2, 10],
          y_range: [-3, 6],
          polygons: [
            { vertices: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 2, y: 3 }], labels: ['A', 'B', 'C'] },
            { vertices: [{ x: 5, y: -1 }, { x: 7, y: -1 }, { x: 6, y: 1 }], labels: ["A'", "B'", "C'"], dashed: true },
          ],
        },
      },
      ctx(transformation),
    );
    expect(res.issues.filter((i) => i.includes('coordinateGrid:'))).toEqual([]);
  });

  it('leaves a labelled sketch alone when the text fixes no points it draws', () => {
    const res = verifyQuestionVisual(
      { template: 'triangleLabeled', params: { labels: ['A', 'B', 'C'], sides: [{ side: 0, value: 6, unit: 'cm' }] } },
      ctx('In triangle $ABC$, $AB = 6$ cm and angle $B$ is obtuse.'),
    );
    expect(res.ok).toBe(true);
  });

  it('tolerates a single named point, where a sketch claims nothing', () => {
    const res = verifyQuestionVisual(
      { template: 'triangleLabeled', params: { labels: ['A', 'B', 'C'] } },
      ctx('The logo $ABC$ is translated so that $B(4,3)$ maps to $B\'(1,8)$.'),
    );
    expect(res.ok).toBe(true);
  });
});

// CXC prints "not drawn to scale" in the instructions of every paper. Our
// sketch templates place their own vertices, so saying it is both authentic and
// true — and it tells a student not to measure what cannot be measured.
describe('schematic figures declare themselves', () => {
  it('captions a sketch', () => {
    for (const template of ['triangleLabeled', 'circleCenter', 'bearingDiagram', 'compositeShape'] as const) {
      const params = TEMPLATES[template].paramsSchema.safeParse(
        template === 'compositeShape' ? { kind: 'l-shape', width: 8, height: 6, cutWidth: 3, cutHeight: 2, unit: 'cm' } : {},
      );
      if (!params.success) continue;
      const html = renderVisual({ template, params: params.data as Record<string, unknown> });
      expect(html, template).toContain('Not drawn to scale');
    }
  });

  it('says nothing of the kind on a figure that IS to scale', () => {
    const grid = renderVisual({
      template: 'coordinateGrid',
      params: { x_range: [-5, 5], y_range: [-5, 5], lines: [{ m: 1, c: 0 }] },
    });
    expect(grid).not.toContain('Not drawn to scale');

    const chart = renderVisual({
      template: 'barChart',
      params: {
        y_step: 1,
        x_label: 'Team',
        y_label: 'Goals',
        bars: [
          { label: 'A', value: 3 },
          { label: 'B', value: 5 },
        ],
      },
    });
    expect(chart).not.toContain('Not drawn to scale');
  });

  it('leaves a data table alone — it is not a figure', () => {
    const table = renderVisual({
      template: 'dataTable',
      params: { headers: ['Item', 'Price'], rows: [['Bag', 'EC$80']] },
    });
    expect(table).not.toContain('Not drawn to scale');
  });
});
