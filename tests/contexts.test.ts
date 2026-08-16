import { describe, expect, it } from 'vitest';
import {
  CONTEXT_CATEGORIES,
  CONTEXT_FREE_MCQ_SHARE,
  CONTEXT_MEMORY,
  contextGuidance,
  recentContexts,
} from '@/lib/generation/contexts';

// R1.8 Part 0 — a bank of 123 approved questions read as repetitive because
// the settings repeated: retail 36 times, and nine questions opening "The
// coordinate grid shows…". A question now declares where it is set.
describe('the context ledger', () => {
  const recent = [
    { context_category: 'retail' },
    { context_category: 'school' },
    { context_category: 'retail' },
    { context_category: 'none' },
    { context_category: 'transport' },
  ];

  it('reports what a topic has just used, most recent first, without repeats', () => {
    expect(recentContexts(recent)).toEqual(['retail', 'school', 'transport']);
  });

  it('does not count context-free items as a used setting', () => {
    expect(recentContexts([{ context_category: 'none' }])).toEqual([]);
  });

  it('remembers only the recent past, so a topic never runs out of settings', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ context_category: CONTEXT_CATEGORIES[(i % 8) + 1] }));
    expect(recentContexts(many).length).toBeLessThanOrEqual(CONTEXT_MEMORY);
  });

  it('names what to avoid, and refuses the openers the founder saw repeated', () => {
    const g = contextGuidance(recent, false);
    expect(g).toContain('retail, school, transport');
    expect(g).toContain('choose something else');
    expect(g).toContain('The coordinate grid shows');
    expect(g).toContain('At a school fair');
  });

  it('asks for bare mathematics when the item should carry no setting', () => {
    const g = contextGuidance(recent, true);
    expect(g).toContain('bare mathematics');
    expect(g).toContain('"none"');
    expect(g).not.toContain('choose something else');
  });

  it('says nothing to avoid when a topic is fresh', () => {
    expect(contextGuidance([], false)).not.toContain('choose something else');
  });

  it('aims at half of Paper 1 being context-free', () => {
    expect(CONTEXT_FREE_MCQ_SHARE).toBe(0.5);
  });
});

describe('buildDraftPrompt — Part 0 item shapes and distractors', () => {
  it('demands near-miss forms among MCQ distractors', async () => {
    const { buildDraftPrompt } = await import('@/lib/prompts/question-gen');
    const p = buildDraftPrompt({
      topicTitle: 'Algebra',
      objectives: [{ id: 'M1.5.1', text: 'Use the laws of indices.' }],
      recipe: { objective_ids: ['M1.5.1'], kind: 'mcq', difficulty: 2, marks: 1, archetype: 'direct-procedure', representation: 'prose', profile: 'AK' },
      context: { topic_code: 'M1-ALG1', template_hints: [] },
      module: 1,
      visualContract: '',
      contextFree: true,
    });
    expect(p).toContain('DISTRACTOR FAMILIES');
    expect(p).toContain('near-miss FORMS');
    expect(p).toContain('DEFINED OPERATION');
    expect(p).toContain('HIRE-PURCHASE');
    expect(p).toContain('bare mathematics');
  });
});
