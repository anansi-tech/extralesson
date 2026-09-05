import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const page = at('app', 'admin', 'disputes', '[id]', 'page.tsx');

// ROUND_7 Task 3: one complete dispute case.
describe('the dispute case', () => {
  it('shows the email, the full question with parts and figure, the working, the photo or that it expired, the criterion, the decision and reason', () => {
    for (const s of ['student?.email', 'renderVisual(', '(question.parts ?? []).map', 'The working for (', 'photo expired', 'The criterion', 'The decision', 'decision.reason']) expect(page).toContain(s);
    expect(page).toMatch(/src=\{`\/admin\/disputes\/\$\{id\}\/photo`\}/);
  });
  it('replies by email with the case summary prefilled, and records a look append-only', () => {
    expect(page).toMatch(/mailto:\$\{encodeURIComponent\(student\.email\)\}/);
    expect(page).toMatch(/body=\$\{encodeURIComponent\([\s\S]*summary/);
    expect(at('app', 'admin', 'disputes', 'actions.ts')).toMatch(/DisputeReview\.create\(\{ dispute_id/);
    expect(at('app', 'admin', 'disputes', 'actions.ts')).not.toMatch(/updateOne|updateMany|deleteOne/);
    const schema = at('lib', 'db', 'dispute-review.ts');
    expect(schema).toMatch(/dispute_id[\s\S]*reviewed_at[\s\S]*note/);
    expect(schema).not.toMatch(/status: \{|resolved_at/);
  });
  it('is the same view for a review the marker raised, and export is a secondary link', () => {
    expect(page).toMatch(/const readId = dispute\?\.transcription_id \?\? id/);
    expect(at('app', 'admin', 'disputes', 'page.tsx')).toMatch(/open the case/);
    expect(at('app', 'admin', 'disputes', 'page.tsx')).not.toMatch(/Export as golden case/);
    expect(page).toMatch(/Golden case: <a href=\{`\/admin\/disputes\/\$\{id\}\/export`\}/);
  });
  it('the photo route serves the disputed take while it lives, and says expired after', () => {
    const route = at('app', 'admin', 'disputes', '[id]', 'photo', 'route.ts');
    expect(route).toMatch(/session_id: read\.session_id, question_index: read\.question_index, take: read\.take/);
    expect(route).toMatch(/'photo expired', \{ status: 404 \}/);
    expect(route).toMatch(/session\?\.role !== 'admin'/);
  });
  it('erasure takes the reviews with the disputes', () => {
    expect(at('lib', 'delete-student.ts')).toMatch(/DisputeReview\.deleteMany\(\{ dispute_id: \{ \$in: disputeIds \} \}\)/);
  });
});
