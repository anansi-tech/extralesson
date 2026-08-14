import { describe, expect, it } from 'vitest';
import { topicCodeForObjective } from '@/lib/generation/topic-lookup';

describe('syllabus objective topic lookup', () => {
  it('uses current seeded topic codes across all modules', () => {
    expect(topicCodeForObjective('M1.1.1')).toBe('M1-NTC');
    expect(topicCodeForObjective('M1.6.3')).toBe('M1-GRAPHS');
    expect(topicCodeForObjective('M2.2.1')).toBe('M2-ALG2');
    expect(topicCodeForObjective('M2.5.5')).toBe('M2-VM1');
    expect(topicCodeForObjective('M3.1.9')).toBe('M3-STAT2');
    expect(topicCodeForObjective('M3.2.2')).toBe('M3-RFG2');
    expect(topicCodeForObjective('M3.3.5')).toBe('M3-GEO2');
    expect(topicCodeForObjective('M3.4.4')).toBe('M3-VM2');
  });

  it('rejects an objective outside the seeded syllabus', () => {
    expect(() => topicCodeForObjective('M3.5.1')).toThrow('No seeded topic mapping');
  });
});
