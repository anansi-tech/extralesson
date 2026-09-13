import { isMultiValue, readInputShape, showsBoxCount } from './input-shape';
import { describeVisual, describeStimulusTable, type StoredVisual } from '@/lib/visuals';

export interface ReadPart {
  label: string;
  prompt?: string;
  statement?: string;
  slots: { label: string; prompt?: string; answer?: string; response_mode?: string }[];
}

export function readContext(question: { stimulus?: string; stem: string; parts?: ReadPart[]; visual?: StoredVisual; stimulus_table?: unknown }) {
  const context = { stimulus: question.stimulus, stem: question.stem, partPrompts: (question.parts ?? []).map((p) => p.prompt ?? '') };
  return {
    stimulus: question.stimulus, stem: question.stem, fields: readFields(question.parts ?? []),
    visual: [question.visual ? describeVisual(question.visual, context) : '', question.stimulus_table ? describeStimulusTable(question.stimulus_table, context) : ''].filter(Boolean).join('\n'),
  };
}

/** Only the form's public structure crosses this boundary, never its answers. */
export function readFields(parts: ReadPart[]) {
  return parts.flatMap((part) => part.slots.map((slot, index) => {
    const mode = slot.response_mode ?? 'answer';
    const shape = mode === 'answer' && slot.answer ? readInputShape(slot.answer) : null;
    const multi = shape && isMultiValue(shape.shape);
    return {
      ref: `${part.label}.${slot.label}`,
      instruction: part.prompt,
      slotInstruction: slot.prompt,
      statement: part.statement,
      blank: part.statement ? index + 1 : undefined,
      fillable: mode === 'answer',
      mode,
      shape: shape?.shape,
      boxes: multi ? (showsBoxCount(shape) ? shape.boxes : undefined) : 1,
      columns: multi ? shape.cols : undefined,
      pairs: multi ? shape.groups?.every((g) => g === 2) && shape.groupKind === '(' : undefined,
    };
  }));
}

/** Punctuation is presentation, but a positional label must never be guessed. */
export function normaliseSlotRef(ref: string): string {
  return ref.trim().replace(/\)\s*\(/g, '.').replace(/[()\s]/g, '').replace(/\.+$/, '');
}
