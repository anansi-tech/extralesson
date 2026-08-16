import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { PartLooseZ, StructuredLooseZ, McqLooseZ } from '@/lib/generation/draft-schema';
import { PartZ, StructuredQuestionZ, McqQuestionZ } from '@/lib/validation/question';

// A field the model never sees cannot be emitted, and the failure is silent:
// depends_on was added to the strict schema and not to the loose one, so a
// whole batch came back with every slot independent and a chain depth of 1 on
// questions that plainly chained. Nothing errored. The drafts looked correct.
//
// So the two schemas are compared here, field by field. A strict field must
// either exist in the loose schema the model generates against, or be listed
// below as derived — with the reason it is derived written down, because
// "intentionally missing" and "forgotten" are indistinguishable otherwise.

/**
 * Strict fields the model is deliberately NOT asked for, and why. Anything not
 * in this list must appear in the loose schema.
 */
const DERIVED: Record<string, string> = {
  // Set from the recipe, which is ours: letting the model choose would let it
  // answer a different question from the one the deficit search asked for.
  objective_ids: 'fixed by the recipe',
  module: 'fixed by the recipe',
  difficulty: 'fixed by the recipe',
  marks: 'fixed by the recipe',
  archetype: 'fixed by the recipe',
  representation: 'fixed by the recipe',
  kind: 'fixed by the recipe',
  shape: 'fixed by the recipe (R1.8 §2)',
  profile: 'fixed by the recipe for Paper 1 items (R1.7 §B5)',
  // Computed from the parts after validation, never authored.
  final_answer: 'derived by deriveFinalAnswer() from the slot answers',
  context_category: 'chosen by the setting ledger, not by the model',
  status: 'lifecycle, set by the pipeline',
  gen_meta: 'provenance, set by the pipeline',
  syllabus_mode: 'display-only, set by the caller',
};

/**
 * DERIVED entries that are NOT fields of a question document — they live on the
 * stored row or the request, so the strict question schema is not where they
 * would be declared.
 */
const NOT_ON_THE_QUESTION = new Set(['status', 'gen_meta', 'syllabus_mode']);

/** The element schema of an array field on an object schema. */
function elementOf(schema: z.ZodTypeAny, field: string): z.ZodTypeAny {
  const obj = unwrap(schema);
  if (!(obj instanceof z.ZodObject)) throw new Error('not an object schema');
  const arr = unwrap(obj.shape[field] as z.ZodTypeAny);
  const def = (arr as unknown as { _def: { type?: z.ZodTypeAny } })._def;
  if (!def.type) throw new Error(`${field} is not an array`);
  return def.type;
}

/** Peel preprocess/effects/default/optional wrappers off a schema. */
function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  let s = schema;
  for (let i = 0; i < 12 && !(s instanceof z.ZodObject) && !(s instanceof z.ZodArray); i++) {
    const def = (s as unknown as { _def: Record<string, unknown> })._def;
    const inner =
      (def?.schema as z.ZodTypeAny) ??
      (def?.innerType as z.ZodTypeAny) ??
      (Array.isArray(def?.options) ? (def.options as z.ZodTypeAny[])[0] : undefined);
    if (!inner) break;
    s = inner;
  }
  return s;
}

/** The keys of a Zod object, seeing through the wrappers we use on it. */
function keysOf(schema: z.ZodTypeAny): string[] {
  const s = unwrap(schema);
  return s instanceof z.ZodObject ? Object.keys(s.shape) : [];
}

describe('schema drift — the model can emit every field we validate', () => {
  it('exposes each strict QUESTION field to the generator, or records why not', () => {
    const strict = new Set([...keysOf(StructuredQuestionZ), ...keysOf(McqQuestionZ)]);
    const loose = new Set([...keysOf(StructuredLooseZ), ...keysOf(McqLooseZ)]);
    expect(strict.size).toBeGreaterThan(5); // the unwrapping actually worked

    const unexplained = [...strict].filter((f) => !loose.has(f) && !(f in DERIVED));
    expect(
      unexplained,
      `these strict fields are invisible to the model and undocumented: ${unexplained.join(', ')}. ` +
        'Add them to the loose schema, or list them in DERIVED with a reason.',
    ).toEqual([]);
  });

  it('exposes each strict PART and SLOT field too, which is where it went wrong', () => {
    const strictPart = new Set(keysOf(PartZ));
    const loosePart = new Set(keysOf(PartLooseZ));
    expect(strictPart.has('slots')).toBe(true);

    const unexplained = [...strictPart].filter((f) => !loosePart.has(f) && !(f in DERIVED));
    expect(
      unexplained,
      `part fields invisible to the model: ${unexplained.join(', ')}`,
    ).toEqual([]);

    // The slot is the level the bug actually hit.
    const strictSlot = new Set(keysOf(elementOf(PartZ, 'slots')));
    const looseSlot = new Set(keysOf(elementOf(PartLooseZ, 'slots')));
    expect(strictSlot.size).toBeGreaterThan(4);
    const slotGap = [...strictSlot].filter((f) => !looseSlot.has(f) && !(f in DERIVED));
    expect(slotGap, `slot fields invisible to the model: ${slotGap.join(', ')}`).toEqual([]);
  });

  it('carries the two fields whose absence would be silent, by name', () => {
    // Named explicitly as well as swept: depends_on failing silently produced
    // flat questions that looked entirely correct, and statement would fail the
    // same way — a cloze part with no gaps is just a part.
    const looseSlot = keysOf(elementOf(PartLooseZ, 'slots'));
    expect(looseSlot).toContain('depends_on');
    expect(keysOf(PartLooseZ)).toContain('statement');
  });

  // The mirror of the depends_on bug, and it bit within an hour of the first
  // test being written: Zod strips what it does not declare, so `shape` — set
  // by the pipeline from the recipe — was dropped during validation and every
  // paper-shaped question reached the database as a drill item. Nothing errored
  // there either. A field the pipeline sets must be DECLARED, or it is lost.
  it('declares every pipeline-set field, so validation cannot silently drop it', () => {
    const strict = new Set([...keysOf(StructuredQuestionZ), ...keysOf(McqQuestionZ)]);
    const pipelineSet = Object.keys(DERIVED).filter((f) => !NOT_ON_THE_QUESTION.has(f));
    const dropped = pipelineSet.filter((f) => !strict.has(f));
    expect(
      dropped,
      `these fields are set by the pipeline but not declared in the strict schema, ` +
        `so Zod strips them before they reach the database: ${dropped.join(', ')}`,
    ).toEqual([]);
  });

  it('DERIVED explains itself: every entry carries a non-empty reason', () => {
    for (const [field, reason] of Object.entries(DERIVED)) {
      expect(reason.length, `${field} has no reason`).toBeGreaterThan(8);
    }
  });
});
