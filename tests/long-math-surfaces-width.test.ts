import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { chromium, type Browser } from 'playwright-core';
import { chromePage } from './helpers/chrome-page';
import { STATES } from './helpers/card-states';
import type { LongMathRow } from '@/lib/admin/long-math-fixture';
import type { CardQuestion } from '@/app/study/session/[id]/question-card';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh() {}, push() {}, replace() {} }),
  usePathname: () => '/study/session/s1',
  notFound: () => {
    throw new Error('not found');
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
// The page imports the KaTeX stylesheet for the browser; the harness carries its own copy.
vi.mock('katex/dist/katex.min.css', () => ({}));

// The same bank fixture (tests/fixtures/long-math.json) on the two surfaces
// that carry a student's marked work: the look-back, and the admin dispute
// case — built from the fixture's questions with a read and a withheld row,
// stacked on one page per surface, never wider than the viewport at 320 and
// 390. Every piece of math on both goes through lib/katex.ts.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
const rows: LongMathRow[] = JSON.parse(readFileSync(join(process.cwd(), 'tests', 'fixtures', 'long-math.json'), 'utf8'));
// A long line of working, as a student writes one: the read is shown as typed.
const LINE = 'AB = OB - OA = (8, 5) - (2, -1) = (6, 6) so |AB| = sqrt(36 + 36) = 8.49';

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let renderMathHtml: typeof import('@/lib/katex').renderMathHtml;
let renderAnswerHtml: typeof import('@/lib/katex').renderAnswerHtml;
let QuestionCard: typeof import('@/app/study/session/[id]/question-card').default;
let DisputeCasePage: typeof import('@/app/admin/disputes/[id]/page').default;
let browser: Browser;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  ({ renderMathHtml, renderAnswerHtml } = await import('@/lib/katex'));
  QuestionCard = (await import('@/app/study/session/[id]/question-card')).default;
  DisputeCasePage = (await import('@/app/admin/disputes/[id]/page')).default;
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 120000);
afterAll(async () => {
  await browser?.close();
  await mongoose.disconnect();
  await mongod.stop();
});

/** The look-back the session page builds, from a fixture question with one read and one withheld row. */
function lookBack(q: LongMathRow): CardQuestion {
  const parts = q.parts.length ? q.parts : [{ label: 'a', prompt: 'Show your working.', marks: 2, slots: [{ label: 'i', answer: '0' }] }];
  const rubric = q.rubric.length ? q.rubric : [{ code: 'R1', profile: 'R', mark_value: 1, part_label: 'a', slot_ref: 'a.i', criterion: 'States a conclusion' }];
  const answers = Object.fromEntries(parts.flatMap((p) => (p.slots ?? []).map((sl) => [`${p.label}.${sl.label}`, sl.answer])));
  const method = rubric.map((r, i) => ({ code: r.code, awarded: i % 2 === 0, reasonHtml: renderMathHtml(i % 2 === 0 ? r.criterion : `Withheld — ${r.criterion}`), mark_value: r.mark_value }));
  const lines = [{ text: LINE, part_label: parts[0].label, slot_label: null, confidence: 0.9 }, { text: LINE, part_label: null, slot_label: null, confidence: 0.6 }];
  return {
    ...STATES.unanswered,
    stemHtml: renderMathHtml(q.stem),
    stimulusHtml: q.stimulus ? renderMathHtml(q.stimulus) : undefined,
    visualHtml: undefined,
    figureMinWidth: undefined,
    figureMaxWidth: undefined,
    marks: parts.reduce((n, p) => n + p.marks, 0),
    parts: parts.map((p) => ({
      label: p.label,
      promptHtml: renderMathHtml(p.prompt),
      promptText: p.prompt,
      marks: p.marks,
      slots: (p.slots ?? []).map((sl) => ({ ref: `${p.label}.${sl.label}`, label: sl.label, mode: 'answer' as const, promptHtml: sl.prompt ? renderMathHtml(sl.prompt) : undefined, hints: [], symbols: [] })),
    })),
    rubricCodes: rubric.map((r) => ({ code: r.code, profile: r.profile as 'CK' | 'AK' | 'R', mark_value: r.mark_value, part_label: r.part_label ?? parts[0].label, slot_ref: r.slot_ref })),
    prior: {
      answers,
      working: [{ take: 1, of: 1, transcriptionId: 't1', disputed: [], rejected: [], lines: lines.map(({ slot_label: _s, ...l }) => l), legible: true, marked: true, method: method.map(({ mark_value: _m, ...m }) => m), slips: [] }],
      feedback: {
        correct: false,
        profile_marks: { CK: 0, AK: 0, R: 0 } as never,
        rubric_awarded: method.filter((m) => m.awarded).map((m) => m.code),
        partResults: Object.keys(answers).map((ref, i) => ({ label: ref, correct: i % 2 === 0, reasonHtml: q.remediations[0] ? renderMathHtml(q.remediations[0]) : undefined })),
        feedbackTitleHtml: 'Worked solution',
        feedbackHtml: renderMathHtml(q.worked_solution),
        isMisconception: false,
        attemptId: 'att1',
        earnableByMethod: 0,
        working: { transcription: { lines, answers: [], legible: true }, transcriptionId: 't1', rejected: [], take: 1, takesLeft: 1, method, marksAdded: 1, slips: [], marked: true },
      } as NonNullable<CardQuestion['prior']>['feedback'],
    },
  };
}

/** The case, as the admin page renders it from a seeded question, attempt, read and dispute. */
async function disputeCase(q: LongMathRow): Promise<string> {
  const student = new mongoose.Types.ObjectId();
  const session = new mongoose.Types.ObjectId();
  const parts = q.parts.length ? q.parts : [{ label: 'a', prompt: 'Show your working.', marks: 2, slots: [{ label: 'i', answer: '0', response_mode: 'answer' }] }];
  const rubric = q.rubric.length ? q.rubric : [{ code: 'R1', profile: 'R', mark_value: 1, part_label: 'a', slot_ref: 'a.i', criterion: 'States a conclusion' }];
  const { insertedId: question } = await db.Question.collection.insertOne({
    kind: 'structured', module: 1, difficulty: 1, objective_ids: ['M1.1.1'], status: 'approved', marks: parts.reduce((n, p) => n + p.marks, 0),
    stem: q.stem, stimulus: q.stimulus, parts, rubric, worked_solution: q.worked_solution, misconceptions: [],
  });
  const { insertedId: attempt } = await db.Attempt.collection.insertOne({
    student_id: student, question_id: question, session_id: session, question_index: 0, answer: renderAnswerHtml('1/3') ? '(a.i) 1/3' : '', rubric_awarded: [], correct: false, ts: new Date(),
  });
  const { insertedId: read } = await db.Transcription.collection.insertOne({
    student_id: student, attempt_id: attempt, question_id: question, session_id: session, question_index: 0, take: 1, legible: true, created_at: new Date(),
    lines: [{ text: LINE, part_label: parts[0].label, slot_label: null, confidence: 0.9 }],
    method_marks: rubric.map((r) => ({ code: r.code, awarded: false, reason: `Withheld — ${r.criterion}`, mark_value: r.mark_value })),
  });
  const { insertedId: dispute } = await db.MarkDispute.collection.insertOne({ student_id: student, attempt_id: attempt, transcription_id: read, code: rubric[0].code, ts: new Date() });
  const el = await DisputeCasePage({ params: Promise.resolve({ id: String(dispute) }), searchParams: Promise.resolve({}) });
  return renderToStaticMarkup(el as never);
}

describe.skipIf(!hasChrome)('the look-back and the dispute case never widen the page', () => {
  let lookBacks = '';
  let cases = '';
  beforeAll(async () => {
    lookBacks = rows.map((q) => `<section data-q="${q.id}">${renderToStaticMarkup(createElement(QuestionCard, { question: lookBack(q) }))}</section>`).join('');
    const built: string[] = [];
    for (const q of rows) built.push(`<section data-q="${q.id}">${await disputeCase(q)}</section>`);
    cases = built.join('');
  }, 300000);

  for (const width of [320, 390]) {
    for (const [name, html] of [['look-back', () => lookBacks], ['dispute case', () => cases]] as const) {
      it(`the ${name} for all ${rows.length} questions at ${width}px`, async () => {
        const p = await browser.newPage({ viewport: { width, height: 900 } });
        await p.setContent(chromePage(html()), { waitUntil: 'networkidle' });
        const r = await p.evaluate((width) => {
          const w = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
          const wide = [...document.querySelectorAll('section[data-q]')].filter((s) => s.scrollWidth > width).map((s) => s.getAttribute('data-q')!.slice(-6));
          return { w, wide };
        }, width);
        await p.close();
        expect(r.wide, `${name} ${width}px`).toEqual([]);
        expect(r.w, `${name} ${width}px`).toBe(width);
      }, 120000);
    }
  }
});
