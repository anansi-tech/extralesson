import { describe, expect, it } from 'vitest';
import { markableSlots, writtenSlots } from '@/lib/grade/mark';
import { linesForSlot, type TranscriptionResult } from '@/lib/grade/transcribe';
import { splitStoredAnswer } from '@/lib/study/attempt-answers';

/**
 * THE READER IS TOLD WHICH SLOTS THE QUESTION HAS, and it was told only the
 * markable ones. 037c66 part (c) is a "show that" and (d.ii) an "explain", so
 * neither was in the list — the reader transcribed both anyway, at 0.98 and
 * 0.96, and said so in its notes: "the c and d.ii working is legible but those
 * slots were not included among the requested answer slots".
 */
const parts = [
  { label: 'a', slots: [{ label: 'i' }] },
  { label: 'b', slots: [{ label: 'i' }] },
  { label: 'c', slots: [{ label: 'i', response_mode: 'show_that' }] },
  { label: 'd', slots: [{ label: 'i' }, { label: 'ii', response_mode: 'explain' }] },
  { label: 'e', slots: [{ label: 'i', response_mode: 'construct' }] },
];

describe('which slots the reader is told about', () => {
  it('is every slot the student writes into, not every slot the marker marks', () => {
    expect(markableSlots(parts)).toEqual(['a.i', 'b.i', 'd.i']);
    expect(writtenSlots(parts)).toEqual(['a.i', 'b.i', 'c.i', 'd.i', 'd.ii']);
  });

  it('and never the construct slot, which is a drawing the reader cannot transcribe', () => {
    expect(writtenSlots(parts)).not.toContain('e.i');
  });
});

/**
 * AN UNLABELLED LINE BELONGS TO THE PART ABOVE IT, which is right for a
 * continuation and wrong for a part the reader was never told existed: part
 * (c)'s derivation was filed under part (b), so (c) showed the student nothing
 * to self-mark and (b) showed a line that was not its working.
 */
describe('an unattributed line lands on the part above', () => {
  const read: TranscriptionResult = {
    legible: true,
    lines: [
      { text: '1.6, 9/5, 2, 11/5', part_label: 'a', slot_label: 'a.i', confidence: 0.99 },
      { text: 'T_n = 0.2n + 1.4', part_label: 'b', slot_label: 'b.i', confidence: 0.99 },
      { text: 'T_20 = 0.2(20) + 1.4 = 5.4kg', part_label: null, slot_label: null, confidence: 0.98 },
      { text: '23', part_label: 'd', slot_label: 'd.i', confidence: 0.99 },
    ],
    answers: [],
  };

  it('so part (c) is lost and part (b) gains a line that is not its own', () => {
    expect(linesForSlot(read, 'c')).toEqual([]);
    expect(linesForSlot(read, 'b')).toContain('T_20 = 0.2(20) + 1.4 = 5.4kg');
  });

  it('and is filed correctly once the reader knows the part exists', () => {
    const labelled: TranscriptionResult = {
      ...read,
      lines: read.lines.map((l) => (l.text.startsWith('T_20') ? { ...l, part_label: 'c', slot_label: 'c.i' } : l)),
    };
    expect(linesForSlot(labelled, 'c')).toEqual(['T_20 = 0.2(20) + 1.4 = 5.4kg']);
    expect(linesForSlot(labelled, 'b')).toEqual(['T_n = 0.2n + 1.4']);
  });
});

/**
 * splitStoredAnswer cuts the stored string at the refs it is handed, so a ref
 * left out is not dropped — its text is glued to the slot before it. d0dca9
 * stores "(b.ii) {x∈U:x is even}" and read as part of b.i's set.
 */
describe('splitting a stored answer', () => {
  const stored = '(a.i) 10; (b.i) {2,4,6,8,10}; (b.ii) {x in U:x is even}; (c.i) 8';

  it('glues an explain slot onto the answer before it when it is left out', () => {
    expect(splitStoredAnswer(stored, markableSlots([
      { label: 'a', slots: [{ label: 'i' }] },
      { label: 'b', slots: [{ label: 'i' }, { label: 'ii', response_mode: 'explain' }] },
      { label: 'c', slots: [{ label: 'i' }] },
    ]))['b.i']).toContain('(b.ii)');
  });

  it('and cuts it where it belongs when every ref is given', () => {
    const split = splitStoredAnswer(stored, writtenSlots([
      { label: 'a', slots: [{ label: 'i' }] },
      { label: 'b', slots: [{ label: 'i' }, { label: 'ii', response_mode: 'explain' }] },
      { label: 'c', slots: [{ label: 'i' }] },
    ]));
    expect(split['b.i']).toBe('{2,4,6,8,10}');
    expect(split['b.ii']).toBe('{x in U:x is even}');
  });
});
