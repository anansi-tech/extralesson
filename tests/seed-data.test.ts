import { describe, expect, it } from 'vitest';
import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';
import { seedBlueprints } from '@/lib/seed/blueprints';
import { OBJECTIVE_ID_RE } from '@/lib/validation/question';

const allTopics = [...module1Topics, ...module2Topics, ...module3Topics];

describe('seed topics (syllabus transcription)', () => {
  it('has all 15 topics: 6 in M1, 5 in M2, 4 in M3', () => {
    expect(module1Topics).toHaveLength(6);
    expect(module2Topics).toHaveLength(5);
    expect(module3Topics).toHaveLength(4);
  });

  it('has unique topic codes and contiguous order within each module', () => {
    expect(new Set(allTopics.map((t) => t.code)).size).toBe(15);
    for (const mod of [module1Topics, module2Topics, module3Topics]) {
      expect(mod.map((t) => t.order)).toEqual(mod.map((_, i) => i + 1));
    }
  });

  it('has well-formed, unique objective ids that agree with topic module and position', () => {
    const seen = new Set<string>();
    for (const t of allTopics) {
      expect(t.objectives.length).toBeGreaterThan(0);
      for (const o of t.objectives) {
        expect(o.id).toMatch(OBJECTIVE_ID_RE);
        expect(o.id.startsWith(`M${t.module}.${t.order}.`)).toBe(true);
        expect(seen.has(o.id)).toBe(false);
        seen.add(o.id);
        expect(o.text.length).toBeGreaterThan(5);
      }
    }
  });
});

describe('seed blueprints (official allocations)', () => {
  const topicCodes = new Set(allTopics.map((t) => t.code));

  it('has 6 blueprints: P1 and P2 for each module', () => {
    expect(seedBlueprints).toHaveLength(6);
    for (const paper of ['P1', 'P2'] as const) {
      for (const mod of [1, 2, 3] as const) {
        expect(seedBlueprints.find((b) => b.paper === paper && b.module === mod)).toBeDefined();
      }
    }
  });

  it('P1 items sum to 20 per module and profile split 6/8/6', () => {
    for (const b of seedBlueprints.filter((b) => b.paper === 'P1')) {
      expect(b.allocations.reduce((s, a) => s + (a.items ?? 0), 0)).toBe(20);
      expect(b.profile_split).toEqual({ CK: 6, AK: 8, R: 6 });
    }
  });

  it('P2 marks sum to 30 per module and profile split 9/12/9', () => {
    for (const b of seedBlueprints.filter((b) => b.paper === 'P2')) {
      expect(b.allocations.reduce((s, a) => s + (a.marks ?? 0), 0)).toBe(30);
      expect(b.profile_split).toEqual({ CK: 9, AK: 12, R: 9 });
    }
  });

  it('references only real topic codes from the correct module', () => {
    for (const b of seedBlueprints) {
      for (const a of b.allocations) {
        for (const code of a.topic_codes) {
          expect(topicCodes.has(code)).toBe(true);
          expect(code.startsWith(`M${b.module}-`)).toBe(true);
        }
      }
    }
  });
});
