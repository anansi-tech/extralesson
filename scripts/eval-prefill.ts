// Paid, read-only replay: tsx scripts/eval-prefill.ts /private/cases.json [runs=2]
// Cases: [{ transcriptionId, expected: { "a.i": [["4", "2"]] } }].
// expected lists acceptable box-entry arrays, authored from the PHOTO, not the
// answer key. Missing photos fail explicitly; this never creates takes/drafts.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import mongoose from 'mongoose';
import { z } from 'zod';
import { dbConnect, Transcription, CapturedImage, Question } from '@/lib/db';
import { readContext } from '@/lib/grade/read-fields';
import { transcribeWorking } from '@/lib/grade/transcribe';
import { markableSlots } from '@/lib/grade/mark';
import { structuredPrefill } from '@/lib/grade/prefill';
import { isEntryPoint } from './entry';

const Cases = z.array(z.object({
  transcriptionId: z.string().regex(/^[a-f0-9]{24}$/),
  expected: z.record(z.array(z.array(z.string()).min(1)).min(1)),
})).min(1).max(10);

async function main() {
  const runs = z.coerce.number().int().min(1).max(3).parse(process.argv[3] ?? 2);
  const cases = Cases.parse(JSON.parse(readFileSync(process.argv[2], 'utf8')));
  let wrong = 0, missed = 0, matched = 0;
  try {
    await dbConnect();
    for (const test of cases) {
      const saved = await Transcription.findById(test.transcriptionId);
      if (!saved) throw new Error(`Missing read ${test.transcriptionId}`);
      const question = await Question.findById(saved.question_id).lean<(Parameters<typeof readContext>[0] & { _id: unknown }) | null>();
      const photo = await CapturedImage.findOne({ student_id: saved.student_id, session_id: saved.session_id, question_index: saved.question_index, take: saved.take });
      if (!question || !photo) throw new Error(`Missing question/photo for ${test.transcriptionId}`);
      for (let run = 1; run <= runs; run++) {
        const { transcription } = await transcribeWorking({
          image: new Uint8Array(photo.data), contentType: photo.content_type,
          slotRefs: markableSlots(question.parts ?? []), context: readContext(question),
        });
        const fill = structuredPrefill(question.parts ?? [], transcription);
        const actual = { ...Object.fromEntries(Object.entries(fill.answers).map(([ref, value]) => [ref, [value]])), ...fill.values };
        const wrongRefs: string[] = [], missedRefs: string[] = [];
        const normalise = (values: string[]) => JSON.stringify(values.map((v) => v.replace(/\s/g, '')));
        for (const [ref, values] of Object.entries(actual)) {
          if (test.expected[ref]?.some((expected) => normalise(expected) === normalise(values))) matched++;
          else { wrong++; wrongRefs.push(ref); }
        }
        for (const ref of Object.keys(test.expected)) if (!(ref in actual)) { missed++; missedRefs.push(ref); }
        console.log(JSON.stringify({ question: String(question._id), run, actual, wrongRefs, missedRefs, suggestions: transcription.answers, notes: transcription.notes }));
      }
    }
    console.log(JSON.stringify({ cases: cases.length, runs, matched, wrong, missed }));
    if (wrong || missed) process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (isEntryPoint(import.meta.url)) main().catch((e) => { console.error(e.message); process.exitCode = 1; });
