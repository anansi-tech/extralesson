// Approved wording-only correction. Preview by default; --apply writes one prompt.
import 'dotenv/config';
import mongoose from 'mongoose';
import { isDeepStrictEqual } from 'node:util';
import { dbConnect, Question } from '@/lib/db';
import { QuestionDraftZ } from '@/lib/validation/question';
import { authoredFields, batches, prepare as prepareWording } from './preview-question-cleanup';
import { isEntryPoint } from '../entry';

export const id = '6a853d31e7fc40f429797ba6';
export const prompt = 'Number of accepted inspection pairs';
const reviewed = batches.missing.find(r => r.id === id)!;
export const before = prepareWording(reviewed.expected, reviewed).next;

export function prepare(q: typeof before) {
  const next = structuredClone(before);
  Object.assign(next.parts.find(p => p.label === 'd')!.slots.find(s => s.label === 'i')!, { prompt });
  if (!isDeepStrictEqual(q, before) && !isDeepStrictEqual(q, next)) throw new Error('797ba6 changed since review; re-review required.');
  QuestionDraftZ.parse(next);
  return { next, changed: !isDeepStrictEqual(q, next) };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--apply')) throw new Error('Only --apply is supported; default is preview.');
  try {
    await dbConnect();
    const q = await Question.findById(id).select(`${authoredFields} -_id`).lean<typeof before>();
    if (!q) throw new Error('797ba6 missing');
    const { changed } = prepare(q);
    console.log(JSON.stringify({ id, ref: 'd.i', prompt, changed, mode: args.includes('--apply') ? 'apply' : 'preview' }));
    if (!changed || !args.includes('--apply')) return;
    const filter = { _id: new mongoose.Types.ObjectId(id) } as { _id: mongoose.Types.ObjectId } & Record<string, unknown>;
    for (const field of authoredFields.split(' ')) {
      const value = (q as Record<string, unknown>)[field];
      filter[field] = value === undefined ? { $exists: false } : { $eq: value };
    }
    const p = q.parts.findIndex(p => p.label === 'd');
    const s = q.parts[p].slots.findIndex(s => s.label === 'i');
    // Native collection preserves the stored BSON subdocument ordering in the
    // exact-match filter; Mongoose recasts parts and can make that filter miss.
    const result = await Question.collection.updateOne(filter, {
      $set: { [`parts.${p}.slots.${s}.prompt`]: prompt },
      $currentDate: { updated_at: true },
    });
    if (result.modifiedCount !== 1) throw new Error('Concurrent edit; correction not applied.');
    console.log('Applied one prompt. Answers, rubric and historical attempts unchanged.');
  } finally { await mongoose.disconnect(); }
}
if (isEntryPoint(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
