import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { markStructuredParts } from '@/lib/grade/mark';
import { schemeLine } from '@/lib/grade/reason';
import type { RubricItem } from '@/lib/types';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const CARD = at('app', 'study', 'session', '[id]', 'question-card.tsx');
const ACTIONS = at('app', 'study', 'session', '[id]', 'actions.ts');

// ROUND_4 post-smoke fixes, each pinned where the smoke test found it.
const rubric: RubricItem[] = [
  { code: 'CK1', slot_ref: 'b.i', part_label: 'b', profile: 'CK', mark_value: 1, criterion: 'Recognises that suitable beans equal the total harvest less rejected beans' },
  { code: 'AK1', slot_ref: 'b.i', part_label: 'b', profile: 'AK', mark_value: 1, criterion: 'Subtracts "their" rejected-bean total from 1 200 000' },
  { code: 'R1', slot_ref: 'b.ii', part_label: 'b', profile: 'R', mark_value: 1, criterion: 'CAO $88\\%$' },
  { code: 'R2', slot_ref: 'c.ii', part_label: 'c', profile: 'R', mark_value: 1, criterion: 'Expresses "their" answer in standard form', for_format: true },
] as RubricItem[];

describe('(d) a wrong answer is told the scheme’s line for the slot', () => {
  it('is the first method row, never CAO and never the form row', () => {
    expect(schemeLine(rubric, 'b.i')).toMatch(/suitable beans equal the total harvest less rejected/);
    expect(schemeLine(rubric, 'b.ii')).toBeUndefined();
    expect(schemeLine(rubric, 'c.ii')).toBeUndefined();
  });

  it('reaches the card as rendered HTML, so TeX in a criterion is set, not shown raw', () => {
    expect(ACTIONS).toMatch(/reasonHtml: line \? renderMathHtml\(line\)/);
    expect(ACTIONS).toMatch(/formatFeedbackHtml: result\.format_feedback \? renderMathHtml/);
    expect(CARD).toMatch(/__html: partFeedback\.reasonHtml/);
    expect(CARD).toMatch(/__html: feedback\.formatFeedbackHtml/);
    expect(CARD).not.toMatch(/\{partFeedback\.reason\}|\{feedback\.formatFeedback\}/);
  });
});

describe('(c) a right value in the wrong form is amber, not green', () => {
  it('is reported per slot by the marker', () => {
    const parts = [{ label: 'c', slots: [{ label: 'ii', answer: '$2.4 \\times 10^4$', answer_format: 'standard_form', response_mode: 'answer' }] }];
    const res = markStructuredParts(rubric, parts as never, [{ ref: 'c.ii', answer: '24000' }]);
    expect(res.slot_results).toEqual([{ ref: 'c.ii', correct: true, form_withheld: true }]);
  });

  it('is drawn as “✓ value · form withheld” in amber', () => {
    expect(CARD).toMatch(/partFeedback\.formWithheld\s*\?\s*'text-\[#B8860B\]'/);
    expect(CARD).toContain('value · form withheld');
  });
});

describe('(a) a slot with no prompt is named by its part, never counted out', () => {
  it('has no ordinal names left', () => {
    expect(CARD).not.toMatch(/ORDINALS|ordinalAnswer|first answer/);
    expect(CARD).toMatch(/isPositionalLabel\(slot\.label\) \? part\.promptText/);
  });
});

describe('(f) the verdict header is the fraction', () => {
  it('shows a cross only at zero, and no verdict words', () => {
    expect(CARD).toMatch(/\{earned\}\/\{outOf\}\s*\{earned === 0 && <span[^>]*>✗<\/span>\}/);
    expect(CARD).not.toMatch(/'Correct ✓'|'Not quite ✗'/);
  });
});

describe('(g) loading is inline, never a modal', () => {
  const PHOTO = at('app', 'study', 'session', '[id]', 'working-photo.tsx');
  it('shows the page while it is read, and blocks submit meanwhile', () => {
    expect(PHOTO).toMatch(/<img src=\{preview\}/);
    expect(PHOTO).toContain('Reading your page…');
    expect(PHOTO).toMatch(/onBusy\?\.\(true\)/);
    expect(CARD).toMatch(/disabled=\{pending \|\| reading \|\| !canSubmit\}/);
  });
  it('shows skeleton rows while marking', () => {
    expect(CARD).toMatch(/\{pending && \([\s\S]*Marking…[\s\S]*animate-pulse|animate-pulse[\s\S]*Marking…/);
    expect(CARD).not.toMatch(/fixed inset-0[\s\S]{0,300}Marking/);
  });
});

describe('(e) the figure recall sits in the gutter', () => {
  it('is 40px wide at the right edge, shown only while the figure is off-screen', () => {
    expect(CARD).toMatch(/figureAway && !atSubmit && !figureOpen && \(/);
    expect(CARD).toMatch(/fixed bottom-3 right-0 z-40 flex h-11 w-10/);
  });
});

describe('(i) the landing step', () => {
  it('is titled Every day.', () => {
    expect(at('app', 'page.tsx')).toContain('<h3>Every day.</h3>');
  });
});
