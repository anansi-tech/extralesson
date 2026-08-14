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
});
