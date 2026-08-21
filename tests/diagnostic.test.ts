import { describe, expect, it } from 'vitest';
import { rankByVerdict, topicsSeen, verdictFor } from '@/lib/study/diagnostic';

const topicOf = new Map([
  ['q1', 'M1.1.'],
  ['q2', 'M1.2.'],
  ['q3', 'M1.2.'],
  ['q4', 'M2.1.'],
]);

describe('topicsSeen / verdictFor — what one question a topic can say', () => {
  it('reports right and wrong per topic', () => {
    const seen = topicsSeen(
      [
        { question_id: 'q1', correct: true },
        { question_id: 'q2', correct: true },
        { question_id: 'q3', correct: false },
        { question_id: 'q4', correct: false },
      ],
      topicOf,
    );
    expect(verdictFor(seen.get('M1.1.'))).toBe('HELD UP');
    expect(verdictFor(seen.get('M1.2.'))).toBe('MIXED');
    expect(verdictFor(seen.get('M2.1.'))).toBe('STRUGGLED');
  });

  it('says nothing about a topic it never asked about', () => {
    expect(verdictFor(undefined)).toBe(null);
    expect(verdictFor({ right: 0, asked: 0 })).toBe(null);
  });
});

// The bug this locks: the list was ordered by overall topic mastery, which
// folds every attempt the student has ever made, while the chips reported what
// THIS session saw. The topic printed top read STRUGGLED and the one below it
// HELD UP, because the top one carried marks from earlier structured work the
// diagnostic never touched. Two measurements in one list.
describe('rankByVerdict — the order matches the evidence beside it', () => {
  const topics = [
    { code: 'a', module: 1, order: 1, mastery: 0.9 },
    { code: 'b', module: 1, order: 2, mastery: 0.1 },
    { code: 'c', module: 2, order: 1, mastery: 0.5 },
  ];

  it('puts what held up above what struggled, whatever mastery says', () => {
    const verdicts: Record<string, 'HELD UP' | 'STRUGGLED'> = {
      a: 'STRUGGLED',
      b: 'HELD UP',
      c: 'HELD UP',
    };
    const ranked = rankByVerdict(topics, (t) => verdicts[(t as { code: string }).code]);
    expect(ranked.map((t) => t.code)).toEqual(['b', 'c', 'a']);
  });

  // One question cannot separate two topics that both held up.
  it('keeps syllabus order inside a group rather than inventing one', () => {
    const ranked = rankByVerdict(topics, () => 'HELD UP');
    expect(ranked.map((t) => t.code)).toEqual(['a', 'b', 'c']);
  });
});
