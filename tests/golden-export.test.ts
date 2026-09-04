import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { importGoldenBundle, serialiseReview, serialiseSet } from '@/lib/golden/import';
import { loadGoldenSet } from '../scripts/golden-set';

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let buildGoldenBundle: typeof import('@/lib/golden/bundle').buildGoldenBundle;

const STUDENT = new mongoose.Types.ObjectId();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  ({ buildGoldenBundle } = await import('@/lib/golden/bundle'));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// The smoke-test dispute, rebuilt: a photographed page, one line rejected,
// the marker's verdicts on two rows, a dispute on one of them.
async function smokeDispute() {
  const { insertedId: questionId } = await db.Question.collection.insertOne({
    kind: 'structured', stem: 'Two parts.', marks: 3, status: 'approved', worked_solution: 'x = 5', misconceptions: [],
    parts: [
      { label: 'a', prompt: 'Solve 3x = 15.', marks: 2, slots: [{ label: 'i', answer: '5', response_mode: 'answer' }] },
      { label: 'b', prompt: 'Give a reason.', marks: 1, slots: [{ label: 'i', answer: 'because', response_mode: 'explain' }] },
    ],
    rubric: [
      { code: 'AK1', slot_ref: 'a.i', part_label: 'a', criterion: 'Divides both sides by 3', mark_value: 1, profile: 'AK' },
      { code: 'AK2', slot_ref: 'a.i', part_label: 'a', criterion: 'x = 5 CAO', mark_value: 1, profile: 'AK' },
      { code: 'R1', slot_ref: 'b.i', part_label: 'b', criterion: 'Gives a reason', mark_value: 1, profile: 'R' },
    ],
  });
  const session = await db.PracticeSession.create({ student_id: STUDENT, question_ids: [questionId], mode: 'adaptive', started_at: new Date() });
  const attempt = await db.Attempt.create({
    student_id: STUDENT, question_id: questionId, session_id: session._id, answer: '(a.i) 4', rubric_awarded: [],
    profile_marks: { CK: 0, AK: 0, R: 0 }, correct: false, duration_ms: 1,
  });
  const read = await db.Transcription.create({
    student_id: STUDENT, session_id: session._id, question_index: 0, attempt_id: attempt._id, question_id: questionId,
    lines: [
      { part_label: 'a', text: '3x = 15', confidence: 0.9 },
      { part_label: null, text: 'x = 4 (misread)', confidence: 0.5 },
      { part_label: 'b', text: 'because it is', confidence: 0.8 },
    ],
    legible: true, reader_model: 'test', marker_version: 'v3',
    method_marks: [
      { code: 'AK1', awarded: false, reason: 'we could not see the division', mark_value: 1, profile: 'AK' },
      { code: 'R1', awarded: true, reason: 'a reason is given', mark_value: 1, profile: 'R' },
    ],
  });
  await db.LineRejected.create({ transcription_id: read._id, line_index: 1 });
  await db.CapturedImage.create({ student_id: STUDENT, session_id: session._id, question_index: 0, attempt_id: attempt._id, take: 1, data: Buffer.from('jpegbytes'), content_type: 'image/jpeg' });
  const dispute = await db.MarkDispute.create({ student_id: STUDENT, attempt_id: attempt._id, transcription_id: read._id, code: 'AK1' });
  return { disputeId: String(dispute._id), readId: String(read._id), questionId: String(questionId) };
}

/** A golden directory in the real files' style, with one approved entry. */
function goldenDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'golden-'));
  writeFileSync(join(dir, 'set.json'), serialiseSet([{ id: 'aaaaaa', question_id: '6a0000000000000000aaaaaa', writer: 'w1', mode: 'typed', transcript: [{ part_label: 'a', text: '1 + 1' }] }]));
  writeFileSync(join(dir, 'review.json'), serialiseReview({ version: 1, status: 'approved', reviewer: 'David', reviewed_at: '2026-09-04T00:00:00Z', entries: [{ id: 'aaaaaa', case: 'one', student_answers: { 'a.i': '2' }, marks: [{ code: 'AK1', awarded: true, reason: 'yes' }] }] }));
  writeFileSync(join(dir, 'APPROVAL_LOG.md'), '# Golden-set grading approval log\n\n## Batch 1 — approved\n\n- `aaaaaa`: award AK1.\n');
  return dir;
}

describe('export as golden case', () => {
  it('is the golden shape: the read minus rejected lines, the typed answers, every row proposed, the disputed row flagged', async () => {
    const { disputeId, readId, questionId } = await smokeDispute();
    const b = await buildGoldenBundle(disputeId);
    expect(b).not.toBeNull();
    if (!b) return;
    expect(b.id).toBe(`f-${readId.slice(-6)}`);
    expect(b.set).toMatchObject({ id: b.id, question_id: questionId, writer: 'w-field', mode: 'photo', image: `field/${b.id}.jpg` });
    expect(b.set.transcript).toEqual([{ part_label: 'a', text: '3x = 15' }, { part_label: 'b', text: 'because it is' }]);
    expect(b.image?.content_type).toBe('image/jpeg');
    expect(Buffer.from(b.image!.base64, 'base64').toString()).toBe('jpegbytes');
    expect(b.review.student_answers).toEqual({ 'a.i': '4' });
    expect(b.review.proposed).toBe(true);
    expect(b.review.marks).toEqual([
      { code: 'AK1', awarded: false, reason: 'we could not see the division', proposed: true, disputed: true },
      { code: 'AK2', awarded: false, reason: 'Not earned by the typed answer, and not sent to the marker.', proposed: true },
      { code: 'R1', awarded: true, reason: 'a reason is given', proposed: true },
    ]);
    expect(JSON.stringify(b)).not.toMatch(/extralesson\.invalid|student_id/);
  });

  it('imports into the golden files in their own style, and the loader ignores it until approved', async () => {
    const { disputeId } = await smokeDispute();
    const b = (await buildGoldenBundle(disputeId))!;
    const dir = goldenDir();
    const before = loadGoldenSet(dir);
    expect(before.inputs.map((e) => e.id)).toEqual(['aaaaaa']);

    const result = importGoldenBundle(b, dir);
    expect(result.files).toEqual([`field/${b.id}.jpg`, 'set.json', 'review.json', 'APPROVAL_LOG.md']);
    expect(existsSync(join(dir, 'field', `${b.id}.jpg`))).toBe(true);
    // The page never leaves the machine that imported it.
    expect(readFileSync(join(process.cwd(), '.gitignore'), 'utf8')).toMatch(/^design\/golden\/field\/$/m);
    expect(readFileSync(join(process.cwd(), 'scripts', 'eval-marker.ts'), 'utf8')).toMatch(/field page\(s\) whose image is not on this machine, skipped here and marked below/);
    expect(readFileSync(join(dir, 'APPROVAL_LOG.md'), 'utf8')).toMatch(/## Field cases — proposed[\s\S]*every row proposed, AK1 disputed/);
    // One mark per line, as the real file keeps it.
    const review = readFileSync(join(dir, 'review.json'), 'utf8');
    expect(review).toMatch(/\n        \{ "code": "AK1", "awarded": false, "reason": "we could not see the division", "proposed": true, "disputed": true \},\n/);
    expect(review).toMatch(/"proposed": true\n    \}\n  \]/);

    const after = loadGoldenSet(dir);
    expect(after.inputs.map((e) => e.id)).toEqual(['aaaaaa']); // still ignored
    expect(after.verdicts.has(b.id)).toBe(false);

    // Approval is a person removing the flags; then it is in the set.
    const parsed = JSON.parse(review) as { entries: Record<string, unknown>[] };
    const entry = parsed.entries.find((e) => e.id === b.id)!;
    delete entry.proposed;
    for (const m of entry.marks as Record<string, unknown>[]) delete m.proposed;
    writeFileSync(join(dir, 'review.json'), serialiseReview(parsed as never));
    const approved = loadGoldenSet(dir);
    expect(approved.inputs.map((e) => e.id)).toEqual(['aaaaaa', b.id]);
    expect(approved.verdicts.get(b.id)).toHaveLength(3);

    expect(() => importGoldenBundle(b, dir)).toThrow(/already/);
  });

  it('reproduces the committed review.json byte for byte, so an import cannot reflow it', () => {
    const real = readFileSync(join(process.cwd(), 'design', 'golden', 'review.json'), 'utf8');
    expect(serialiseReview(JSON.parse(real))).toBe(real);
    const set = readFileSync(join(process.cwd(), 'design', 'golden', 'set.json'), 'utf8');
    expect(serialiseSet(JSON.parse(set))).toBe(set);
  });
});
