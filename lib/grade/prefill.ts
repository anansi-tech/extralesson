import { isMultiValue, readInputShape } from './input-shape';

/**
 * What a read may put in the boxes: single-box slots only (ROUND_4 Task 1).
 * A multi-value slot is typed one box per value and stays the student's to
 * fill — splitting a read line into boxes would be guessing the delimiter.
 */
export function prefillFromRead(
  parts: { label: string; slots: { label: string; answer?: string; response_mode?: string }[] }[],
  answers: { slot_label: string; text: string }[],
): Record<string, string> {
  const single = new Set(
    parts.flatMap((p) =>
      p.slots
        .filter((s) => (s.response_mode ?? 'answer') === 'answer')
        .filter((s) => !s.answer || !isMultiValue(readInputShape(s.answer).shape))
        .map((s) => `${p.label}.${s.label}`),
    ),
  );
  const out: Record<string, string> = {};
  for (const a of answers) {
    const text = a.text.trim();
    if (single.has(a.slot_label) && text) out[a.slot_label] = text;
  }
  return out;
}
