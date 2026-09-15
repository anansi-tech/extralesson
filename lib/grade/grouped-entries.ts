import { readInputShape } from './input-shape';

/** Preserve written group boundaries; never infer missing members from the key. */
export function groupedEntries(entries: string[], group: { size: number; kind: '(' | '{' }): string[] | null {
  const values = entries.map(v => v.trim());
  // The growing form leaves empty trailing boxes. Interior gaps are not removed.
  while (values.length && !values[values.length - 1]) values.pop();
  if (!values.length || values.some(v => !v)) return null;
  const isGroup = (v: string) => group.kind === '{'
    ? /^(?:\$)?(?:\\left)?(?:\\)?\{/.test(v)
    : v.startsWith('(');
  if (values.some(isGroup)) {
    if (!values.every(isGroup)) return null;
    const readings = values.map(readInputShape);
    if (readings.some(r => r.groups || r.values.length !== group.size || r.shape !== (group.kind === '{' ? 'set' : 'coordinate'))) return null;
    return readings.flatMap(r => r.values);
  }
  if (values.length % group.size) return null;
  // A component must not itself contain a list/set/pair or unmatched delimiters.
  if (values.some(v => ['set', 'list', 'coordinate'].includes(readInputShape(v).shape))) return null;
  return values;
}
