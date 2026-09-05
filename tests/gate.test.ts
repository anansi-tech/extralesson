import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promptHash } from '@/lib/grade/mark-method';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

// ROUND_6 Task 7: the gate is a gate.
describe('the evals exit by their bar', () => {
  it('fail on a missing golden set and exit nonzero below the bar', () => {
    for (const s of ['eval-marker.ts', 'eval-reads.ts', 'eval-pipeline.ts']) {
      const src = at('scripts', s);
      expect(src, s).toMatch(/The gate FAILS\.[\s\S]*process\.exit\(1\)/);
      expect(src, s).toMatch(/process\.exit\((passes|clean) \? 0 : 1\)/);
      expect(src, s).toMatch(/writeResults\(/);
    }
  });
  it('write results that name the models, the prompt, the rubric and the commit', () => {
    const src = at('scripts', 'eval-provenance.ts');
    for (const k of ['marker_model', 'reader_model', 'prompt_hash', 'rubric_version', 'commit']) expect(src).toContain(`${k}:`);
    expect(promptHash()).toMatch(/^[0-9a-f]{12}$/);
  });
  it('bars: CAO false 0, method false ≤ 1, median ≥ 88, worst ≥ 84; reads page loss 0 with cocoa-b1 an expected failure', () => {
    expect(at('scripts', 'eval-marker.ts')).toMatch(/const BAR = \{ median: 0\.88, worst: 0\.84, methodFalse: 1 \}/);
    expect(at('scripts', 'eval-marker.ts')).toMatch(/caoSp\.max === 0 && methodSp\.max <= BAR\.methodFalse && ag\.median >= BAR\.median && ag\.min >= BAR\.worst/);
    expect(at('scripts', 'eval-reads.ts')).toMatch(/UNEXPECTED PASS/);
    expect(JSON.parse(at('calibration', 'reads', 'cocoa-b1.json')).expected_fail).toBe(true);
  });
  it('count an omitted truth line against the reader', () => {
    const src = at('scripts', 'eval-marker.ts');
    expect(src).toMatch(/for \(const t of truth\) \{\s*w\.lines\+\+;\s*if \(gotKeys\.includes\(t\)\) w\.right\+\+;/);
    expect(src).not.toMatch(/for \(const g of got\) \{\s*const hit = truth\.includes\(g\.key\);\s*w\.lines\+\+/);
  });
  it('the composition eval runs the production read and mark, and cleans up after itself', () => {
    const src = at('scripts', 'eval-pipeline.ts');
    expect(src).toMatch(/import\('@\/app\/study\/session\/\[id\]\/capture'\)/);
    expect(src).toMatch(/markWorking\(String\(attempt\._id\)\)/);
    expect(src).toMatch(/Student\.deleteOne\(\{ _id: student\._id \}\)/);
    expect(at('lib', 'auth', 'session.ts')).toMatch(/RUN_AS_STUDENT && process\.env\.NODE_ENV !== 'production'/);
  });
});
