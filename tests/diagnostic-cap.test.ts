import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// THE DIAGNOSTIC WAS FREE AND UNLIMITED, WHICH MADE IT UNLIMITED FREE PRACTICE.
//
// It bypassed the gate entirely on `mode === 'diagnostic'`, so a student could
// keep starting one and never pay for anything. It is one per student now, and
// the re-take interval is long enough that it cannot be used as a supply of
// questions.

let mongod: MongoMemoryServer;
let PracticeSession: typeof import('@/lib/db').PracticeSession;
let canStartSession: typeof import('@/lib/access').canStartSession;
let diagnosticOpensAt: typeof import('@/lib/access').diagnosticOpensAt;
let DIAGNOSTIC_INTERVAL_DAYS: number;
let FREE_SESSIONS: number;

const STUDENT = new mongoose.Types.ObjectId();
const OTHER = new mongoose.Types.ObjectId();
const DAY = 24 * 60 * 60 * 1000;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  ({ PracticeSession } = await import('@/lib/db'));
  ({ canStartSession, diagnosticOpensAt, DIAGNOSTIC_INTERVAL_DAYS, FREE_SESSIONS } = await import(
    '@/lib/access'
  ));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await PracticeSession.deleteMany({});
});

const sat = (studentId: mongoose.Types.ObjectId, mode: string, startedAt: Date) =>
  PracticeSession.create({
    student_id: studentId,
    question_ids: [new mongoose.Types.ObjectId()],
    mode,
    started_at: startedAt,
  });

const paid = { sitting: 'may-june-2027', granted_at: new Date('2026-09-01'), source: 'manual' };
const NOW = new Date('2026-09-01T00:00:00Z');

describe('the diagnostic is capped at one per student', () => {
  it('lets a student who has never sat one start it', async () => {
    const gate = await canStartSession(String(STUDENT), null, 'diagnostic', NOW);
    expect(gate.allowed).toBe(true);
    expect(await diagnosticOpensAt(String(STUDENT))).toBeNull();
  });

  it('refuses a second one, and says when it opens', async () => {
    await sat(STUDENT, 'diagnostic', NOW);
    const gate = await canStartSession(String(STUDENT), null, 'diagnostic', NOW);
    expect(gate.allowed).toBe(false);
    if (gate.allowed) return;
    expect(gate.reason).toBe('diagnostic-taken');
    if (gate.reason !== 'diagnostic-taken') return;
    expect(gate.opensAt.getTime()).toBe(NOW.getTime() + DIAGNOSTIC_INTERVAL_DAYS * DAY);
  });

  it('still refuses the day before the interval is up', async () => {
    await sat(STUDENT, 'diagnostic', NOW);
    const almost = new Date(NOW.getTime() + (DIAGNOSTIC_INTERVAL_DAYS - 1) * DAY);
    expect((await canStartSession(String(STUDENT), null, 'diagnostic', almost)).allowed).toBe(false);
  });

  it('opens again for the student coming back after a term away', async () => {
    await sat(STUDENT, 'diagnostic', NOW);
    const later = new Date(NOW.getTime() + DIAGNOSTIC_INTERVAL_DAYS * DAY);
    expect((await canStartSession(String(STUDENT), null, 'diagnostic', later)).allowed).toBe(true);
  });

  it('caps a PAYING student too — it is not a paywall, it is a cap', async () => {
    await sat(STUDENT, 'diagnostic', NOW);
    const gate = await canStartSession(String(STUDENT), paid, 'diagnostic', NOW);
    expect(gate.allowed).toBe(false);
  });

  it('counts only this student, and only diagnostics', async () => {
    await sat(OTHER, 'diagnostic', NOW);
    await sat(STUDENT, 'adaptive', NOW);
    expect((await canStartSession(String(STUDENT), null, 'diagnostic', NOW)).allowed).toBe(true);
  });

  it('reads the LATEST diagnostic, not the first', async () => {
    await sat(STUDENT, 'diagnostic', new Date(NOW.getTime() - 400 * DAY));
    await sat(STUDENT, 'diagnostic', NOW);
    const gate = await canStartSession(String(STUDENT), null, 'diagnostic', NOW);
    expect(gate.allowed).toBe(false);
  });
});

describe('capping the diagnostic leaves the free tier where it was', () => {
  it('does not spend a free session, so the two free sessions survive it', async () => {
    await sat(STUDENT, 'diagnostic', NOW);
    for (let i = 0; i < FREE_SESSIONS; i++) {
      expect((await canStartSession(String(STUDENT), null, 'adaptive', NOW)).allowed).toBe(true);
      await sat(STUDENT, 'adaptive', NOW);
    }
    const gate = await canStartSession(String(STUDENT), null, 'adaptive', NOW);
    expect(gate.allowed).toBe(false);
    if (gate.allowed) return;
    expect(gate.reason).toBe('needs-access');
  });

  it('names an expired sitting apart from one that never paid', async () => {
    for (let i = 0; i < FREE_SESSIONS; i++) await sat(STUDENT, 'adaptive', NOW);
    const expired = { ...paid, sitting: 'jan-2027' };
    const gate = await canStartSession(String(STUDENT), expired, 'adaptive', new Date('2027-09-01'));
    expect(gate.allowed).toBe(false);
    if (gate.allowed) return;
    expect(gate.reason).toBe('access-expired');
  });
});
