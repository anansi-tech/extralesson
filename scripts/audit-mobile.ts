// WHAT THE APP ACTUALLY DOES ON A 360px PHONE.
//
// Written because "mobile-first, usable at 360px" was in CLAUDE.md and had
// never been measured. It was assumed, and the assumption was wrong: figures
// were drawn in 260px of a 360px screen with 4px axis labels, and every input
// was 38px against a 44px tap standard.
//
// This drives real Chrome at 360x740 and MEASURES. It asserts two things a
// change could silently regress:
//   1. no figure label smaller than MIN_LABEL_PX
//   2. no tap target shorter than TAP_MIN
//   3. no GIVEN TABLE wider than the frame it sits in — a table reflows, and
//      one that has to scroll instead hides the data the question is answered
//      from. This is what a stimulus table exists to guarantee, so it is the
//      thing worth asserting about it.
// Exits non-zero when either fails, so a new visual template cannot land below
// the legible floor without someone being told.
//
// Needs the dev server running (pnpm dev) and Chrome on the machine.
// Run: pnpm tsx scripts/audit-mobile.ts
import 'dotenv/config';
import { chromium } from 'playwright-core';
import { dbConnect, PracticeSession, Question, Student } from '@/lib/db';
import { createSessionToken, getSecret } from '@/lib/auth/token';
import { renderVisual } from '@/lib/visuals';
import { legibleMinWidth, MIN_LABEL_PX } from '@/lib/visuals/legibility';
import { readInputShape } from '@/lib/grade/input-shape';
import { inputAffordance } from '@/lib/grade/input-hints';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const W = 360;
const H = 740;
const TAP_MIN = 44; // Apple HIG; Material asks 48

/** Measured in the page, as a string because tsx injects helpers into functions. */
const PROBE = `(() => {
  var vw = document.documentElement.clientWidth;
  function rect(e) { var b = e.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height) }; }
  var targets = [];
  Array.prototype.forEach.call(document.querySelectorAll('input:not([type=hidden]), button, select, textarea'), function (e) {
    var r = rect(e);
    if (r.h > 0 && r.w > 0) targets.push({ tag: e.tagName.toLowerCase(), cls: String(e.className || '').slice(0, 24), w: r.w, h: r.h });
  });
  var figs = [];
  Array.prototype.forEach.call(document.querySelectorAll('.figure-frame svg'), function (sv) {
    var b = sv.getBoundingClientRect();
    var raw = sv.getAttribute('viewBox');
    var vb = raw ? raw.split(/[\\s,]+/).map(Number) : null;
    var scale = vb && vb[2] ? b.width / vb[2] : 1;
    var sizes = Array.prototype.slice.call(sv.querySelectorAll('text')).map(function (t) {
      return (parseFloat(t.getAttribute('font-size')) || 0) * scale;
    });
    var frame = sv.closest('.figure-frame');
    figs.push({ w: Math.round(b.width), vb: vb ? vb[2] : null, scale: Number(scale.toFixed(2)),
      labels: sizes.length, minLabel: sizes.length ? Number(Math.min.apply(null, sizes).toFixed(1)) : null,
      frameW: frame ? Math.round(frame.getBoundingClientRect().width) : null,
      scrollW: frame ? frame.scrollWidth : null });
  });
  var tables = [];
  Array.prototype.forEach.call(document.querySelectorAll('.figure-frame table'), function (tb) {
    var frame = tb.closest('.figure-frame');
    tables.push({
      w: Math.round(tb.getBoundingClientRect().width),
      cols: tb.querySelectorAll('thead th').length,
      rows: tb.querySelectorAll('tbody tr').length,
      frameW: frame ? Math.round(frame.getBoundingClientRect().width) : null,
      scrollW: frame ? frame.scrollWidth : null
    });
  });
  var inputs = Array.prototype.slice.call(document.querySelectorAll('input:not([type=hidden])'));
  var lastInput = inputs.length ? inputs[inputs.length - 1].getBoundingClientRect() : null;
  var figBox = document.querySelector('.figure-frame');
  var figR = figBox ? figBox.getBoundingClientRect() : null;
  return {
    overflow: document.documentElement.scrollWidth - vw,
    height: document.documentElement.scrollHeight,
    targets: targets, figures: figs, tables: tables,
    figureToLastInput: (figR && lastInput) ? Math.round(lastInput.bottom - figR.bottom) : null,
    hasRecall: !!document.querySelector('button')
  };
})()`;

interface Row {
  label: string;
  template: string;
  minLabel: number | null;
  frameW: number | null;
  scrollW: number | null;
  overflow: number;
  height: number;
  small: { tag: string; cls: string; w: number; h: number }[];
  reach: number | null;
  table: { cols: number; rows: number; frameW: number | null; scrollW: number | null } | null;
}

async function main() {
  await dbConnect();
  const student = await Student.findOne().lean<{ _id: unknown; email: string } | null>();
  if (!student) throw new Error('no student to sign in as');

  // One representative live question per visual template, plus the widest
  // question with no figure at all.
  const qs = await Question.find({ status: 'approved', kind: 'structured' })
    .select('visual stimulus_table stem stimulus parts marks')
    .lean<any[]>();
  const byTemplate = new Map<string, any>();
  for (const q of qs) {
    const t = q.visual?.template;
    if (!t) continue;
    let html = '';
    try {
      html = renderVisual(q.visual, { stimulus: q.stimulus, stem: q.stem, partPrompts: [] });
    } catch {
      continue;
    }
    const need = legibleMinWidth(html) ?? 0;
    // Keep the one that has to be widest — the hardest case for that template.
    if (!byTemplate.has(t) || need > (byTemplate.get(t).need ?? 0)) byTemplate.set(t, { q, need });
  }
  // THE WIDEST GIVEN TABLE. Most columns is the hardest case to reflow, and it
  // is the case that was broken: a seven-column frequency table set as typeset
  // maths ran 758px wide in a 300px column.
  const widestTable = qs
    .filter((q) => q.stimulus_table)
    .sort(
      (a, b) => (b.stimulus_table?.headers?.length ?? 0) - (a.stimulus_table?.headers?.length ?? 0),
    )[0];
  if (widestTable) byTemplate.set('__table__', { q: widestTable, need: 0 });

  // A long question with typed inputs, for tap targets and figure reachability.
  const longOne = qs
    .filter((q) => q.marks >= 12 && (q.parts ?? []).length >= 4 && q.visual)
    .sort((a, b) => (b.parts?.length ?? 0) - (a.parts?.length ?? 0))[0];
  if (longOne) byTemplate.set('__long__', { q: longOne, need: 0 });

  // THE WIDEST INPUT INSIDE PROSE.
  //
  // A cloze gap whose slot wants several boxes — a coordinate, a column vector,
  // a list — puts a multi-box input inline in a wrapping sentence, which is the
  // narrowest place any input has to fit. It was uncovered here until the gap
  // itself turned out to be broken, so the hardest case now has a row.
  const clozeWide = qs
    .flatMap((q) => (q.parts ?? []).map((p: any) => ({ q, p })))
    .filter(({ p }) => p.statement)
    .map(({ q, p }) => ({
      q,
      boxes: Math.max(
        0,
        ...p.slots
          .filter((sl: any) => (sl.response_mode ?? 'answer') === 'answer')
          .map((sl: any) => readInputShape(String(sl.answer)).boxes ?? 1),
      ),
    }))
    .sort((a, b) => b.boxes - a.boxes)[0];
  if (clozeWide && clozeWide.boxes > 1) byTemplate.set('__cloze__', { q: clozeWide.q, need: 0 });

  // Probe sessions, removed at the end. They hold no attempts, so nothing of
  // the student's is touched.
  const made: { id: string; label: string }[] = [];
  for (const [label, { q }] of byTemplate) {
    const s = await PracticeSession.create({
      student_id: student._id,
      question_ids: [q._id],
      mode: 'adaptive',
    });
    made.push({ id: String(s._id), label });
  }

  const cookie = createSessionToken(String(student._id), student.email, getSecret());
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3 });
  await ctx.addCookies([
    { name: 'el_session', value: cookie, domain: new URL(BASE).hostname, path: '/' },
  ]);
  const page = await ctx.newPage();

  const rows: Row[] = [];
  for (const { id, label } of made) {
    await page.goto(`${BASE}/study/session/${id}`, { waitUntil: 'networkidle' });
    const r = (await page.evaluate(PROBE)) as any;
    const fig = r.figures[0];
    rows.push({
      label,
      template: label,
      minLabel: fig?.minLabel ?? null,
      frameW: fig?.frameW ?? null,
      scrollW: fig?.scrollW ?? null,
      overflow: r.overflow,
      height: r.height,
      small: r.targets.filter((t: any) => t.h < TAP_MIN),
      reach: r.figureToLastInput,
      table: r.tables[0] ?? null,
    });
  }
  await PracticeSession.deleteMany({ _id: { $in: made.map((m) => m.id) } });
  await browser.close();

  console.log(`\nAT ${W}x${H}, REAL CHROME — floor ${MIN_LABEL_PX}px labels, ${TAP_MIN}px tap targets\n`);
  console.log('  page                 smallest label   figure    scrolls   page h   under-tap');
  console.log('  ' + '-'.repeat(82));
  let failLabel = 0;
  let failTap = 0;
  let failOverflow = 0;
  let failTable = 0;
  for (const r of rows.sort((a, b) => (a.minLabel ?? 99) - (b.minLabel ?? 99))) {
    const bad = r.minLabel !== null && r.minLabel < MIN_LABEL_PX;
    if (bad) failLabel++;
    if (r.small.length) failTap++;
    if (r.overflow > 1) failOverflow++;
    // A given table that has to scroll is hiding data the question is answered
    // from, which no amount of legible labelling makes acceptable.
    if (r.table && r.table.scrollW !== null && r.table.frameW !== null && r.table.scrollW > r.table.frameW + 1) {
      failTable++;
    }
    const scrolls = r.scrollW && r.frameW && r.scrollW > r.frameW + 1 ? `${r.scrollW}px` : 'no';
    console.log(
      `  ${(bad ? '! ' : '  ') + r.label.padEnd(19)}${String(r.minLabel ?? '-').padStart(9)}px   ` +
        `${String(r.frameW ?? '-').padStart(5)}px   ${scrolls.padStart(7)}   ` +
        `${String(r.height).padStart(5)}   ${r.small.length ? String(r.small.length) + ' !' : '0'}`,
    );
  }
  const reach = rows.find((r) => r.label === '__long__')?.reach;
  console.log(`\n  figure bottom to last input on the longest question: ${reach ?? '-'}px`);
  console.log(`  horizontal page overflow: ${failOverflow === 0 ? 'none' : failOverflow + ' page(s) !'}`);
  // The __table__ row specifically: every row with a table is CHECKED above,
  // but this line is about the given table, and the dataTable visual sorts
  // ahead of it.
  const table = rows.find((r) => r.label === '__table__')?.table;
  console.log(
    `  widest given table: ${
      table
        ? `${table.cols} columns, ${table.rows} rows in ${table.frameW}px — ` +
          `${table.scrollW !== null && table.frameW !== null && table.scrollW > table.frameW + 1 ? `SCROLLS at ${table.scrollW}px !` : 'reflows, no scroll'}`
        : '-'
    }`,
  );

  const failed = failLabel + failTap + failOverflow + failTable;
  if (failed === 0) {
    console.log(`\n  PASS — every label at or above ${MIN_LABEL_PX}px, every target at or above ${TAP_MIN}px.`);
  } else {
    console.log(
      `\n  FAIL — ${failLabel} page(s) below the label floor, ${failTap} with an undersized target, ` +
        `${failOverflow} overflowing, ${failTable} with a table that scrolls.`,
    );
  }
  process.exit(failed === 0 ? 0 : 1);
}

main();
