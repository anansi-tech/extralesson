import { expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { structuredPrefill } from '@/lib/grade/prefill';
import { readFields } from '@/lib/grade/read-fields';
import { inputGroup, readInputShape } from '@/lib/grade/input-shape';
import { groupedEntries } from '@/lib/grade/grouped-entries';
import { composeAnswer, componentsEquivalent } from '@/lib/grade/components';
import { TypedInput } from '@/app/study/session/[id]/typed-input';

const answer = '{{1,2},{1,3},{1,6},{2,3},{2,6},{3,6}}';
const written = ['{1, 2}', '{1, 3}', '{1, 6}', '{2, 3}', '{2, 6}', '{3, 6}'];
const key = readInputShape(answer);
const parts = [{ label: 'c', slots: [{ label: 'i', answer }] }];
const fill = (entries: string[]) => structuredPrefill(parts, { legible: true, lines: [{ text: written.join(', ') }], answers: [{ slot_ref: 'c.i', entries, source_lines: [1] }] });

it('replays the saved six-subset suggestions through prefill, composition and grading', () => {
  const values = fill(written).values['c.i'];
  expect(values).toEqual(key.values);
  expect(composeAnswer(values, key.shape, key)).toBe('{{1, 2}, {1, 3}, {1, 6}, {2, 3}, {2, 6}, {3, 6}}');
  expect(componentsEquivalent(values, answer)).toBe(true);
  expect(fill(key.values).values['c.i']).toEqual(values);
});
it.each([2, 3, 4, 6])('handles %i subsets without exposing their count', n => {
  const subsetAnswer = `{${written.slice(0, n).join(',')}}`;
  const p = [{ label: 'c', slots: [{ label: 'i', answer: subsetAnswer }] }];
  const field = readFields(p)[0];
  expect(field.group).toEqual({ size: 2, kind: '{' });
  expect(field.boxes).toBeUndefined();
  const v = groupedEntries(written.slice(0, n), field.group!)!;
  expect(componentsEquivalent(v, subsetAnswer)).toBe(true);
  expect(composeAnswer(v, 'set', readInputShape(subsetAnswer))).not.toContain('{}');
});
it.each([
  ['{1,2}', '3'], ['{1,2}', '{}'], ['{1,2,3}'], ['{{1,2},{3,4}}'], ['1', '', '2', '3'], ['1', '2', '3'],
])('rejects malformed or mixed group suggestions %j', (...entries) => {
  expect(fill(entries).values).toEqual({});
});
it('preserves wrong values, omissions and extra groups without inventing empty groups', () => {
  const values = fill(['{9,8}', '{1,3}']).values['c.i'];
  expect(values).toEqual(['9', '8', '1', '3']);
  expect(componentsEquivalent(values, answer)).toBe(false);
  expect(composeAnswer(values, 'set', key)).toBe('{{9, 8}, {1, 3}}');
  expect(composeAnswer([...key.values, '8', '9'], 'set', key)).toContain('{8, 9}');
});
it('keeps subsets unordered but ordered pairs ordered', () => {
  expect(componentsEquivalent(groupedEntries(['{6,3}', ...written.slice(0, 5)], inputGroup(key)!)!, answer)).toBe(true);
  expect(componentsEquivalent(['2', '1', '3', '4'], '{(1,2),(3,4)}')).toBe(false);
});
it.each([
  ['{{1,3},{2,3},{3,4},{3,6}}', ['{1,3}', '{2,3}', '{3,4}', '{3,6}']],
  ['{{2,3},{3,6}}', ['{2,3}', '{3,6}']],
  ['{{A,D},{A,K},{D,K}}', ['{A,D}', '{A,K}', '{D,K}']],
  ['{{1,2,3},{4,5,6}}', ['{1,2,3}', '{4,5,6}']],
])('preserves other bank subset structures and larger uniform groups: %s', (canonical, entries) => {
  const reading = readInputShape(canonical);
  const values = groupedEntries(entries, inputGroup(reading)!)!;
  expect(componentsEquivalent(values, canonical)).toBe(true);
  expect(readInputShape(composeAnswer(values, 'set', reading)).values).toEqual(reading.values);
});
it('renders braces and one empty group without revealing the answer count', () => {
  const render = (values: string[]) => renderToStaticMarkup(createElement(TypedInput, {
    shape: 'set', group: inputGroup(key), values, onChange() {}, disabled: false,
    slotRef: 'c.i', describe: 'Subsets', onFocusBox() {},
  }));
  expect(render([]).match(/<input/g)).toHaveLength(2);
  expect(render(key.values).match(/<input/g)).toHaveLength(14);
  expect(render([])).toContain('>{</span>');
  expect(render([])).not.toContain('>(</span>');
});
