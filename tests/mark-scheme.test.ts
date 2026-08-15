import { describe, expect, it } from 'vitest';
import { isFollowThrough, lintCriteria, MARK_SCHEME_CONVENTIONS } from '@/lib/prompts/mark-scheme';
import { exemplarsFor } from '@/lib/prompts/exemplars';

// R1.7 §B3 / Part C — the official scheme writes criteria in a small, consistent
// language, and ours should read the same way. The lint is advisory: it reports
// wording a reviewer should look at, and never rejects a question.
const row = (criterion: string) => ({ code: 'AK1', criterion, part_label: 'a', profile: 'AK' as const });

describe('lintCriteria', () => {
  it('passes criteria written in the scheme’s register', () => {
    expect(
      lintCriteria([
        row('Substitutes into the compound-interest formula'),
        row('CAO $47.50$'),
        row('Divides "their" total by 8'),
        row('Forms an equation in one variable from the comparison'),
        row('Reads the median from the cumulative-frequency curve'),
      ]),
    ).toEqual([]);
  });

  it('flags a criterion that marks a state of mind', () => {
    const issues = lintCriteria([row('Student understands that the angles sum to 180')]);
    expect(issues.map((i) => i.issue).join(' ')).toContain('state of mind');
  });

  it('flags prose that is a sentence rather than a scheme entry', () => {
    const long = 'Shows a complete and clearly reasoned argument that the two composite functions are different, referring to both rules';
    expect(lintCriteria([row(long)]).map((i) => i.issue).join(' ')).toContain('sentence, not a scheme entry');
  });

  it('flags a criterion that opens with no descriptor at all', () => {
    expect(lintCriteria([row('The correct final value')])).toHaveLength(1);
  });

  it('reports which row is at fault, so a reviewer can find it', () => {
    const issues = lintCriteria([
      { code: 'R1', criterion: 'Pupil knows the formula', part_label: 'c', profile: 'R' },
    ]);
    expect(issues[0].part_label).toBe('c');
    expect(issues[0].code).toBe('R1');
  });
});

describe('follow-through wording', () => {
  it('recognises a criterion that credits the candidate’s own value', () => {
    expect(isFollowThrough('Divides "their" total by 8')).toBe(true);
    expect(isFollowThrough('Follow-through from (b)')).toBe(true);
    expect(isFollowThrough('CAO $47.50$')).toBe(false);
  });

  it('is taught to the model as the scheme states it', () => {
    expect(MARK_SCHEME_CONVENTIONS).toContain('CAO');
    expect(MARK_SCHEME_CONVENTIONS).toContain('Follow-through');
    expect(MARK_SCHEME_CONVENTIONS).toContain("candidate's OWN earlier answer");
  });
});

describe('exemplars model the vocabulary they teach', () => {
  for (const module of [1, 2, 3] as const) {
    it(`module ${module} structured exemplar rubrics pass the lint`, () => {
      const text = exemplarsFor(module, 'structured');
      const criteria = [...text.matchAll(/"criterion":\s*"((?:[^"\\]|\\.)*)"/g)].map((m) =>
        m[1].replace(/\\"/g, '"'),
      );
      expect(criteria.length).toBeGreaterThan(0);
      expect(lintCriteria(criteria.map(row))).toEqual([]);
    });
  }
});

describe('the descriptor list is a vocabulary, not a loophole', () => {
  it('accepts the scheme’s own finding verbs', () => {
    expect(lintCriteria([row('Finds angle $QPR = 36.9°$')])).toEqual([]);
    expect(lintCriteria([row('Obtains $x = 4$ from the factorised form')])).toEqual([]);
  });

  it('still refuses a criterion that only claims the student understood', () => {
    for (const c of ['Shows understanding of the angle sum', 'Knows the compound-interest formula']) {
      expect(lintCriteria([row(c)]).map((i) => i.issue).join(' '), c).toContain('state of mind');
    }
  });
});
