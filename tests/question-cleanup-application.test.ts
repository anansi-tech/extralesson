import { describe, expect, it, vi } from 'vitest';
import { run, writePlan } from '@/scripts/review/repair-approved-question-cleanup';
import { batches, prepare, type Content } from '@/scripts/review/preview-question-cleanup';

const repairs = batches.held.slice(0, 2);
const read = async (id: string): Promise<Content | null> => repairs.find(r => r.id === id)?.expected ?? null;

describe('approved wording application safeguards', () => {
  it('previews without writes', async () => {
    const update = vi.fn();
    expect(await run({ read, update }, false, repairs)).toEqual({ reviewed: 2, changed: 2, applied: 0 });
    expect(update).not.toHaveBeenCalled();
  });
  it('validates every record before any write', async () => {
    const update = vi.fn();
    const staleRead = async (id: string) => id === repairs[1].id ? { ...repairs[1].expected, stem: 'Changed since review' } : read(id);
    await expect(run({ read: staleRead, update }, true, repairs)).rejects.toThrow('content changed');
    expect(update).not.toHaveBeenCalled();
  });
  it('guards present and absent authored fields and sets wording paths only', () => {
    for (const repair of [...batches.held, ...batches.missing]) {
      const plan = writePlan(repair.expected, repair);
      expect(plan.filter.parts).toEqual({ $eq: repair.expected.parts });
      expect(plan.filter.rubric).toEqual({ $eq: repair.expected.rubric });
      expect(plan.filter.status).toEqual({ $eq: 'approved' });
      const q = repair.expected as Record<string, unknown>;
      expect(plan.filter.stimulus_table).toEqual(q.stimulus_table === undefined ? { $exists: false } : { $eq: q.stimulus_table });
      expect(Object.keys(plan.update.$set)).toHaveLength(repair.prompts.length + Object.keys(repair.statements).length);
      expect(Object.keys(plan.update.$set).every(path => /^parts\.\d+\.(slots\.\d+\.prompt|statement)$/.test(path))).toBe(true);
    }
  });
  it('stops at a concurrent edit and reports prior writes', async () => {
    const update = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    await expect(run({ read, update }, true, [...repairs, batches.held[2]])).rejects.toThrow('question missing');
    expect(update).not.toHaveBeenCalled();
    await expect(run({ read, update }, true, repairs)).rejects.toThrow('stopped after 1 writes');
    expect(update).toHaveBeenCalledTimes(2);
  });
  it('skips already applied wording on repeat runs', async () => {
    const update = vi.fn();
    const appliedRead = async (id: string) => {
      const repair = repairs.find(r => r.id === id)!;
      return prepare(repair.expected, repair).next;
    };
    expect(await run({ read: appliedRead, update }, true, repairs)).toEqual({ reviewed: 2, changed: 0, applied: 0 });
    expect(update).not.toHaveBeenCalled();
  });
});
