import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { batches, prepare } from '@/scripts/review/preview-question-cleanup';
import { QuestionDraftZ } from '@/lib/validation/question';
import { markStructuredParts } from '@/lib/grade/mark';
import { structuredPrefill } from '@/lib/grade/prefill';
import { reviewFlags } from '@/lib/admin/review-flags';
import { renderMathHtml } from '@/lib/katex';
import type { RubricItem } from '@/lib/types';
import QuestionCard from '@/app/study/session/[id]/question-card';
import { MARKED } from './helpers/marked-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));

const repairs = [...batches.held, ...batches.missing];
describe('question cleanup preparation', () => {
  it('covers the reviewed inventories and keeps 797be2 separate', () => {
    expect(batches.held).toHaveLength(21);
    expect(batches.missing).toHaveLength(45);
    expect(batches.held.flatMap(r => r.prompts)).toHaveLength(24);
    expect(batches.missing.flatMap(r => r.prompts)).toHaveLength(47);
    expect(new Set(repairs.map(r => r.id)).size).toBe(66);
    expect(repairs.some(r => r.id.endsWith('797be2'))).toBe(false);
    const flagpole = batches.held.find(r => r.id.endsWith('037e5d'))!;
    expect((flagpole.expected.rubric as RubricItem[]).find(r => r.code === 'AK4')?.for_format).toBe(true);
  });
  for (const repair of repairs) describe(repair.id.slice(-6), () => {
    const before = repair.expected;
    const { next } = prepare(before, repair);
    it('validates, changes only wording, preserves modes and refuses stale content', () => {
      const restored = structuredClone(next);
      for (const part of restored.parts) {
        const original = before.parts.find(p => p.label === part.label)!;
        if ('statement' in original) Object.assign(part, { statement: original.statement });
        for (const slot of part.slots) {
          const old = original.slots.find(s => s.label === slot.label)!;
          if ('prompt' in old) Object.assign(slot, { prompt: old.prompt });
          else delete (slot as { prompt?: string }).prompt;
        }
      }
      expect(restored).toEqual(before);
      const parsed = QuestionDraftZ.parse(next);
      if (parsed.kind !== 'structured') throw new Error('Expected structured question');
      expect(parsed.parts.flatMap(p => p.slots.map(s => s.response_mode))).toEqual(before.parts.flatMap(p => p.slots.map(s => s.response_mode)));
      expect(prepare(next, repair).changed).toBe(false);
      expect(() => prepare({ ...before, stem: 'Edited after review' }, repair)).toThrow('content changed');
      expect(() => prepare({ ...before, status: 'retired' }, repair)).toThrow('content changed');
      const altered = structuredClone(before);
      altered.rubric[0].mark_value++;
      expect(() => prepare(altered, repair)).toThrow('content changed');
      expect(reviewFlags({ module: next.module, stem: next.stem, parts: next.parts }).filter(f => /no instruction of its own|visible statement blank/.test(f.text))).toEqual([]);
    });
    it('preserves deterministic grading and prefill for correct, wrong and empty entries', () => {
      for (const choice of ['canonical', 'wrong', 'empty'] as const) {
        const entries = before.parts.flatMap(p => p.slots.map(s => ({ ref: `${p.label}.${s.label}`, answer: choice === 'canonical' ? s.answer : choice === 'wrong' ? '999999 wrong' : '' })));
        expect(markStructuredParts(next.rubric as RubricItem[], next.parts, entries)).toEqual(markStructuredParts(before.rubric as RubricItem[], before.parts, entries));
        const read = { legible: true, lines: entries.map(e => ({ text: e.answer })), answers: entries.map((e, i) => ({ slot_ref: e.ref, entries: [e.answer], source_lines: [i + 1] })) };
        expect(structuredPrefill(next.parts, read)).toEqual(structuredPrefill(before.parts, read));
      }
    });
    it('renders each new instruction with its original paper slot and no typed explanation input', () => {
      const html = renderToStaticMarkup(createElement(QuestionCard, { question: { ...MARKED.marked, prior: undefined,
        parts: next.parts.map(p => ({ label: p.label, marks: p.marks, promptHtml: renderMathHtml(p.prompt), promptText: p.prompt,
          statementHtml: 'statement' in p ? p.statement?.split('{}').map(renderMathHtml) : undefined, slots: p.slots.map(s => ({ ref: `${p.label}.${s.label}`, label: s.label, mode: s.response_mode,
            promptHtml: 'prompt' in s && s.prompt ? renderMathHtml(s.prompt) : undefined,
          })),
        })),
      } }));
      for (const { ref, prompt } of repair.prompts) {
        expect(html).toContain(renderMathHtml(prompt));
        expect(html).not.toContain(`id="slot-${ref}"`);
        expect(renderMathHtml(prompt)).not.toContain('katex-error');
      }
    });
  });
});
