import 'dotenv/config';
import { chromium } from 'playwright-core';
import { dbConnect, PracticeSession, Question, SessionDraft, Student } from '@/lib/db';
import { createSessionToken, getSecret } from '@/lib/auth/token';
(async () => {
  await dbConnect();
  const all = await Question.find({}).select('_id').lean<any[]>();
  const q = all.find((x) => String(x._id).endsWith(process.argv[3]))!;
  await Student.deleteMany({ email: 'chk@extralesson.invalid' });
  const st = await Student.create({ email: 'chk@extralesson.invalid', name: 'chk', exam_sitting: 'may-june-2027', syllabus_mode: 'modular-2027', target_modules: [1,2,3] });
  const sess = await PracticeSession.create({ student_id: st._id, question_ids: [q._id], mode: 'adaptive', started_at: new Date() });
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  await ctx.addCookies([{ name: 'el_session', value: createSessionToken(String(st._id), 'chk@extralesson.invalid', getSecret()), domain: 'localhost', path: '/' }]);
  const p = await ctx.newPage();
  const REF = process.argv[4];
  const n = () => p.locator(`input[id^="slot-${REF}-"]`).count();
  try {
    await p.goto(`${process.argv[2]}/study/session/${sess._id}`, { waitUntil: 'networkidle' });
    console.log(`  "+ another box" buttons on the page: ${await p.locator('button', { hasText: 'another box' }).count()}`);
    console.log(`  on load                 boxes=${await n()}`);
    await p.locator(`[id="slot-${REF}-0"]`).click(); await p.waitForTimeout(300);
    console.log(`  click box 0             boxes=${await n()}`);
    await p.locator(`[id="slot-${REF}-0"]`).fill('2'); await p.waitForTimeout(300);
    console.log(`  type "2"                boxes=${await n()}`);
    await p.locator(`[id="slot-${REF}-1"]`).fill('4'); await p.waitForTimeout(300);
    console.log(`  type "4" in box 1       boxes=${await n()}`);
    await p.locator(`[id="slot-${REF}-1"]`).fill(''); await p.waitForTimeout(300);
    console.log(`  clear box 1             boxes=${await n()}`);
  } finally {
    await b.close();
    await SessionDraft.deleteMany({ session_id: sess._id });
    await PracticeSession.deleteMany({ student_id: st._id });
    await Student.deleteOne({ _id: st._id });
  }
  process.exit(0);
})();
