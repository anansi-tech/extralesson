import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// ROUND_6 Task 3: an operator is provisioned, never registered; the role is
// written when the provisioning link is claimed, and sign-in says one thing.
const cookieJar = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (k: string) => (cookieJar.has(k) ? { value: cookieJar.get(k) } : undefined),
    set: (k: string, v: string) => cookieJar.set(k, v),
    delete: (k: string) => cookieJar.delete(k),
  }),
  headers: async () => new Headers(),
}));
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`);
  },
}));

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let ResetToken: typeof import('@/lib/db/reset-token').ResetToken;
let provisionAdmin: typeof import('@/lib/auth/provision').provisionAdmin;
let register: typeof import('@/app/study/login/actions').register;
let signIn: typeof import('@/app/study/login/actions').signIn;
let setPassword: typeof import('@/app/study/reset/actions').setPassword;
let getSession: typeof import('@/lib/auth/session').getSession;
let resetRateLimits: typeof import('@/lib/auth/rate-limit').resetRateLimits;
let requireAdmin: typeof import('@/lib/auth/session').requireAdmin;

const OPERATOR = 'operator@extralesson.invalid';
const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
};
const registration = (email: string) => form({ email, password: 'a long enough passphrase', name: 'Someone', exam_sitting: 'may-june-2027' });
const roleOf = async (email: string) => (await db.Student.findOne({ email }).lean<{ role?: string } | null>())?.role;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.SESSION_SECRET = 'provision-test-secret';
  process.env.ADMIN_EMAILS = OPERATOR;
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  ({ ResetToken } = await import('@/lib/db/reset-token'));
  ({ provisionAdmin } = await import('@/lib/auth/provision'));
  ({ register, signIn } = await import('@/app/study/login/actions'));
  ({ setPassword } = await import('@/app/study/reset/actions'));
  ({ getSession, requireAdmin } = await import('@/lib/auth/session'));
  ({ resetRateLimits } = await import('@/lib/auth/rate-limit'));
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  cookieJar.clear();
  resetRateLimits();
  await Promise.all([db.Student.deleteMany({}), ResetToken.deleteMany({})]);
});

describe('admin is provisioned, never registered', () => {
  it('registering an allowlisted address on the public form makes a student', async () => {
    await expect(register({}, registration(OPERATOR))).rejects.toThrow('redirect:/study');
    expect(await roleOf(OPERATOR)).toBe('student');
    expect(await getSession()).toMatchObject({ email: OPERATOR, role: 'student' });
    await expect(requireAdmin()).rejects.toThrow('redirect:/study');
  });

  it('the script makes the account and a link; the role arrives when the link is claimed', async () => {
    const { secret, created } = await provisionAdmin(OPERATOR);
    expect(created).toBe(true);
    expect(await roleOf(OPERATOR)).toBe('student');
    const account = await db.Student.findOne({ email: OPERATOR }).lean<{ password_hash?: string } | null>();
    expect(account?.password_hash).toBeUndefined();

    await expect(setPassword({}, form({ token: secret, password: 'a long enough passphrase' }))).rejects.toThrow('redirect:/study');
    expect(await roleOf(OPERATOR)).toBe('admin');
    expect(await requireAdmin()).toMatchObject({ email: OPERATOR, role: 'admin' });
  });

  it('an account somebody registered first gets the role only through the link', async () => {
    await expect(register({}, registration(OPERATOR))).rejects.toThrow('redirect:/study');
    const { secret, created } = await provisionAdmin(OPERATOR);
    expect(created).toBe(false);
    expect(await roleOf(OPERATOR)).toBe('student');
    await expect(setPassword({}, form({ token: secret, password: 'the operator chooses this one' }))).rejects.toThrow('redirect:/study');
    expect(await roleOf(OPERATOR)).toBe('admin');
  });

  it('refuses to provision an address that is not allowlisted', async () => {
    await expect(provisionAdmin('stranger@extralesson.invalid')).rejects.toThrow(/ADMIN_EMAILS/);
  });

  it('an ordinary reset link grants no role', async () => {
    await expect(register({}, registration(OPERATOR))).rejects.toThrow('redirect:/study');
    const { newResetSecret } = await import('@/lib/auth/reset-token');
    const { secret, lookup } = newResetSecret();
    await ResetToken.create({ lookup, email: OPERATOR, expires_at: new Date(Date.now() + 60_000) });
    await expect(setPassword({}, form({ token: secret, password: 'another long passphrase' }))).rejects.toThrow('redirect:/study');
    expect(await roleOf(OPERATOR)).toBe('student');
  });
});

describe('sign-in says one thing', () => {
  it('answers unknown, legacy and wrong-password with the same words', async () => {
    await db.Student.create({ email: 'legacy@extralesson.invalid', name: 'L', exam_sitting: 'may-june-2027', syllabus_mode: 'modular-2027', target_modules: [1, 2, 3] });
    await expect(register({}, registration('known@extralesson.invalid'))).rejects.toThrow('redirect:/study');
    cookieJar.clear();
    const answers = [
      await signIn({}, form({ email: 'unknown@extralesson.invalid', password: 'whatever it is' })),
      await signIn({}, form({ email: 'legacy@extralesson.invalid', password: 'whatever it is' })),
      await signIn({}, form({ email: 'known@extralesson.invalid', password: 'not the passphrase' })),
    ];
    expect(new Set(answers.map((a) => a.error)).size).toBe(1);
    expect(cookieJar.size).toBe(0);
  });
});

describe('rate limits and session versions', () => {
  it('sign-in is refused after the bucket empties, for that account', async () => {
    await expect(register({}, registration('limited@extralesson.invalid'))).rejects.toThrow('redirect:/study');
    cookieJar.clear();
    const wrong = () => signIn({}, form({ email: 'limited@extralesson.invalid', password: 'not the passphrase' }));
    for (let i = 0; i < 10; i++) expect((await wrong()).error).not.toMatch(/Too many/);
    expect((await wrong()).error).toMatch(/Too many/);
    // The right password is refused too: the bucket, not the credential, decides now.
    expect((await signIn({}, form({ email: 'limited@extralesson.invalid', password: 'a long enough passphrase' }))).error).toMatch(/Too many/);
    expect(cookieJar.size).toBe(0);
  });

  it('a password reset signs out every cookie minted before it', async () => {
    await expect(register({}, registration('reset-me@extralesson.invalid'))).rejects.toThrow('redirect:/study');
    const before = cookieJar.get('el_session')!;
    expect(await getSession()).toMatchObject({ email: 'reset-me@extralesson.invalid' });

    const { newResetSecret } = await import('@/lib/auth/reset-token');
    const { secret, lookup } = newResetSecret();
    await ResetToken.create({ lookup, email: 'reset-me@extralesson.invalid', expires_at: new Date(Date.now() + 60_000) });
    await expect(setPassword({}, form({ token: secret, password: 'a brand new passphrase' }))).rejects.toThrow('redirect:/study');
    expect(await getSession()).toMatchObject({ email: 'reset-me@extralesson.invalid' });

    cookieJar.set('el_session', before);
    expect(await getSession()).toBeNull();
  });
});

describe('create account is a door (ROUND_6 Task 5)', () => {
  const read = (...p: string[]) => require('node:fs').readFileSync(require('node:path').join(process.cwd(), ...p), 'utf8') as string;
  it('the landing’s free-question button opens the create door with the question named', () => {
    expect(read('app', 'page.tsx')).toMatch(/href="\/study\/login\?new=1"[\s\S]{0,80}Mark one question free/);
    const page = read('app', 'study', 'login', 'page.tsx');
    expect(page).toMatch(/const creating = fresh === '1'/);
    expect(page).toMatch(/Your first question is waiting: one Paper 2 question/);
    expect(page).toMatch(/<LoginForm door=\{creating \? 'create' : 'signin'\} \/>/);
  });
  it('the form has no toggle and infers nothing from a failed sign-in', () => {
    const form = read('app', 'study', 'login', 'login-form.tsx');
    expect(form).not.toMatch(/setCreating|signInState\.needsProfile/);
    expect(form).toMatch(/href="\/study\/login\?new=1"/);
    expect(form).toMatch(/href="\/study\/login"[^>]*>[\s\S]{0,40}I already have an account/);
    expect(read('app', 'study', 'login', 'actions.ts')).not.toMatch(/needsProfile/);
  });
});
