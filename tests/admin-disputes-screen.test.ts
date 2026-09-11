import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// ROUND_13 Task 5. Nothing here changes a mark, which is the fact the whole
// screen is shaped around: the marker asking for a look and a student
// disputing one are different things and must not read alike, and the state of
// a row is the one thing that decides whether you open it.
const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const LIST = at('app', 'admin', 'disputes', 'page.tsx');
const CASE = at('app', 'admin', 'disputes', '[id]', 'page.tsx');

describe('the disputes list', () => {
  it('puts the marker’s own questions first, in the card the page uses', () => {
    expect(LIST.indexOf('The marker asked for a look')).toBeLessThan(LIST.indexOf('newest first'));
    const asked = LIST.slice(LIST.indexOf('The marker asked for a look'), LIST.indexOf('{disputes.length === 0'));
    // The card, not the amber bar a failure takes: asking is not complaining.
    expect(asked).toContain('border-[1.5px] border-ink bg-white');
    expect(asked, 'no failure shape on a request for help').not.toMatch(/border-amber|bg-amber-tint/);
  });

  it('gives a row one state, and it is the only red on it', () => {
    const rows = LIST.slice(LIST.indexOf('{disputes.map('));
    expect(rows).toMatch(/uppercase tracking-widest text-red-pen">not yet reviewed/);
    expect(rows).toMatch(/uppercase tracking-widest text-green-pen">reviewed \{/);
    // The way into the case is not a state and does not compete with one.
    expect(rows, 'one red per row').not.toMatch(/QUIET\} text-red-pen/);
    expect([...rows.matchAll(/text-red-pen/g)], 'the state, and nothing else').toHaveLength(1);
  });

  it('shows the question, the row, the reason and the read on the row itself', () => {
    for (const part of ['The question', 'The row', 'The reason', 'renderMathHtml']) {
      expect(LIST, part).toContain(part);
    }
    expect(LIST).toContain('newest first');
  });
});

describe('the case page', () => {
  it('reads across at 1280: what was asked left, what was decided right', () => {
    expect(CASE).toMatch(/lg:grid lg:grid-cols-2 lg:items-start lg:gap-5/);
    const grid = CASE.slice(CASE.indexOf('lg:grid lg:grid-cols-2'));
    const question = grid.indexOf('The question');
    const criterion = grid.indexOf('The criterion');
    expect(question).toBeGreaterThan(-1);
    expect(criterion).toBeGreaterThan(question);
    // Both columns are inside the grid, and the grid closes before the panel:
    // the one thing to do belongs under the case, not beside half of it.
    const panel = grid.indexOf('What to do');
    expect(panel).toBeGreaterThan(criterion);
    expect(grid.slice(criterion, panel), 'the grid closes first').toContain('</div>');
  });

  it('red-bars the disputed part in the parts list, and only that part', () => {
    expect(CASE).toMatch(/p\.label === part \? 'border-l-3 border-red-pen pl-2' : 'pl-2'/);
  });

  it('holds one panel: reply, a note for the record, mark as reviewed', () => {
    const panel = CASE.slice(CASE.indexOf('What to do'));
    expect(panel).toContain('Reply by email');
    expect(panel).toMatch(/className=\{`\$\{PRIMARY\}/);
    expect(panel).toContain('Note for the record');
    expect(panel).toContain('Mark as reviewed');
    // Reply is the page's one commitment; marking reviewed is not a second.
    expect([...panel.matchAll(/\$\{PRIMARY\}/g)]).toHaveLength(1);
  });

  it('says that nothing here changes a mark', () => {
    expect(CASE).toContain('Nothing here changes a mark.');
    expect(LIST, 'and the list says it too').toContain('Nothing here changes a mark');
  });
});
