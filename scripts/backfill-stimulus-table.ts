// Move a question's GIVEN data table out of the stimulus prose and into
// `stimulus_table`, where it renders as an HTML table.
//
// Six questions set their grouped frequency table as a KaTeX array in the
// stimulus. They did it because the question's ONE visual slot was already
// holding the ogive — a figure the student draws, withheld from them by
// figureGivesAnswer — so the data behind it had nowhere structured to live.
// An array is typeset at a fixed width and cannot reflow: at 390px the table
// was 758px wide and the last class interval sat outside the paper.
//
// The transform is deterministic, and every repaired question is re-validated
// against the strict schema and the visual gate before it is saved, so a
// conversion that did not actually produce a good table cannot be written.
//
// Previews by default; --yes applies.
// Run: pnpm tsx scripts/backfill-stimulus-table.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { StructuredQuestionZ, McqQuestionZ } from '@/lib/validation/question';
import { verifyStimulusTable } from '@/lib/visuals/verify';
import { svgPlainLabel } from '@/lib/visuals/svg';

const ARRAY_BLOCK = /\\\[\s*\\begin\{array\}\{([^}]*)\}([\s\S]*?)\\end\{array\}\s*\\\]/;

/**
 * A cell as it will be PRINTED. svgPlainLabel is the renderer's own converter,
 * so storing its output means the stored text is what a reader sees; running it
 * again at render time is a no-op. The spacing pass is ours: the papers set
 * "0 < t ≤ 6" with spaces and the source writes 0<t\leq6 without them.
 */
function cellText(raw: string): string {
  return svgPlainLabel(raw.trim())
    .replace(/\s*([<>≤≥])\s*/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface TableParams {
  headers: string[];
  rows: string[][];
}

/**
 * The array, transposed to read DOWN the page.
 *
 * The papers print a grouped frequency table across the page — one column per
 * class — and four of the six copy that. Down the page is what fits a phone,
 * and it is what the bank's other 80 tables already do, so it is what we
 * store. A two-column array is already vertical and only needs splitting.
 */
function parseArray(spec: string, body: string): TableParams | null {
  const columns = spec.replace(/[^lcr]/g, '').length;
  const lines = body
    .split(/\\\\/)
    .map((line) => line.replace(/\\hline/g, '').trim())
    .filter((line) => line !== '');
  const grid = lines.map((line) => line.split('&').map(cellText));
  if (grid.length < 2 || columns < 2) return null;

  if (columns === 2) {
    const [headers, ...rows] = grid;
    return { headers, rows };
  }
  // Across the page: each LINE is a series whose first cell names it.
  const headers = grid.map((line) => line[0] ?? '');
  const rows: string[][] = [];
  for (let i = 1; i < columns; i++) {
    rows.push(grid.map((line) => line[i] ?? ''));
  }
  return { headers, rows };
}

/** The stimulus with the array removed and the blank lines it leaves tidied. */
function stripArray(stimulus: string): string {
  return stimulus
    .replace(ARRAY_BLOCK, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();

  const all = await Question.find({}).lean<Record<string, unknown>[]>();
  const targets = all.filter(
    (q) => typeof q.stimulus === 'string' && ARRAY_BLOCK.test(q.stimulus) && !q.stimulus_table,
  );
  console.log(`${targets.length} question(s) with a data table set as a KaTeX array\n`);

  let converted = 0;
  let skipped = 0;

  for (const q of targets) {
    const id = String(q._id);
    const stimulus = q.stimulus as string;
    const match = stimulus.match(ARRAY_BLOCK);
    const parsed = match ? parseArray(match[1], match[2]) : null;
    if (!parsed) {
      console.log(`  ✗ ${id.slice(-6)} — could not read the array; left alone`);
      skipped++;
      continue;
    }

    const nextStimulus = stripArray(stimulus);
    const candidate = {
      ...q,
      stimulus: nextStimulus,
      stimulus_table: { ...parsed, row_header_column: true },
    };

    // The same gate the generator answers to.
    const vres = verifyStimulusTable(candidate.stimulus_table, {
      stimulus: nextStimulus,
      stem: q.stem as string,
      partPrompts: ((q.parts as { prompt: string }[]) ?? []).map((p) => p.prompt),
    });
    if (!vres.ok) {
      console.log(`  ✗ ${id.slice(-6)} — table verify failed: ${vres.issues.join(' | ')}`);
      skipped++;
      continue;
    }

    const schema = q.kind === 'mcq' ? McqQuestionZ : StructuredQuestionZ;
    const check = schema.safeParse(candidate);
    if (!check.success) {
      console.log(
        `  ✗ ${id.slice(-6)} — schema rejected the result: ${check.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join(' | ')}`,
      );
      skipped++;
      continue;
    }

    console.log(`  ✓ ${id.slice(-6)} ${String(q.status)}`);
    console.log(`      headers: ${parsed.headers.join(' | ')}`);
    console.log(`      ${parsed.rows.length} row(s), first: ${parsed.rows[0]?.join(' | ')}`);

    if (apply) {
      await Question.updateOne(
        { _id: q._id },
        { $set: { stimulus: nextStimulus, stimulus_table: candidate.stimulus_table } },
      );
    }
    converted++;
  }

  console.log(
    `\n${converted} converted${skipped ? `, ${skipped} skipped` : ''}${
      apply ? ' — written' : ' — preview only, pass --yes to apply'
    }`,
  );
  process.exit(0);
}

void main();
