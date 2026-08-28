import { answersEquivalentAny } from './equivalence';
import { readInputShape } from './input-shape';

/**
 * Marking an answer the student entered as SEPARATE VALUES.
 *
 * When the input is typed to the answer's shape, the student fills one box per
 * value and never types a delimiter — so the marker never parses one. Each box
 * is compared against the value in the SAME POSITION of the mark scheme.
 *
 * That position is the point. answersEquivalent() matches a multi-part answer
 * as an UNORDERED set, which is right for roots and sets and wrong for
 * everything else, and it cannot tell them apart from a single string. It was
 * accepting a coordinate written backwards, a matrix with its entries
 * scrambled, and shares handed to the wrong people — 220 slots in the live bank
 * where a student could be told a wrong answer was right.
 *
 * Order is structural here: box 1 is compared with value 1 because it IS box 1.
 * Only the shapes that genuinely carry no order match as a set.
 */
export function componentsEquivalent(
  entered: string[],
  canonicalAnswer: string,
  accept?: string[],
): boolean {
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
          ? a.every((v, i) => answersEquivalentAny(v, b[i]))
          : a.every((v) => b.some((k) => answersEquivalentAny(v, k))) &&
            b.every((k) => a.some((v) => answersEquivalentAny(v, k))));
      const used = new Array<boolean>(theirs.length).fill(false);
      return mine.every((g) => {
        const i = theirs.findIndex((t, j) => !used[j] && sameGroup(g, t));
        if (i === -1) return false;
        used[i] = true;
        return true;
      });
    }
    if (key.ordered) {
      return entered.every((v, i) => answersEquivalentAny(v, key.values[i]));
    }
    // Unordered: every entered value must claim a distinct value of the key.
    const used = new Array<boolean>(key.values.length).fill(false);
    return entered.every((v) => {
      const i = key.values.findIndex((k, j) => !used[j] && answersEquivalentAny(v, k));
      if (i === -1) return false;
      used[i] = true;
      return true;
    });
  };
  return against(canonicalAnswer) || (accept ?? []).some(against);
}

/**
 * The values joined for the attempt record, in the notation the papers use.
 * Storage and display only — marking never reads this back apart again.
 *
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
