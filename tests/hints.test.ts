import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RubricItemZ } from '@/lib/validation/question';
import { hintProblems, missingCommands, plainYour, repairTex } from '@/lib/generation/hint-tex';
import { hintLine } from '@/lib/grade/reason';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

// ROUND_7 Task 1: the hint, from the bank, approved by hand.
describe('hints', () => {
  it('is an optional field on the rubric row, in the schema and at the boundary', () => {
    expect(at('lib', 'db', 'question.ts')).toMatch(/hint: \{ type: String \}/);
    const row = { code: 'AK1', profile: 'AK', criterion: 'c', mark_value: 1, slot_ref: 'a.i', hint: 'Do the thing.' };
    expect(RubricItemZ.safeParse(row).success).toBe(true);
    expect(RubricItemZ.safeParse({ ...row, hint: '' }).success).toBe(false);
  });
  it('batch 1 is written as proposed, in bank order, with its table in the log', () => {
    const file = join(process.cwd(), 'design', 'hints', 'batch-1.json');
    expect(existsSync(file)).toBe(true);
    const rows = JSON.parse(readFileSync(file, 'utf8')) as { question_id: string; code: string; criterion: string; hint: string; status: string }[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(200);
    expect(rows.every((r) => ['proposed', 'approved', 'rejected'].includes(r.status))).toBe(true);
    expect(rows.every((r) => !/\b(mark|criterion|award|their)\b/i.test(r.hint))).toBe(true);
    expect(rows.every((r) => /[a-z]/i.test(r.hint))).toBe(true);
    // A hint that quotes TeX carries every command its criterion has.
    expect(rows.flatMap((r) => hintProblems(r.hint, r.criterion).map((p) => `${r.question_id.slice(-6)}/${r.code}: ${p}`))).toEqual([]);
    const log = at('design', 'hints', 'APPROVAL_LOG.md');
    expect(log).toMatch(/## Batch 1 — /);
    expect((log.match(/^\| \d+ \|/gm) ?? []).length).toBe(rows.length);
  });
  it('only an approved hint reaches the bank', () => {
    expect(at('scripts', 'approve-hints.ts')).toMatch(/filter\(\(r\) => r\.status === 'approved'\)/);
  });
});

describe('TeX through the generator', () => {
  it('restores a backslash the JSON lost, inside math only, and names what is still missing', () => {
    expect(repairTex('Write $overrightarrow{OA}$ as a column.', 'Writes $\\overrightarrow{OA}$')).toBe('Write $\\overrightarrow{OA}$ as a column.');
    expect(repairTex('Write overrightarrow{OA} as a column.', 'Writes $\\overrightarrow{OA}$')).toBe('Write overrightarrow{OA} as a column.');
    expect(missingCommands('Solve $3x-6 ge 20$ for $x$.', 'Solves $3x-6\\ge20$')).toEqual(['ge']);
    expect(missingCommands('Solve $3x-6\\ge20$ for $x$.', 'Solves $3x-6\\ge20$')).toEqual([]);
    // A hint that leaves the answer out has no reason to carry its TeX.
    expect(missingCommands('Solve for $x$ step by step.', 'Solves $3x-6\\ge20$ to obtain $x\\ge\\frac{26}{3}$')).toEqual([]);
    expect(missingCommands('Add the two vectors.', 'Forms $\\overrightarrow{OC}$')).toEqual([]);
  });
  it('the card falls back to the criterion until a row has a hint', () => {
    const rows = [{ slot_ref: 'a.i', criterion: 'Subtracts "their" total', hint: undefined as string | undefined }];
    expect(hintLine(rows, 'a.i')).toBe('Subtracts your total');
    rows[0].hint = 'Take your total away.';
    expect(hintLine(rows, 'a.i')).toBe('Take your total away.');
  });
});

describe('the four rules a hint must keep', () => {
  it('TeX inside dollars only, no \\( \\), no control characters, no quoted your', () => {
    expect(hintProblems('Find $\\overrightarrow{AB}$ first.', 'Forms $\\overrightarrow{AB}$')).toEqual([]);
    expect(hintProblems('Find \\overrightarrow{AB} first.', 'Forms $\\overrightarrow{AB}$')).toContain('bare TeX outside $…$: \\overrightarrow');
    expect(hintProblems('Find \\(f(3)\\) first.', 'Reads $f(3)$')).toEqual(expect.arrayContaining([expect.stringMatching(/instead of/)]));
    expect(hintProblems('Find $f(3) first.', 'Reads $f(3)$')).toContain('an unclosed $');
    expect(hintProblems('Find it\u0007 now.', 'Finds it')).toContain('contains a control character');
    expect(hintProblems('Use "your" value.', 'Uses "their" value')).toContain('quotes "your"');
    expect(hintProblems('Show it from their gradients.', 'Shows it')).toContain('uses a scheme word (mark, criterion, award, their)');
    expect(plainYour('Use “your” value and \'your\' total.')).toBe('Use your value and your total.');
  });
});
