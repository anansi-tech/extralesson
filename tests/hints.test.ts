import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RubricItemZ } from '@/lib/validation/question';

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
    const log = at('design', 'hints', 'APPROVAL_LOG.md');
    expect(log).toMatch(/## Batch 1 — /);
    expect((log.match(/^\| \d+ \|/gm) ?? []).length).toBe(rows.length);
  });
  it('only an approved hint reaches the bank', () => {
    expect(at('scripts', 'approve-hints.ts')).toMatch(/filter\(\(r\) => r\.status === 'approved'\)/);
  });
});
