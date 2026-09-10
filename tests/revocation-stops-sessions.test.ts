import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { grantFor } from '@/lib/access';
import { leadPanel } from '@/lib/study/lead-panel';

// ROUND_12 Task 3. hasAccess alone does not enforce revocation: canStartSession
// allows the free sessions and checks the diagnostic and first-question modes
// before it ever looks at paid access. So the check is explicit, on the
// student, and ahead of every allowance.
const SITTING = 'may-june-2027';
let mongod: MongoMemoryServer;
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
}, 120000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
beforeEach(async () => {
  const { dbConnect, Attempt, PracticeSession, Student } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([Student.deleteMany({}), PracticeSession.deleteMany({}), Attempt.deleteMany({})]);
});

const REVOKED = { sitting: SITTING, granted_at: new Date('2026-09-01'), source: 'stripe', note: 'stripe evt_1', revoked_at: new Date(), revoked_by: 'ops@example.com', revoked_reason: 'refunded' };
async function student(access?: Record<string, unknown>, sitting = SITTING) {
  const { Student } = await import('@/lib/db');
  return Student.create({ email: `s${Math.random().toString(36).slice(2, 8)}@example.com`, name: 'Kiara', exam_sitting: sitting, target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027', ...(access ? { access } : {}) });
}
const gate = async (studentId: unknown, mode: string, access?: unknown) => {
  const { canStartSession } = await import('@/lib/access');
  return canStartSession(String(studentId), access as never, mode);
};

describe('a revoked student starts nothing', () => {
  it('not a session, however many free ones they have left', async () => {
    const s = await student(REVOKED);
    // Nothing used: the free allowance is untouched and still gives them nothing.
    expect(await gate(s._id, 'adaptive', s.access)).toEqual({ allowed: false, reason: 'revoked' });
    expect(await gate(s._id, 'topic', s.access)).toEqual({ allowed: false, reason: 'revoked' });
    expect(await gate(s._id, 'revisit', s.access)).toEqual({ allowed: false, reason: 'revoked' });
  }, 60000);

  it('not the diagnostic, untaken', async () => {
    const s = await student(REVOKED);
    const { diagnosticOpensAt } = await import('@/lib/access');
    expect(await diagnosticOpensAt(String(s._id))).toBeNull(); // never sat one
    expect(await gate(s._id, 'diagnostic', s.access)).toEqual({ allowed: false, reason: 'revoked' });
  }, 60000);

  it('not the first question, untaken', async () => {
    const s = await student(REVOKED);
    const { firstQuestionTaken } = await import('@/lib/access');
    expect(await firstQuestionTaken(String(s._id))).toBe(false);
    expect(await gate(s._id, 'first', s.access)).toEqual({ allowed: false, reason: 'revoked' });
  }, 60000);

  it('and still nothing after changing sitting — the check is not on the grant', async () => {
    const s = await student(REVOKED);
    const { applySittingChange } = await import('@/lib/change-sitting');
    await applySittingChange(String(s._id), 'jan-2028');

    // THE HAZARD, made visible: filtered by the new sitting the revoked grant
    // vanishes, and a gate reading that would reopen every allowance.
    expect(grantFor(REVOKED, 'jan-2028')).toBeNull();
    for (const mode of ['adaptive', 'diagnostic', 'first', 'topic']) {
      expect(await gate(s._id, mode, grantFor(REVOKED, 'jan-2028')), mode).toEqual({ allowed: false, reason: 'revoked' });
    }
  }, 60000);

  it('while a student whose grant is merely expired keeps the free tier', async () => {
    const live = { sitting: SITTING, granted_at: new Date('2026-09-01'), source: 'stripe', note: 'stripe evt_1' };
    const s = await student(live);
    expect(await gate(s._id, 'adaptive', live)).toMatchObject({ allowed: true });
    expect(await gate(s._id, 'diagnostic', live)).toEqual({ allowed: true });
  }, 60000);
});

describe('what revocation does not stop', () => {
  it('a session already in flight: no gate stands between them and finishing it', async () => {
    const { PracticeSession } = await import('@/lib/db');
    const { openSession } = await import('@/lib/study/open-session');
    const s = await student(REVOKED);
    // A question still unanswered: that is what "in flight" means.
    await PracticeSession.create({ student_id: s._id, mode: 'adaptive', started_at: new Date(), question_ids: [new mongoose.Types.ObjectId()], target_modules: [1] });

    // The session they are in is still open to them.
    expect(await openSession(String(s._id))).not.toBeNull();
    // Ending mid-question would destroy work that is theirs, so nothing on the
    // session route asks the gate.
    const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
    for (const f of [['app', 'study', 'session', '[id]', 'page.tsx'], ['app', 'study', 'session', '[id]', 'actions.ts']]) {
      expect(at(...f), f.join('/')).not.toMatch(/canStartSession|isRevoked/);
    }
  }, 60000);

  it('history, progress and every marked question stay open', async () => {
    const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
    for (const f of [['app', 'study', 'history', 'page.tsx'], ['app', 'study', 'progress', 'page.tsx']]) {
      expect(at(...f), f.join('/')).not.toMatch(/canStartSession|isRevoked|revoked_at/);
    }
    // And the fold that feeds them reads attempts, which revocation never touches.
    const { loadHistory } = await import('@/lib/study/history');
    const s = await student(REVOKED);
    expect(await loadHistory(String(s._id))).toEqual([]);
  }, 60000);
});

describe('what they meet instead', () => {
  it('is the paywall pattern, ahead of every other lead', () => {
    const args = { open: true, questions: true, firstTaken: false, diagnosticTaken: false };
    expect(leadPanel({ ...args, access: 'revoked' })).toBe('revoked');
    // Even with an open session, which they may still finish from its own page.
    expect(leadPanel({ ...args, access: 'ok' })).toBe('resume');
  });

  it('says access ended and that their work is still here, with the way to read it', async () => {
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { DashboardView } = await import('@/app/study/dashboard');
    const { STATES } = await import('./helpers/dashboard-states');
    const { visibleText } = await import('./helpers/dashboard-states');
    const html = renderToStaticMarkup(createElement(DashboardView, { ...STATES.returning, lead: 'revoked' }));
    const text = visibleText(html);

    expect(text).toContain('Your access has ended');
    expect(text).toContain('Your payment was refunded, so the sessions have stopped.');
    expect(text).toContain('Everything you have done stays here');
    expect(html).toContain('href="/study/history"');
    // One red action, and nothing offering a session they cannot start.
    expect((html.match(/bg-red-pen/g) ?? []).length).toBe(1);
    expect(text).not.toMatch(/Start today|Take a diagnostic|Mark one question|Practise/);
  });
});
