// Preview only by default. Apply AFTER deploying the word-blank safeguard:
// pnpm exec tsx scripts/done/repair-reviewed-cloze.ts --apply --code-deployed
import 'dotenv/config';
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { dbConnect, Question } from '@/lib/db';
import { QuestionDraftZ } from '@/lib/validation/question';
import inventory from './cloze-corrections-2026-09-13.json';
import { isEntryPoint } from '../entry';

// Existing quartile-format/rubric inconsistency fails today's full schema.
// Keep this question out rather than weakening validation or editing its marks.
export const heldQuestion = '6a852fcaed771942b6d0dd1a';
export const repairs = inventory.filter(q => q.id !== heldQuestion);
type Content = Pick<(typeof inventory)[number], 'parts' | 'rubric'> & {
  stem?: unknown; stimulus?: unknown; status?: string;
};

export function fingerprint(q: Content) {
  return createHash('sha256').update(JSON.stringify({
    stem: q.stem, stimulus: q.stimulus, parts: q.parts, rubric: q.rubric,
  })).digest('hex');
}

/** Only reviewed modes, plus one contextual alternative; no rubric changes. */
export function correctedParts(q: Pick<Content, 'parts'>, repair: (typeof inventory)[number]) {
  const parts = structuredClone(q.parts);
  for (const ref of repair.refs) {
    const [label, slotLabel] = ref.split('.');
    const slot = parts.find(p => p.label === label)?.slots.find(s => s.label === slotLabel);
    if (!slot || !['answer', 'explain'].includes(slot.response_mode)) throw new Error(`Unexpected slot ${ref}`);
    slot.response_mode = 'answer';
    if (repair.id === '6a852cc0ed771942b6d0dccb' && ref === 'c.decision') {
      slot.accept = [...new Set([...(slot.accept ?? []), 'will'])];
    }
  }
  return parts;
}

export function prepare(q: Content, repair: (typeof inventory)[number]) {
  if (q.status !== 'approved') throw new Error(`${repair.id}: no longer approved`);
  // Recognise exactly our already-applied patch, not arbitrary new content.
  const original = structuredClone(q);
  for (const ref of repair.refs) {
    const [label, slotLabel] = ref.split('.');
    const slot = original.parts.find(p => p.label === label)?.slots.find(s => s.label === slotLabel);
    const reviewed = repair.parts.find(p => p.label === label)?.slots.find(s => s.label === slotLabel);
    if (!slot || !reviewed) throw new Error(`${repair.id}: missing slot ${ref}`);
    slot.response_mode = reviewed.response_mode;
    if (repair.id === '6a852cc0ed771942b6d0dccb' && ref === 'c.decision') {
      if (reviewed.accept) slot.accept = reviewed.accept;
      else delete slot.accept;
    }
  }
  if (fingerprint(original) !== repair.fingerprint) throw new Error(`${repair.id}: content changed since review; re-review required`);
  const parts = correctedParts(original, repair);
  const isOriginal = fingerprint(q) === repair.fingerprint;
  const isPatched = JSON.stringify(q.parts) === JSON.stringify(parts);
  if (!isOriginal && !isPatched) throw new Error(`${repair.id}: partially changed since review; re-review required`);
  return { parts, changed: !isPatched };
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (apply && !process.argv.includes('--code-deployed')) throw new Error('Deploy and verify the word-blank safeguard first; then acknowledge with --code-deployed.');
  try {
    await dbConnect();
    // Validate the entire inventory before the first write.
    const plans = [];
    for (const repair of repairs) {
      const q = await Question.findById(repair.id).lean<any>();
      if (!q) throw new Error(`${repair.id}: not found`);
      const plan = prepare(q, repair);
      QuestionDraftZ.parse({ ...q, parts: plan.parts });
      plans.push({ repair, q, ...plan });
    }
    for (const { repair, q, parts, changed } of plans) {
      console.log(JSON.stringify({ id: repair.id, refs: repair.refs, changed,
        addAccept: repair.id.endsWith('d0dccb') ? { 'c.decision': 'will' } : undefined }));
      if (!apply || !changed) continue;
      const result = await Question.updateOne({ _id: repair.id, status: 'approved',
        parts: q.parts, rubric: q.rubric, stem: q.stem, stimulus: q.stimulus,
      }, { $set: { parts } });
      if (result.modifiedCount !== 1) throw new Error(`${repair.id}: concurrent edit; stopped. Earlier reported records may have been applied; rerun previews safely.`);
    }
    console.log(`${apply ? 'Applied' : 'Preview only'}: ${plans.filter(p => p.changed).length} questions. No attempts, photos or historical grades changed.`);
  } finally { await mongoose.disconnect(); }
}

if (isEntryPoint(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
