// Human sign-off for the provisional golden-set grades.
//
// This deliberately prints the question's LIVE rubric beside the simulated
// answer and working. A copied criterion in a document would drift when a bank
// question changes; a reviewer must approve what the marker will actually see.
//
// Run: pnpm golden:review
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dbConnect, Question } from '@/lib/db';
import {
  GoldenReferenceZ,
  GoldenSetZ,
  methodCandidates,
  type GoldenQuestion,
} from '@/lib/grade/golden-set';

const DIR = join(process.cwd(), 'design', 'golden');
type ReviewQuestion = GoldenQuestion & { stimulus?: string; stem?: string };

async function main() {
  await dbConnect();
  const set = GoldenSetZ.parse(JSON.parse(readFileSync(join(DIR, 'set.json'), 'utf8')));
  const reference = GoldenReferenceZ.parse(JSON.parse(readFileSync(join(DIR, 'review.json'), 'utf8')));
  const byId = new Map(reference.entries.map((entry) => [entry.id, entry]));

  console.log(`GOLDEN-SET HUMAN REVIEW — ${reference.status.toUpperCase()}`);
  console.log('Review each proposed decision against the working and criterion.');
  console.log('A ✓ means proposed award; an × means proposed withhold.\n');

  let decisions = 0;
  let flagged = 0;
  for (const [index, entry] of set.entries()) {
    const proposed = byId.get(entry.id);
    const question = await Question.findById(entry.question_id).select('stimulus stem parts rubric').lean() as unknown as ReviewQuestion | null;
    if (!proposed || !question) throw new Error(`${entry.id}: missing reference entry or bank question`);
    const { deterministicallyAwarded, candidates } = methodCandidates(question, proposed.student_answers);
    const marks = new Map(proposed.marks.map((mark) => [mark.code, mark]));

    console.log(`${index + 1}. ${entry.id} — ${proposed.case}`);
    console.log(`   simulated typed answers: ${Object.entries(proposed.student_answers).map(([ref, answer]) => `${ref}=${answer || '[blank]'}`).join(' · ')}`);
    console.log('   working:');
    for (const line of entry.transcript) console.log(`      (${line.part_label ?? '?'}) ${line.text}`);
    console.log(`   deterministic rows already earned: ${deterministicallyAwarded.join(', ') || 'none'}`);
    console.log('   PHOTO-METHOD ROWS TO APPROVE:');
    for (const row of candidates) {
      const mark = marks.get(row.code);
      if (!mark) throw new Error(`${entry.id}: no proposed decision for ${row.code}`);
      decisions++;
      console.log(`      ${mark.awarded ? '✓' : '×'} ${row.code} ${row.profile} — ${row.criterion}`);
      console.log(`        proposal: ${mark.reason}`);
    }
    if (proposed.human_note) {
      flagged++;
      console.log(`   HUMAN CHECK: ${proposed.human_note}`);
    }
    console.log('   HUMAN DECISION: [ ] approve as written   [ ] change review.json\n');
  }

  console.log(`${decisions} decisions total; ${flagged} cases carry a specific human-check note.`);
  console.log('When every entry has been checked, set status to "approved", add reviewer, and add an ISO reviewed_at timestamp in design/golden/review.json.');
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
