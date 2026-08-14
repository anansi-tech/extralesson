import { describe, expect, it } from 'vitest';
import { deterministicPresentationIssues } from '@/lib/generation/question-quality';
import { QuestionVisualZ } from '@/lib/validation/question-visual';

describe('deterministic presentation quality', () => {
  it('rejects a diagram confined to a tiny part of the fixed canvas', () => {
    const visual = QuestionVisualZ.parse({
      format: 'diagram', visual_type: 'geometry-figure',
      alt_text: 'Three points making a small right angle.',
      points: [
        { id: 'P', x: 1, y: 1 },
        { id: 'Q', x: 7, y: 3 },
        { id: 'R', x: 6, y: 6 },
      ],
      segments: [{ from: 'P', to: 'Q' }, { from: 'Q', to: 'R' }],
    });
    expect(deterministicPresentationIssues(visual)).toEqual(['visual-scale-risk']);
  });

  it('accepts a diagram that uses the available canvas', () => {
    const visual = QuestionVisualZ.parse({
      format: 'diagram', visual_type: 'geometry-figure',
      alt_text: 'Three points making a large triangle.',
      points: [
        { id: 'A', x: 10, y: 80 },
        { id: 'B', x: 50, y: 10 },
        { id: 'C', x: 90, y: 80 },
      ],
      segments: [
        { from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'C', to: 'A' },
      ],
    });
    expect(deterministicPresentationIssues(visual)).toEqual([]);
  });
});
