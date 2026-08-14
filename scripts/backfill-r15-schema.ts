// Same-commit backfill for the R1.5 schema (stimulus/parts/visual/archetype/
// representation, rubric part_label). Old records get schema-level defaults so
// they remain readable; pre-R1.5 drafts are then retired for regeneration
// under the new prompts (R1.5 §2 — bank is small, regenerate not migrate).
// Idempotent. Run: npx tsx scripts/backfill-r15-schema.ts
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';

async function main() {
  await dbConnect();
  const questions = await Question.find({});
  let backfilled = 0;
  let retired = 0;
  for (const q of questions) {
    let changed = false;
    if (!q.parts || q.parts.length === 0) {
      const answer =
        q.kind === 'mcq'
          ? (q.options?.[q.answer_key ?? 0] ?? '')
          : (q.final_answer ?? '');
      q.parts = [{ label: 'a', prompt: q.stem, marks: q.marks, answer }];
      changed = true;
    }
    if (q.rubric?.length) {
      for (const r of q.rubric) {
        if (!r.part_label) {
          r.part_label = 'a';
          changed = true;
        }
      }
    }
    // Mongoose defaults cover archetype/representation on read; persist them
    // so queries and matrices see concrete values.
    if (!q.get('archetype')) {
      q.set('archetype', 'multi-step-application');
      changed = true;
    }
    if (!q.get('representation')) {
      q.set('representation', 'prose');
      changed = true;
    }
    if (changed) backfilled++;
    // Pre-R1.5 drafts: regenerate rather than migrate.
    if (q.status === 'draft') {
      q.status = 'retired';
      q.reject_reason = 'superseded-r15';
      retired++;
    }
    // Branch-format visuals ({format, visual_type, ...}) cannot render under
    // the R1.5 template system ({template, params}); those questions are
    // retired for regeneration regardless of status. Prose questions stay.
    const visual = q.visual as unknown as Record<string, unknown> | undefined;
    if (q.status !== 'retired' && visual && 'format' in visual && !('template' in visual)) {
      q.status = 'retired';
      q.reject_reason = 'superseded-r15-visual';
      retired++;
    }
    if (changed || q.isModified()) await q.save();
  }
  console.log(`Backfilled ${backfilled}, retired ${retired} pre-R1.5 drafts of ${questions.length}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
