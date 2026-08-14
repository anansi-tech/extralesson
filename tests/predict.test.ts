import { describe, expect, it } from 'vitest';
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

describe('predictOverall — six-point scale from combined modules', () => {
  it('averages module totals and maps to I-VI bands', () => {
    const mods = [predictModule(1, 1), predictModule(2, 1), predictModule(3, 1)];
    const overall = predictOverall(mods);
    expect(overall.overall_percent).toBe(92);
    expect(overall.overall_grade).toBe('I');
  });

  it('mid mastery lands mid-scale', () => {
    const mods = [predictModule(1, 0.5), predictModule(2, 0.5), predictModule(3, 0.5)];
    expect(predictOverall(mods).overall_grade).toBe('III');
  });

  it('handles a subset of target modules (modular sitting)', () => {
    const overall = predictOverall([predictModule(1, 0.9)]);
    expect(overall.modules).toHaveLength(1);
    expect(overall.overall_percent).toBe(predictModule(1, 0.9).total_estimate);
  });

  it('empty input degrades to VI', () => {
    expect(predictOverall([]).overall_grade).toBe('VI');
  });
});
