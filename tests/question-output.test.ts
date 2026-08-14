import { describe, expect, it } from 'vitest';
import { repairQuestionOutput } from '@/lib/generation/question-output';

describe('repairQuestionOutput', () => {
  it('derives a missing renderer format from a known visual type', () => {
    const repaired = repairQuestionOutput(JSON.stringify({
      stem: 'Original question wording',
      visual: { visual_type: 'set-diagram', sets: [] },
    }));

    expect(JSON.parse(repaired!)).toEqual({
      stem: 'Original question wording',
      visual: { format: 'set-diagram', visual_type: 'set-diagram', sets: [] },
    });
  });

  it('does not rewrite content with an existing format or unknown type', () => {
    expect(repairQuestionOutput(JSON.stringify({
      visual: { format: 'plot', visual_type: 'function-graph' },
    }))).toBeNull();
    expect(repairQuestionOutput(JSON.stringify({
      visual: { visual_type: 'unknown' },
    }))).toBeNull();
  });

  it('omits empty optional visual labels without changing mathematical data', () => {
    const repaired = repairQuestionOutput(JSON.stringify({
      stem: 'Use the graph.',
      visual: {
        format: 'plot', visual_type: 'function-graph', x_range: [-2, 2],
        series: [{ label: '', points: [{ x: -1, y: 2, label: '' }, { x: 1, y: 4 }] }],
      },
    }));
    expect(JSON.parse(repaired!)).toEqual({
      stem: 'Use the graph.',
      visual: {
        format: 'plot', visual_type: 'function-graph', x_range: [-2, 2],
        series: [{ points: [{ x: -1, y: 2 }, { x: 1, y: 4 }] }],
      },
    });
  });

  it('pads omitted table cells without inventing values or truncating rows', () => {
    const repaired = repairQuestionOutput(JSON.stringify({
      visual: {
        format: 'table', visual_type: 'data-table',
        headers: ['Interval', 'Frequency', 'Cumulative frequency'],
        rows: [['0–9', '4', '4'], ['10–19', '7']],
      },
    }));
    expect(JSON.parse(repaired!).visual.rows).toEqual([
      ['0–9', '4', '4'],
      ['10–19', '7', ''],
    ]);
  });
});
