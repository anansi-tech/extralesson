import { answersEquivalentAny } from './equivalence';
import type { Rounding } from './rounding';
import { readInputShape } from './input-shape';

/**
 * Each box is compared with the value in the SAME POSITION of the mark scheme;
 * only shapes that carry no order match as a set. Matching every answer as an
 * unordered set called a backwards coordinate right, across 220 live slots.
 */
export function componentsEquivalent(
  entered: string[],
  canonicalAnswer: string,
  accept?: string[],
  rounding: Rounding | null = null,
): boolean {
  const same = (v: string, k: string) => answersEquivalentAny(v, k, undefined, rounding);
  const against = (candidate: string): boolean => {
    const key = readInputShape(candidate);
    if (key.values.length !== entered.length) return false;
    // GROUPED: the elements are pairs or subsets. Which group a value sits in
    // is part of the answer — (Mango, H) and (Coconut, H) share a value and
    // are different outcomes — so the groups are matched whole. Inside one, a
    // parenthesised pair is ordered and a braced subset is not.
    if (key.groups) {
      const cut = (vals: string[]) => {
        const out: string[][] = [];
        let at = 0;
        for (const size of key.groups!) { out.push(vals.slice(at, at + size)); at += size; }
        return out;
      };
      const mine = cut(entered);
      const theirs = cut(key.values);
      const sameGroup = (a: string[], b: string[]) =>
        a.length === b.length &&
        (key.groupKind === '('
          ? a.every((v, i) => same(v, b[i]))
          : a.every((v) => b.some((k) => same(v, k))) && b.every((k) => a.some((v) => same(v, k))));
      const used = new Array<boolean>(theirs.length).fill(false);
      return mine.every((g) => {
        const i = theirs.findIndex((t, j) => !used[j] && sameGroup(g, t));
        if (i === -1) return false;
        used[i] = true;
        return true;
      });
    }
    if (key.ordered) {
      return entered.every((v, i) => same(v, key.values[i]));
    }
    const used = new Array<boolean>(key.values.length).fill(false);
    return entered.every((v) => {
      const i = key.values.findIndex((k, j) => !used[j] && same(v, k));
      if (i === -1) return false;
      used[i] = true;
      return true;
    });
  };
  return against(canonicalAnswer) || (accept ?? []).some(against);
}

/**
 * Storage and display only — marking never reads this back apart again.
 * `groups` puts the brackets back where the answer has them, so a record of
 * {(1,H),(2,H)} does not read as four loose values.
 */
export function composeAnswer(
  entered: string[],
  shape: string,
  grouping?: { groups?: number[]; groupKind?: '(' | '{' },
): string {
  const vals = entered.map((v) => v.trim());
  if (grouping?.groups) {
    const close = grouping.groupKind === '(' ? ')' : '}';
    const parts: string[] = [];
    let at = 0;
    for (const size of grouping.groups) {
      parts.push(`${grouping.groupKind}${vals.slice(at, at + size).join(', ')}${close}`);
      at += size;
    }
    // Anything the groups do not account for still has to appear.
    if (at < vals.length) parts.push(...vals.slice(at));
    return shape === 'set' ? `{${parts.join(', ')}}` : parts.join(', ');
  }
  if (shape === 'coordinate') return `(${vals.join(', ')})`;
  if (shape === 'ratio') return vals.join(' : ');
  if (shape === 'set') return `{${vals.join(', ')}}`;
  if (shape === 'column_vector' || shape === 'matrix') return `[${vals.join(', ')}]`;
  if (shape === 'roots') return vals.join(' or ');
  return vals.join(', ');
}
