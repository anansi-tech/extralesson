// DOES A TYPED ANSWER SURVIVE ORDINARY NAVIGATION?
//
// Written because it did not. Drafts were flushed on blur, visibilitychange
// and pagehide — every one of which means "the tab is going away" — and not one
// of them fires when a student moves INSIDE the app or presses browser back.
// So the save was reliable only when they left, which is the case a working
// student never hits, and typing was lost on the navigation they actually do.
//
// The check is the one that would have caught it: type, navigate away, come
// back, and look for the values. It asserts two moves, because they fail
// differently:
//   1. browser back and forward — the card UNMOUNTS and remounts
//   2. the in-app previous/next links — the card is RE-RENDERED, not
//      remounted (QuestionCard is rendered without a key), so the draft has to
//      be written under the index it was typed for rather than the one arriving
//
// It works as a THROWAWAY STUDENT of its own, created and deleted here. That is
// not squeamishness: attempts are append-only (ROUND_1 §3.5) and move 2 needs
// one to exist so the session has a question to look back at. Making it against
// a real student would mean deleting a real attempt.
//
// Needs the dev server running (pnpm dev) and Chrome on the machine.
// Run: pnpm tsx scripts/audit-drafts.ts
import 'dotenv/config';
import { chromium, type Page } from 'playwright-core';
import { dbConnect, Attempt, PracticeSession, Question, SessionDraft, Student } from '@/lib/db';
import { createSessionToken, getSecret } from '@/lib/auth/token';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const AUDIT_EMAIL = 'draft-audit@extralesson.invalid';
const TYPED = '41.7';
const WORKING = 'running total 12 x 4 = 48';
const TYPED_SECOND = '99.9';

const failures: string[] = [];
function expect(label: string, got: unknown, want: unknown) {
  const ok = got === want;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}: ${JSON.stringify(got)}`);
  if (!ok) failures.push(`${label} — expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
}

/** The answer box and the working, as the student would see them right now. */
async function shown(page: Page) {
  const box = page.locator('input[id^="slot-"]').first();
  await box.waitFor({ timeout: 15000 });
  const working = (await page.locator('textarea').count())
    ? await page.locator('textarea').first().inputValue()
    : '';
  return { answer: await box.inputValue(), working };
}

async function main() {
  await dbConnect();
  const questions = await Question.find({ status: 'approved', kind: 'structured' })
    .select('_id')
    .limit(2)
    .lean<{ _id: unknown }[]>();
  if (questions.length < 2) throw new Error('need two approved structured questions');

  await Student.deleteMany({ email: AUDIT_EMAIL }); // a previous crashed run
  const student = await Student.create({
    email: AUDIT_EMAIL,
    name: 'Draft audit',
    exam_sitting: 'may-june-2027',
    syllabus_mode: 'modular-2027',
    target_modules: [1, 2, 3],
  });
  const session = await PracticeSession.create({
    student_id: student._id,
    question_ids: questions.map((q) => q._id),
    mode: 'adaptive',
    started_at: new Date(),
  });
  const url = `${BASE}/study/session/${String(session._id)}`;

  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 } });
  ctx.setDefaultTimeout(20000);
  await ctx.addCookies([
    {
      name: 'el_session',
      value: createSessionToken(String(student._id), AUDIT_EMAIL, getSecret()),
      domain: new URL(BASE).hostname,
      path: '/',
    },
  ]);
  const page = await ctx.newPage();

  try {
    // 1. THE IN-APP BACK CONTROL, THEN BROWSER BACK.
    //
    // Everything after the first load is a CLIENT-SIDE navigation, which is
    // how a student moves and is exactly what the old flush events missed. It
    // types and leaves immediately, inside the 800ms debounce: waiting for the
    // debounce would let the autosave pass the test on its own and prove
    // nothing about the flush.
    console.log('\nthe in-app back control, then browser back');
    await page.goto(`${BASE}/study`, { waitUntil: 'networkidle' });
    const intoSession = page.locator('a[href*="/study/session/"]').first();
    if ((await intoSession.count()) === 0) throw new Error('no link into the open session on /study');
    await intoSession.click();
    await page.waitForURL('**/study/session/**');
    const box = page.locator('input[id^="slot-"]').first();
    await box.waitFor();
    await box.fill(TYPED);
    if (await page.locator('textarea').count()) {
      await page.locator('textarea').first().fill(WORKING);
    }
    await page.locator('a', { hasText: 'notebook' }).first().click();
    await page.waitForURL('**/study');
    await page.waitForTimeout(600);
    await page.goBack();
    await page.waitForTimeout(800);
    const returned = await shown(page);
    expect('the answer is still there', returned.answer, TYPED);
    if (WORKING) expect('the working is still there', returned.working, WORKING);

    // 2. THE IN-APP LINKS. An attempt on the first question is what makes the
    // second one current, so that "previous" has somewhere to go.
    console.log('\nin-app previous, then next');
    await Attempt.create({
      student_id: student._id,
      question_id: questions[0]._id,
      session_id: session._id,
      answer: 'audit',
      rubric_awarded: [],
      profile_marks: { CK: 0, AK: 0, R: 0 },
      correct: false,
      duration_ms: 1000,
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    const second = page.locator('input[id^="slot-"]').first();
    await second.waitFor();
    await second.fill(TYPED_SECOND);
    await page.locator('a', { hasText: 'previous' }).first().click();
    await page.waitForTimeout(800);
    await page.locator('a', { hasText: 'next' }).first().click();
    await page.waitForTimeout(800);
    expect('the answer survived the round trip', (await shown(page)).answer, TYPED_SECOND);

    // Under the question it was TYPED for, not the one being moved to.
    const rows = await SessionDraft.find({ session_id: session._id })
      .select('question_index answers')
      .lean<{ question_index: number; answers?: Record<string, string> }[]>();
    const wrote = rows.find((r) => Object.values(r.answers ?? {}).includes(TYPED_SECOND));
    expect('it was stored against the right question', wrote?.question_index, 1);
  } finally {
    await browser.close();
    await SessionDraft.deleteMany({ session_id: session._id });
    await Attempt.deleteMany({ student_id: student._id });
    await PracticeSession.deleteMany({ student_id: student._id });
    await Student.deleteOne({ _id: student._id });
  }

  if (failures.length === 0) {
    console.log('\n  PASS — typed answers survive navigating away and coming back.');
  } else {
    console.log(`\n  FAIL — ${failures.length} check(s):`);
    for (const f of failures) console.log(`    ${f}`);
  }
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
