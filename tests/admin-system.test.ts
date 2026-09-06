import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ReviewCard, { type ReviewQuestion } from '@/app/admin/review/review-card';
import { DeleteAccount } from '@/app/admin/access/delete-account';
import { PRIMARY, SECONDARY } from '@/app/admin/ui';
import { visibleText } from './helpers/card-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {}, replace() {} }), usePathname: () => '/admin/review' }));

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : [];
  });

// ROUND_10 Task 2: the operator's screens on the system — its tokens, its
// rows, its buttons, and the refusal and failure patterns where a screen
// shows a boundary or an error.
describe('the admin surfaces use the system', () => {
  it('names every colour by its token — no literal hex, no hand-written shadow', () => {
    for (const f of walk(join(process.cwd(), 'app', 'admin'))) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/\[#[0-9A-Fa-f]{3,8}\]/);
      expect(src, f).not.toMatch(/shadow-\[\d/);
    }
  });
  it('draws buttons and fields from one place', () => {
    for (const f of ['access/page.tsx', 'access/delete-account.tsx', 'review/page.tsx', 'review/review-card.tsx', 'coverage/page.tsx', 'topics/page.tsx', 'disputes/page.tsx', 'disputes/[id]/page.tsx']) {
      expect(at('app', 'admin', ...f.split('/')), f).toMatch(/from '(\.\.\/)+ui'/);
    }
  });
  it('shows a boundary on the refusal pattern and a failure on the amber one', () => {
    const access = at('app', 'admin', 'access', 'page.tsx');
    expect(access).toMatch(/<Refusal\s+id="payments-attention"\s+amber/);
    expect(access).toMatch(/<Refusal\s+id="payments-unmatched"\s+className/);
    expect(access).toMatch(/<Refusal\s+id="payments-refused"\s+amber/);
    expect(at('app', 'admin', 'review', 'page.tsx')).toMatch(/<Refusal id="queue-empty"/);
    expect(at('app', 'admin', 'disputes', 'page.tsx')).toMatch(/<Refusal id="no-disputes"/);
    expect(at('app', 'admin', 'layout.tsx')).toMatch(/id="before-launch"\s+amber/);
    expect(at('app', 'admin', 'access', 'delete-account.tsx')).toMatch(/className=\{`mt-3 \$\{FAILURE\}`\}/);
    expect(at('app', 'admin', 'review', 'review-card.tsx')).toMatch(/className=\{`mt-2 \$\{FAILURE\}`\}/);
  });
  it('keeps the hint-count line green on equality, the card’s shortcuts and the attention query', () => {
    expect(at('app', 'admin', 'review', 'page.tsx')).toMatch(/hints\.withHint === hints\.methodRows \? 'text-green-pen' : 'text-ink'/);
    const card = at('app', 'admin', 'review', 'review-card.tsx');
    expect(card).toMatch(/\(e\.key === 'a' \|\| e\.key === 'A'\) && question\.status === 'draft'\) approve\(\)/);
    expect(card).toMatch(/\(e\.key === 'r' \|\| e\.key === 'R'\) && question\.status !== 'retired'\) retire\(\)/);
    expect(card).toMatch(/e\.key === 'e' \|\| e\.key === 'E'/);
    expect(at('app', 'admin', 'access', 'page.tsx')).toMatch(/\{ status: 'failed' \}, \{ status: 'pending', ts: \{ \$lt: new Date\(Date\.now\(\) - STALE_PENDING_MS\) \} \}/);
  });
});

const question: ReviewQuestion = {
  id: 'abcdef0123456789abcdef01',
  status: 'draft',
  flags: [{ level: 'warn', text: 'The final answer is not in the rubric.' }],
  objectives: [{ id: 'M1.5.2', text: 'Solve linear equations', approvedOthers: 0, draftOthers: 1 }],
  objective_ids: ['M1.5.2'],
  module: 1,
  kind: 'structured',
  stemHtml: 'Solve 3x + 1 = 0.',
  parts: [{ label: 'a', promptHtml: 'Find x.', marks: 2, slots: [{ label: 'i', answerHtml: '−1/3' }] }],
  difficulty: 2,
  marks: 2,
  rubric: [{ code: 'AK1', profile: 'AK', criterionHtml: 'Correct value of x', mark_value: 2, part_label: 'a', hintHtml: 'Move the 1 first.' }],
  solutionHtml: 'x = −1/3',
  misconceptions: [{ triggerHtml: '1/3', nameHtml: 'Sign slip', remediationHtml: 'The sign flips.' }],
  editJson: '{}',
};

describe('the review card as drawn', () => {
  const html = renderToStaticMarkup(createElement(ReviewCard, { question }));
  it('keeps every part, the hint under its criterion, and the three actions with their keys', () => {
    const text = visibleText(html);
    expect(text).toContain('the only evidence · 1 more in draft');
    expect(text).toContain('AK1 (a) Correct value of x 2 hint Move the 1 first.');
    expect(text).toMatch(/Approve A Edit E Reject R$/);
  });
  it('makes Approve the screen’s primary and the rest secondary', () => {
    expect(html).toContain(`class="${PRIMARY}">Approve`);
    expect(html).toContain(`class="${SECONDARY}">Edit`);
    expect(html).toContain(`class="${SECONDARY} text-red-pen">Reject`);
  });
});

describe('the delete form as drawn', () => {
  const html = renderToStaticMarkup(createElement(DeleteAccount));
  it('asks for the address twice and deletes on the primary', () => {
    expect(html.match(/type="email"/g)).toHaveLength(2);
    expect(html).toContain(`class="${PRIMARY}">Delete this account`);
    expect(visibleText(html)).toContain('Delete an account');
  });
});
