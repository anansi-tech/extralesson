import { describe, expect, it } from 'vitest';
import { MIN_MARKS_FOR_PREDICTION } from '@/lib/mastery/config';
import {
  predictModule,
  predictOverall,
  PROJECT_NEUTRAL_FRACTION,
} from '@/lib/grade/predict';

describe('predictModule — honest arithmetic', () => {
  it('splits mastery across P1 (30) and P2 (50) with neutral Paper 3 project (20)', () => {
    const p = predictModule(1, 0.5);
    expect(p.p1_estimate).toBe(15);
    expect(p.p2_estimate).toBe(25);
    expect(p.project_assumed).toBe(PROJECT_NEUTRAL_FRACTION * 20);
    expect(p.total_estimate).toBe(52);
  });

  it('full mastery earns A; zero mastery earns U (only the project assumption remains)', () => {
    expect(predictModule(2, 1).letter).toBe('A');
    expect(predictModule(2, 1).total_estimate).toBe(92);
    const zero = predictModule(2, 0);
    expect(zero.total_estimate).toBe(12);
    expect(zero.letter).toBe('U');
  });

  it('applies documented letter bands A>=75, B>=60, C>=45', () => {
    // total = mastery*80 + 12
    expect(predictModule(1, (75 - 12) / 80).letter).toBe('A');
    expect(predictModule(1, (60 - 12) / 80).letter).toBe('B');
    expect(predictModule(1, (45 - 12) / 80).letter).toBe('C');
    expect(predictModule(1, (44 - 12) / 80).letter).toBe('U');
  });

  it('clamps mastery to [0, 1]', () => {
    expect(predictModule(3, 1.4).total_estimate).toBe(92);
    expect(predictModule(3, -0.2).total_estimate).toBe(12);
  });
});

// Attempts behind an estimate. Named so each test says what evidence it assumes.
const ENOUGH = MIN_MARKS_FOR_PREDICTION;

describe('predictOverall — six-point scale from combined modules', () => {
  it('averages module totals and maps to I-VI bands', () => {
    const mods = [predictModule(1, 1), predictModule(2, 1), predictModule(3, 1)];
    const overall = predictOverall(mods, ENOUGH);
    expect(overall.overall_percent).toBe(92);
    expect(overall.overall_grade).toBe('I');
  });

  it('mid mastery lands mid-scale', () => {
    const mods = [predictModule(1, 0.5), predictModule(2, 0.5), predictModule(3, 0.5)];
    expect(predictOverall(mods, ENOUGH).overall_grade).toBe('III');
  });

  it('handles a subset of target modules (modular sitting)', () => {
    const overall = predictOverall([predictModule(1, 0.9)], ENOUGH);
    expect(overall.modules).toHaveLength(1);
    expect(overall.overall_percent).toBe(predictModule(1, 0.9).total_estimate);
  });

  it('states no grade at all for a student with no modules', () => {
    const overall = predictOverall([], ENOUGH);
    expect(overall.overall_grade).toBeNull();
    expect(overall.estimable).toBe(false);
  });
});

describe('predictModule — coverage honesty (R1.6 §4)', () => {
  it('defaults to full coverage so existing behaviour is unchanged', () => {
    expect(predictModule(1, 0.5).coverage).toBe(1);
    expect(predictModule(1, 0.5).total_estimate).toBe(52);
  });

  it('records the share of marks the estimate rests on', () => {
    const p = predictModule(2, 0.8, 0.93);
    expect(p.coverage).toBeCloseTo(0.93);
    // The estimate itself is still computed on what we measured — it is
    // reported with its basis rather than silently scaled.
    expect(p.total_estimate).toBe(predictModule(2, 0.8).total_estimate);
  });

  it('clamps coverage into 0..1', () => {
    expect(predictModule(1, 0.5, 1.4).coverage).toBe(1);
    expect(predictModule(1, 0.5, -0.2).coverage).toBe(0);
  });

  it('overall prediction reports the mean coverage of its modules', () => {
    const overall = predictOverall(
      [predictModule(1, 0.6, 0.9), predictModule(2, 0.6, 1.0)],
      ENOUGH,
    );
    expect(overall.coverage).toBeCloseTo(0.95);
  });
});

// A cold account has zero mastery, and the arithmetic on zero mastery is U/U/U
// with an overall VI. That reads as a verdict on the student when what it means
// is that we have never seen them work.
describe('predictOverall — no grade before there is evidence for one', () => {
  const mods = () => [predictModule(1, 0), predictModule(2, 0), predictModule(3, 0)];

  it('states no grade at all on a cold account', () => {
    const overall = predictOverall(mods(), 0);
    expect(overall.overall_grade).toBeNull();
    expect(overall.estimable).toBe(false);
    expect(overall.marks_attempted).toBe(0);
  });

  it('withholds the module letters too, not just the overall', () => {
    for (const m of predictOverall(mods(), 3).modules) expect(m.letter).toBeNull();
  });

  it('holds back right up to the threshold, then speaks', () => {
    expect(predictOverall(mods(), MIN_MARKS_FOR_PREDICTION - 1).overall_grade).toBeNull();
    const enough = predictOverall(mods(), MIN_MARKS_FOR_PREDICTION);
    expect(enough.estimable).toBe(true);
    expect(enough.overall_grade).toBe('VI'); // the project carry-over alone is 12%
    expect(enough.modules.every((m) => m.letter !== null)).toBe(true);
  });

  it('keeps computing the arithmetic while withholding the claim', () => {
    // Suppression is about what we SAY, not about losing the numbers: the
    // mastery map and the deltas still need them.
    const cold = predictOverall([predictModule(1, 0.8)], 2);
    expect(cold.overall_percent).toBe(predictModule(1, 0.8).total_estimate);
    expect(cold.modules[0].total_estimate).toBeGreaterThan(0);
    expect(cold.modules[0].letter).toBeNull();
  });

  // R1.8 §2 — the gate is marks of evidence, deliberately decoupled from
  // session size: a session is now one or two paper-shaped questions, and
  // "one completed session" would state a grade off a single question.
  it('asks for more evidence than any single question can carry', () => {
    expect(MIN_MARKS_FOR_PREDICTION).toBeGreaterThan(12);
  });
});

// ROUND_6 Task 5: the gate is PER MODULE. Thirty-five marks seen in Module 1
// say nothing about Module 3, so an overall grade waits for every module.
describe('predictOverall — enough in every module, not enough in total', () => {
  const mods = () => [predictModule(1, 0.6), predictModule(2, 0.6), predictModule(3, 0.6)];
  it('withholds the grade while any target module is short, and says how far each has got', () => {
    const p = predictOverall(mods(), { 1: MIN_MARKS_FOR_PREDICTION, 2: MIN_MARKS_FOR_PREDICTION, 3: 12 });
    expect(p.estimable).toBe(false);
    expect(p.overall_grade).toBeNull();
    expect(p.modules.map((m) => m.marks_seen)).toEqual([MIN_MARKS_FOR_PREDICTION, MIN_MARKS_FOR_PREDICTION, 12]);
    expect(p.marks_attempted).toBe(2 * MIN_MARKS_FOR_PREDICTION + 12);
  });
  it('speaks once every module has the minimum', () => {
    const p = predictOverall(mods(), { 1: MIN_MARKS_FOR_PREDICTION, 2: 40, 3: MIN_MARKS_FOR_PREDICTION });
    expect(p.estimable).toBe(true);
    expect(p.overall_grade).not.toBeNull();
  });
  it('a subset of target modules only needs those modules', () => {
    expect(predictOverall([predictModule(2, 0.6)], { 2: MIN_MARKS_FOR_PREDICTION }).estimable).toBe(true);
    expect(predictOverall([predictModule(2, 0.6)], { 1: 99 }).estimable).toBe(false);
  });
});
