import { answersEquivalentAny } from './equivalence';
import { isMultiValue, readInputShape } from './input-shape';
import { normaliseSlotRef, readFields, type ReadPart } from './read-fields';
import { groupedEntries } from './grouped-entries';

export interface Prefill {
  /** Single-box slots: one value, one box, as before. */
  answers: Record<string, string>;
  /** Multi-box slots the read split into exactly the boxes the slot has. */
  values: Record<string, string[]>;
}

/** New reads fill explicit entries, separate from the verbatim transcription. */
export function structuredPrefill(
  parts: ReadPart[],
  read: { legible: boolean; lines: { text: string }[]; answers: { slot_ref: string; entries?: string[]; source_lines?: number[] }[] },
): Prefill {
  const out: Prefill = { answers: {}, values: {} };
  if (!read.legible) return out;
  const fields = new Map(readFields(parts).map((f) => [f.ref, f]));
  const counts = new Map<string, number>();
  for (const a of read.answers) {
    const ref = normaliseSlotRef(a.slot_ref);
    counts.set(ref, (counts.get(ref) ?? 0) + 1);
  }
  for (const a of read.answers) {
    const ref = normaliseSlotRef(a.slot_ref);
    const field = fields.get(ref);
    // Reader shorthand for a numeric radical is not valid checker syntax.
    // Normalise suggested maths entries only, never verbatim lines, prose or
    // student typing. Leave symbolic/compound arguments alone: their scope
    // cannot safely be inferred from a missing pair of parentheses.
    let entries = a.entries?.map((v) => {
      const value = v.trim();
      return field?.shape && field.shape !== 'word'
        ? value.replace(/(^|[^\w\\])sqrt\s*(\d+(?:\.\d+)?)(?=$|[\s+\-*/,)\]])/g, '$1sqrt($2)')
        : value;
    });
    if (entries && field?.group) entries = groupedEntries(entries, field.group) ?? undefined;
    if (!field?.fillable || counts.get(ref) !== 1 || !entries?.length || (field.boxes !== undefined && entries.length !== field.boxes) || entries.some((v) => !v)) continue;
    if (field.pairs && entries.length % 2 !== 0) continue;
    if (!a.source_lines?.length || a.source_lines.some((n) => !Number.isInteger(n) || !read.lines[n - 1]?.text.trim())) continue;
    // This is a shape check, not a correctness check. Reject prose in numeric
    // fields; never compare with the answer key or evaluate a missing answer.
    if (field.shape === 'number' || field.shape === 'quantity') {
      const allowed = field.shape === 'number' ? ['number'] : ['number', 'quantity'];
      if (entries.some((v) => !allowed.includes(readInputShape(v).shape))) continue;
    }
    if (field.shape && isMultiValue(field.shape)) out.values[ref] = entries;
    else out.answers[ref] = entries[0];
  }
  return out;
}

/**
 * WHAT THE READ HAD FOR A BOX THAT DISAGREES WITH IT. fillEmpty keeps the
 * student's entry and says nothing about what it kept it over, so a box seeded
 * with one stray character looked exactly like a box the page never read.
 *
 * The test is AGREEMENT, not sameness: "40 ≤ m < 50" typed with the strip's own
 * key and "40 <= m < 50" from the reader are one answer written two ways, and a
 * note over that is a false alarm on a box that is already right. fillEmpty
 * keeps its own string test — never overwriting is about ownership, not
 * agreement, and it must hold whatever the box says.
 *
 * Each entry carries what the page read AND what the box held when it was
 * judged, so the card can drop a note the moment that box changes without
 * needing the marker in the browser.
 */
export function readDiffers(current: Prefill, suggested: Prefill): Record<string, { read: string; held: string }> {
  const out: Record<string, { read: string; held: string }> = {};
  const note = (ref: string, read: string) => {
    const held = (current.answers[ref] ?? current.values[ref]?.join(', ') ?? '').trim();
    if (held && !answersEquivalentAny(held, read)) out[ref] = { read, held };
  };
  for (const [ref, value] of Object.entries(suggested.answers)) note(ref, value);
  for (const [ref, values] of Object.entries(suggested.values)) note(ref, values.join(', '));
  return out;
}
