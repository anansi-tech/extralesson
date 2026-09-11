import { isMultiValue, readInputShape } from './input-shape';

export interface Prefill {
  /** Single-box slots: one value, one box, as before. */
  answers: Record<string, string>;
  /** Multi-box slots the read split into exactly the boxes the slot has. */
  values: Record<string, string[]>;
}

/**
 * What a read may put in the boxes (ROUND_4 Task 1).
 *
 * A multi-value slot used to be left alone entirely, because splitting a read
 * line into boxes would have meant guessing the delimiter. It does not: the
 * marker already splits the slot's own answer with readInputShape, and the same
 * reader run over the READ gives the same values in the same order. So a
 * column vector or a coordinate fills.
 *
 * The count is the check, and it is exact. If the read yields three values for
 * a two-box slot, that slot fills with NOTHING — a wrong split silently in the
 * boxes is worse than no split at all, because the student is checking values
 * and not their number. Partial fills are not offered for the same reason.
 *
 * The student still checks every box before handing in; this only saves typing.
 */
export function prefillFromRead(
  parts: { label: string; slots: { label: string; answer?: string; response_mode?: string }[] }[],
  answers: { slot_ref: string; text: string }[],
): Prefill {
  const shapeOf = new Map<string, ReturnType<typeof readInputShape> | null>();
  for (const p of parts) {
    for (const s of p.slots) {
      if ((s.response_mode ?? 'answer') !== 'answer') continue;
      shapeOf.set(`${p.label}.${s.label}`, s.answer ? readInputShape(s.answer) : null);
    }
  }

  const out: Prefill = { answers: {}, values: {} };
  for (const a of answers) {
    if (!shapeOf.has(a.slot_ref)) continue;
    const text = a.text.trim();
    if (!text) continue;
    const slot = shapeOf.get(a.slot_ref)!;

    if (!slot || !isMultiValue(slot.shape)) {
      out.answers[a.slot_ref] = text;
      continue;
    }
    // The same reader the marker uses, run over what the page said.
    const read = readInputShape(text);
    if (read.values.length === slot.boxes && read.values.every((v) => v.trim())) {
      out.values[a.slot_ref] = read.values.map((v) => v.trim());
    }
  }
  return out;
}
