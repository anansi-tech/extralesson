import { describe, expect, it } from 'vitest';
import { familiesFor, MISCONCEPTION_FAMILIES, misconceptionGuidance } from '@/lib/misconceptions';
import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';

// R1.7 Part D — examiner-documented errors, not invented ones.
const topics = [...module1Topics, ...module2Topics, ...module3Topics];
const objectiveIds = new Set(topics.flatMap((t) => t.objectives.map((o) => o.id)));

describe('misconception library', () => {
  it('points every family at objectives that exist', () => {
    for (const f of MISCONCEPTION_FAMILIES) {
      for (const prefix of f.objectivePrefixes) {
        const matches = [...objectiveIds].some((id) => id.startsWith(prefix));
        expect(matches, `${f.name} -> ${prefix}`).toBe(true);
      }
    }
  });

  it('gives every family an error and a fix a student could act on', () => {
    for (const f of MISCONCEPTION_FAMILIES) {
      expect(f.error.length, f.name).toBeGreaterThan(30);
      expect(f.fix.length, f.name).toBeGreaterThan(30);
      expect(f.name.length).toBeLessThan(60);
    }
  });

  it('selects by objective, so a question is offered errors from its own topic', () => {
    const consumer = familiesFor(['M1.2.4']).map((f) => f.name);
    expect(consumer).toContain('Simple interest used for compound interest');
    expect(consumer).not.toContain('Range given as an interval');

    const stats = familiesFor(['M2.1.10']).map((f) => f.name);
    expect(stats).toContain('Modal frequency given instead of the modal value');
    expect(stats).not.toContain('Amount given instead of interest');
  });

  it('covers the topics the report singles out', () => {
    for (const id of ['M1.2.1', 'M2.3.1', 'M2.1.1', 'M2.4.5', 'M3.1.1']) {
      expect(familiesFor([id]).length, id).toBeGreaterThan(0);
    }
  });

  it('says nothing when no family fits, rather than padding the prompt', () => {
    expect(misconceptionGuidance(['M9.9.9'])).toBe('');
  });

  it('presents them as documented, not as a menu to copy', () => {
    const g = misconceptionGuidance(['M1.2.4']);
    expect(g).toContain('examiners report these region-wide');
    expect(g).toContain('when one fits the question you have written');
  });
});
