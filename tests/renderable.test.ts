import { describe, expect, it } from 'vitest';
import { answerIssues, clozeIssues, delimiterIssues, labelIssues } from '@/lib/validation/renderable';

// The layer the August audit found missing. Every defect it catalogued was
// storable, so every previous repair had been a database repair and the next
// batch reproduced the same classes.
describe('delimiterIssues', () => {
  it('rejects $$ display maths, which this renderer cannot parse', () => {
    expect(delimiterIssues('so $$x=1$$ follows').join(' ')).toContain('$$');
  });

  it('rejects a $ that opens and never closes', () => {
    expect(delimiterIssues('the angle $PAB is 40').join(' ')).toContain('odd number');
  });

  it('rejects a control character where a command belonged', () => {
    const esc = String.fromCharCode(27);
    expect(delimiterIssues('see ' + esc + '[vec]{AB}').join(' ')).toContain('control character');
  });

  it('accepts money, which is escaped and is not a delimiter', () => {
    expect(delimiterIssues('costs \\$45 and \\$60 today')).toEqual([]);
    expect(delimiterIssues('area is $x^2$ and it costs \\$45')).toEqual([]);
  });

  it('accepts display maths written the way this renderer reads it', () => {
    expect(delimiterIssues('so \\[x=1\\] follows')).toEqual([]);
  });
});

describe('clozeIssues', () => {
  it('rejects a gap inside maths, which leaves both halves unmatched', () => {
    expect(clozeIssues('so $n(A \\cap B) = {}$.').join(' ')).toContain('outside the maths');
  });

  it('accepts a gap outside maths', () => {
    expect(clozeIssues('so $n(A \\cap B) =$ {}.')).toEqual([]);
    expect(clozeIssues('the gradient is {} and $g$ is {}.')).toEqual([]);
  });
});

describe('answerIssues', () => {
  it('rejects a semicolon inside maths, since answers split on it first', () => {
    expect(answerIssues('$(3,0);\\ (3,4)$').join(' ')).toContain('split on');
  });

  it('accepts a semicolon separating whole values, which is the convention', () => {
    expect(answerIssues('x = 2; y = 3')).toEqual([]);
    expect(answerIssues('$x = 2$; $y = 3$')).toEqual([]);
  });
});

describe('labelIssues', () => {
  it('rejects maths in a label, which is drawn as plain text', () => {
    expect(labelIssues('Frequency, $f$').join(' ')).toContain('plain text');
  });

  it('accepts a plain label', () => {
    expect(labelIssues('Frequency')).toEqual([]);
    expect(labelIssues('Time t (s)')).toEqual([]);
  });
});
