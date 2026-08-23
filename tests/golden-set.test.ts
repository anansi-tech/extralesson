import { describe, expect, it } from 'vitest';
import { GoldenReferenceZ, GoldenSetZ, methodCandidates, scoreReading } from '@/lib/grade/golden-set';

describe('golden-set reading score', () => {
  const line = (text: string) => ({ part_label: 'a', text });

  it('penalises a reader that silently omits a line', () => {
    const score = scoreReading(
      [line('x = 2'), line('y = 3')],
      [{ ...line('x = 2'), confidence: 0.95 }],
    );

    expect(score).toMatchObject({ expected: 2, returned: 1, matched: 1, missed: 1, extra: 0 });
    expect(score.precision).toBe(1);
    expect(score.recall).toBe(0.5);
    expect(score.f1).toBeCloseTo(2 / 3);
  });

  it('does not match the same expected line twice', () => {
    const score = scoreReading(
      [line('x = 2')],
      [
        { ...line('x = 2'), confidence: 0.95 },
        { ...line('x = 2'), confidence: 0.8 },
      ],
    );

    expect(score).toMatchObject({ matched: 1, missed: 0, extra: 1 });
    expect(score.precision).toBe(0.5);
  });
});

describe('golden-set marking boundary', () => {
  it('removes rows already earned by the separately typed answer', () => {
    const question = {
      parts: [
        { label: 'a', slots: [{ label: 'i', answer: '12', response_mode: 'answer' }] },
        { label: 'b', slots: [{ label: 'i', answer: '5', response_mode: 'answer' }] },
      ],
      rubric: [
        { code: 'AK1', profile: 'AK' as const, criterion: 'CAO 12', mark_value: 1, slot_ref: 'a.i', part_label: 'a' },
        { code: 'CK1', profile: 'CK' as const, criterion: 'Uses a valid method', mark_value: 1, slot_ref: 'a.i', part_label: 'a' },
        { code: 'AK2', profile: 'AK' as const, criterion: 'Divides "their" value by 2', mark_value: 1, slot_ref: 'b.i', part_label: 'b' },
      ],
    };

    const result = methodCandidates(question, { 'a.i': '12', 'b.i': '4' });
    expect(result.deterministicallyAwarded).toEqual(['AK1', 'CK1']);
    expect(result.candidates.map((row) => row.code)).toEqual(['AK2']);
  });

  it('will not call AI proposals approved human truth', () => {
    const result = GoldenReferenceZ.safeParse({
      version: 1,
      status: 'approved',
      reviewer: null,
      reviewed_at: null,
      entries: [{ id: 'g1', case: 'early slip', student_answers: {}, marks: [] }],
    });
    expect(result.success).toBe(false);
  });
});

describe('golden artifact schemas', () => {
  it('validate private-set and proposed-reference fixtures without calling them approved', () => {
    const set = GoldenSetZ.parse([
      {
        id: 'g1',
        question_id: '6a866bc3b944c6fb77c0bf69',
        writer: 'w1',
        mode: 'photo',
        image: 'g1.jpg',
        transcript: [{ part_label: 'a', text: 'x = 2' }],
      },
    ]);
    const reference = GoldenReferenceZ.parse({
      version: 1,
      status: 'proposed',
      reviewer: null,
      reviewed_at: null,
      entries: [{ id: 'g1', case: 'arithmetic slip', student_answers: { 'a.i': '2' }, marks: [] }],
    });

    expect(set[0].writer).toBe('w1');
    expect(reference.status).toBe('proposed');
  });
});
