import { McqQuestionZ, StructuredQuestionZ } from '@/lib/validation/question';

/**
 * WHAT THE REVIEW EDITOR PUTS IN THE BOX, DERIVED FROM THE SCHEMA THAT READS IT
 * BACK.
 *
 * It used to be a hand-written list in the page, and it had drifted by three
 * fields. `stimulus_table` was the visible one: a question whose data lives in
 * its table — the area of a segment, a row of readings — was submitted without
 * it, so the gate's solver was asked to find a radius from nothing and said so,
 * and every one of those questions was uneditable. `shape` was the quiet one,
 * because it carries a default: saving a paper-shaped question wrote 'drill'
 * over it without a word.
 *
 * A field added to the question schema and forgotten here is the same bug
 * again, so the list is taken from the schema rather than kept beside it.
 */
const objectKeys = (schema: unknown): string[] => {
  let node = schema as { _def?: { typeName?: string; schema?: unknown; innerType?: unknown }; shape?: object };
  for (let depth = 0; depth < 8; depth++) {
    if (node?._def?.typeName === 'ZodObject' && node.shape) return Object.keys(node.shape);
    const inner = node?._def?.schema ?? node?._def?.innerType;
    if (!inner) break;
    node = inner as typeof node;
  }
  throw new Error('edit-json: cannot read the question schema shape');
};

/** Every field either kind of question declares. */
export const EDITABLE_FIELDS: readonly string[] = [
  ...new Set([...objectKeys(McqQuestionZ), ...objectKeys(StructuredQuestionZ)]),
];

/**
 * The stored question as the editor shows it. Fields the row does not carry are
 * left out rather than written as null, so the JSON stays the question's own
 * shape and an optional field does not come back as an explicit nothing.
 */
export function editableDraft(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    const value = raw[field];
    // A visual row with no template is an empty husk, not a figure.
    if (field === 'visual' && !(value as { template?: string } | undefined)?.template) continue;
    if (value !== undefined && value !== null) out[field] = value;
  }
  return out;
}
