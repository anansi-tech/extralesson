import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ReviewCard, { type ReviewQuestion } from '@/app/admin/review/review-card';
import { renderMathHtml } from '@/lib/katex';

describe('admin question review card', () => {
  it('renders misconception triggers and final answers through KaTeX', () => {
    const trigger = '$A=\\{1,2,3,4,5,6\\}$';
    const finalAnswer = '$A=\\{2,4,6\\}$';
    const question: ReviewQuestion = {
      id: '0123456789abcdef01234567',
      objective_ids: ['M1.3.2'],
      module: 1,
      kind: 'structured',
      stemHtml: 'State the members of set A.',
      difficulty: 1,
      marks: 1,
      visual: null,
      rubric: [],
      finalAnswerHtml: renderMathHtml(finalAnswer),
      solutionHtml: 'Read the members inside the circle.',
      misconceptions: [{
        trigger,
        triggerHtml: renderMathHtml(trigger),
        name: 'Universal set confused with subset',
        remediationHtml: renderMathHtml('Only elements inside $A$ belong to $A$.'),
      }],
      editJson: '{}',
    };
    const html = renderToStaticMarkup(<ReviewCard question={question} />);
    expect(html).toContain('class="katex"');
    expect(html).not.toContain('$A=');
    expect(html).not.toContain('inside $A$');
  });
});
