// Content only. Preview by default; deploy the explanation display before --apply.
import 'dotenv/config';
import mongoose from 'mongoose';
import { dbConnect, Question } from '@/lib/db';
import { QuestionDraftZ } from '@/lib/validation/question';
import inventory from './explanation-prompts-2026-09-13.json';
import { isEntryPoint } from '../entry';

// Separate pre-existing exact-form/rubric defect; do not change marks here.
export const heldQuestion = '6a867895274ccc2bbe037e5d';
export const repairs = inventory.filter(q => q.id !== heldQuestion);
type StoredPart = (typeof inventory)[number]['expected']['parts'][number];
type Part = Omit<StoredPart, 'slots'> & { slots: (StoredPart['slots'][number] & { prompt?: string })[] };
type QuestionContent = { parts: Part[]; rubric: unknown; stem: string; stimulus?: string; visual?: unknown; status: string };

export function prepare(q: QuestionContent, repair: (typeof inventory)[number]) {
  if (q.status !== 'approved') throw new Error(`${repair.id}: no longer approved`);
  const selected = q.parts.filter(p => repair.expected.parts.some(e => e.label === p.label));
  const restored = structuredClone(selected);
  for (const change of repair.changes) {
    const [label, slotLabel] = change.ref.split('.');
    const slot = restored.find(p => p.label === label)?.slots.find(s => s.label === slotLabel);
    const before = (repair.expected.parts as Part[]).find(p => p.label === label)?.slots.find(s => s.label === slotLabel);
    if (!slot || !before || slot.response_mode !== 'explain') throw new Error(`${repair.id}: unexpected slot ${change.ref}`);
    if (slot.prompt !== before.prompt && slot.prompt !== change.prompt) throw new Error(`${repair.id}: prompt edited since review`);
    if (before.prompt === undefined) delete slot.prompt;
    else slot.prompt = before.prompt;
  }
  const actual = { stem: q.stem, stimulus: q.stimulus, visual: q.visual, parts: restored, rubric: q.rubric };
  if (JSON.stringify(actual) !== JSON.stringify(repair.expected)) throw new Error(`${repair.id}: content changed; re-review required`);
  const parts = structuredClone(q.parts);
  for (const { ref, prompt } of repair.changes) {
    const [label, slotLabel] = ref.split('.');
    parts.find(p => p.label === label)!.slots.find(s => s.label === slotLabel)!.prompt = prompt;
  }
  return { parts, changed: JSON.stringify(parts) !== JSON.stringify(q.parts) };
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (apply && !process.argv.includes('--display-deployed')) throw new Error('Deploy and verify the explanation display first; acknowledge with --display-deployed.');
  try {
    await dbConnect();
    const plans = [];
    for (const repair of repairs) {
      const q = await Question.findById(repair.id).lean<any>();
      if (!q) throw new Error(`${repair.id}: missing question`);
      const result = prepare(q, repair);
      QuestionDraftZ.parse({ ...q, parts: result.parts });
      plans.push({ q, repair, ...result });
    }
    for (const { q, repair, parts, changed } of plans) {
      console.log(JSON.stringify({ id: repair.id, changed, prompts: repair.changes }));
      if (!apply || !changed) continue;
      const result = await Question.updateOne({ _id: repair.id, status: 'approved', stem: q.stem,
        stimulus: q.stimulus, visual: q.visual, parts: q.parts, rubric: q.rubric }, { $set: { parts } });
      if (result.modifiedCount !== 1) throw new Error(`${repair.id}: concurrent edit; stopped. Earlier records may have applied; preview again before continuing.`);
    }
    console.log(`${apply ? 'Applied' : 'Preview only'}: ${plans.filter(p => p.changed).length} questions. Answers, response modes, marks and historical attempts unchanged.`);
  } finally { await mongoose.disconnect(); }
}
if (isEntryPoint(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
