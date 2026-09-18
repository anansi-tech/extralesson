import { describe, expect, it } from 'vitest';
import { readFields, readContext, normaliseSlotRef, type ReadPart } from '@/lib/grade/read-fields';
import { structuredPrefill } from '@/lib/grade/prefill';
import { fillEmpty, readDiffers } from '@/lib/grade/fill-empty';

const parts: ReadPart[] = [
  { label: 'a', prompt: 'Complete the statement.', statement: 'The frame has {} line of symmetry and order {}.', slots: [{ label: 'i', answer: '1' }, { label: 'ii', answer: '1' }] },
  { label: 'b', prompt: 'Find BD. Give a reason.', slots: [{ label: 'i', answer: '5 m' }, { label: 'ii', answer: 'SECRET REASON', response_mode: 'explain' }] },
  { label: 'c', prompt: 'Find D.', slots: [{ label: 'i', answer: '(4,5)' }] },
  { label: 'd', prompt: 'Find the matrix.', slots: [{ label: 'i', answer: '\\begin{pmatrix}1 & 2 \\\\ 3 & 4\\end{pmatrix}' }] },
];
const suggestion = (slot_ref: string, entries: string[], source_lines = [1]) => ({ slot_ref, entries, source_lines });
const read = (answers: ReturnType<typeof suggestion>[]) => ({ legible: true, lines: [{ text: 'The frame has 1 line of symmetry.' }, { text: 'D = (4,5)' }], answers });
const empty = { answers: {}, values: {} };

describe('photo entries have a form, not just a label', () => {
  it('sends instructions, blank positions and shape, never canonical values', () => {
    const fields = readFields(parts);
    expect(fields[0]).toMatchObject({ blank: 1, boxes: 1, shape: 'number' });
    expect(fields[3]).toMatchObject({ fillable: false, mode: 'explain' });
    expect(fields[5]).toMatchObject({ boxes: 4, columns: 2 });
    expect(JSON.stringify(fields)).not.toContain('SECRET REASON');
    expect(fields.every((f) => !('answer' in f) && !('values' in f))).toBe(true);
  });
  it('does not leak the size of a variable-length answer', () => {
    const variable = [{ label: 'a', slots: [{ label: 'i', answer: '{1,2,3,4,5,6}' }] }];
    expect(readFields(variable)[0].boxes).toBeUndefined();
    expect(structuredPrefill(variable, read([suggestion('a.i', ['9', '8'])])).values).toEqual({ 'a.i': ['9', '8'] });
  });
  it('excludes answer keys and private metadata even if present on the database object', () => {
    const question = { stem: 'A public question.', parts, worked_solution: 'PRIVATE SOLUTION', rubric: [{ criterion: 'PRIVATE RUBRIC' }], gen_meta: { secret: 'PRIVATE META' } };
    expect(JSON.stringify(readContext(question))).not.toMatch(/SECRET REASON|PRIVATE/);
  });
  it('fills only the explicitly read blank, not the missing rotational order', () => {
    expect(structuredPrefill(parts, read([suggestion('a.i', ['1'])]))).toEqual({ answers: { 'a.i': '1' }, values: {} });
  });
  it('rejects the original sentence-in-a-number-box failure', () => {
    expect(structuredPrefill(parts, read([suggestion('a.i', ['The frame has 1 line of symmetry.'])]))).toEqual(empty);
  });
  it('rejects units in a plain numeric blank and two blanks bundled into one suggestion', () => {
    expect(structuredPrefill(parts, read([suggestion('a.i', ['1m'])]))).toEqual(empty);
    expect(structuredPrefill(parts, read([suggestion('a.i', ['1', '1'])]))).toEqual(empty);
  });
  it('accepts wrong written numbers without correcting them', () => {
    expect(structuredPrefill(parts, read([suggestion('a.i', ['7'])])).answers['a.i']).toBe('7');
  });
  it('uses explicit components regardless of the labelled transcription format', () => {
    expect(structuredPrefill(parts, read([suggestion('c.i', ['4', '5'], [2])])).values).toEqual({ 'c.i': ['4', '5'] });
  });
  it('preserves matrix row-major order', () => {
    expect(structuredPrefill(parts, read([suggestion('d.i', ['9', '8', '7', '6'])])).values['d.i']).toEqual(['9', '8', '7', '6']);
  });
  it('normalises the observed trailing-dot reference', () => {
    expect(structuredPrefill(parts, read([suggestion('a.i.', ['1'])])).answers['a.i']).toBe('1');
    expect(normaliseSlotRef('(a)(ii)')).toBe('a.ii');
  });
  it.each([
    [suggestion('a.i', ['1']), suggestion('a.i.', ['2'])],
    [suggestion('z.i', ['1'])], [suggestion('b.ii', ['a reason'])],
    [suggestion('c.i', ['4'])], [suggestion('c.i', ['4', ''])],
    [suggestion('a.i', ['1'], [])], [suggestion('a.i', ['1'], [3])],
  ])('abstains on duplicate, unknown, non-fillable or unsupported entries: %j', (...answers) => {
    expect(structuredPrefill(parts, read(answers))).toEqual(empty);
  });
  it('does not trust entries from an illegible photo', () => {
    expect(structuredPrefill(parts, { ...read([suggestion('a.i', ['1'])]), legible: false })).toEqual(empty);
  });
  it('keeps old transcriptions readable but never guesses structured entries from them', () => {
    expect(structuredPrefill(parts, { legible: true, lines: [], answers: [{ slot_ref: 'a.i' }] })).toEqual(empty);
  });
  it('retakes and late uploads fill gaps, not existing answers or partial grids', () => {
    expect(fillEmpty({ answers: { 'a.i': '2' }, values: { 'c.i': ['9', ''] } }, {
      answers: { 'a.i': '1', 'a.ii': '1' }, values: { 'c.i': ['4', '5'] },
    })).toEqual({ answers: { 'a.ii': '1' }, values: {} });
  });

  // What fillEmpty kept the student's entry OVER. A drop said nothing, so a box
  // holding one stray character looked exactly like a box the page never read.
  it('names every box the read disagreed with, and what it read there', () => {
    expect(readDiffers({ answers: { 'a.i': '2' }, values: { 'c.i': ['9', ''] } }, {
      answers: { 'a.i': '1', 'a.ii': '1' }, values: { 'c.i': ['4', '5'] },
    })).toEqual({ 'a.i': '1', 'c.i': '4, 5' });
  });
  it('says nothing about an empty box, which the read fills, or one that already agrees', () => {
    expect(readDiffers({ answers: { 'a.i': '', 'a.ii': '  1  ' }, values: {} }, {
      answers: { 'a.i': '1', 'a.ii': '1' }, values: {} },
    )).toEqual({});
  });
  it('reports a gap seeded with one character against the value the page held', () => {
    // 797be2 (c.i): the strip's own key in the box, "40 <= m < 50" on the page.
    expect(readDiffers({ answers: { 'c.i': '≤' }, values: {} }, { answers: { 'c.i': '40 <= m < 50' }, values: {} }))
      .toEqual({ 'c.i': '40 <= m < 50' });
  });
});
