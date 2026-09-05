import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const session = (f: string) => at('app', 'study', 'session', '[id]', f);

// ROUND_4 Task 3, pinned in source: one tap per withheld row, the copy, the
// button gone once used and still gone after a reload, and an admin page that
// only reads.
describe('the dispute button', () => {
  const read = session('working-read.tsx');
  const button = session('dispute-button.tsx');

  it('sits on withheld rows only', () => {
    expect(read).toMatch(/dispute && !m\.awarded && \(\s*<DisputeButton/);
  });

  it('says the two things the spec says, and nothing after the first tap but the second', () => {
    expect(button).toContain('Query this mark');
    expect(button).toContain('Queried. A person will look before anything changes.');
    expect(button).toMatch(/if \(done\) \{[\s\S]*Queried/);
    expect(button).toMatch(/useState\(noted\)/);
  });

  it('survives a reload: the look back carries which rows were reported', () => {
    const page = session('page.tsx');
    expect(page).toMatch(/MarkDispute\.find\(\{ attempt_id: attempt\._id \}\)/);
    expect(page).toMatch(/disputed: disputes\.filter/);
    const card = session('question-card.tsx');
    expect(card).toMatch(/disputed: w\.disputed/);
  });

  it('is offered on the live path once the read is marked against an attempt', () => {
    const photo = session('working-photo.tsx');
    expect(photo).toMatch(/attemptId && marked\.transcriptionId/);
    expect(session('mark-working.ts')).toMatch(/transcriptionId: String\(read\._id\)/);
  });
});

describe('/admin/disputes', () => {
  const page = at('app', 'admin', 'disputes', 'page.tsx');

  it('is newest first and read-only; the case page is where a person acts', () => {
    expect(page).toMatch(/\.sort\(\{ ts: -1 \}\)/);
    expect(page).not.toMatch(/<form|'use server'|updateOne|updateMany|deleteOne|create\(/);
    expect(page).toMatch(/reviewed \{latestReview/);
    expect(page).toMatch(/not yet reviewed/);
  });

  it('shows the question, the row, the reason and the read', () => {
    for (const label of ['The question', 'The row', 'The reason it was withheld', 'The read']) {
      expect(page).toContain(label);
    }
  });

  it('is in the admin nav', () => {
    expect(at('app', 'admin', 'admin-nav.tsx')).toMatch(/href: '\/admin\/disputes'/);
  });
});
