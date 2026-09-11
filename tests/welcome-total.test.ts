import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// THE PAGE NEVER SHOWS AN ERROR, enforced rather than stated. It threw in
// production on a session with no Payment row and fell through to the error
// boundary — the reader had just paid, and that screen tells them their money
// went somewhere nobody can name. Each of the six awaited calls is made to
// throw here, and each must still render one of the four states.
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {} }), usePathname: () => '/welcome' }));

const state = vi.hoisted(() => ({ throwing: '' }));
const boom = (name: string) => {
  if (state.throwing === name) throw new Error(`${name} exploded`);
};

vi.mock('@/lib/auth/session', () => ({
  getSession: async () => {
    boom('getSession');
    return { student_id: 'stu1', email: 'kiara@example.com', role: 'student' };
  },
}));
vi.mock('@/lib/db', () => ({
  dbConnect: async () => {
    boom('dbConnect');
  },
}));
vi.mock('@/lib/welcome', () => ({
  resolveWelcome: async () => {
    boom('resolveWelcome');
    return { state: 'payer', email: 'kiara@example.com', sitting: 'may-june-2027', studentId: 'stu1' };
  },
}));
vi.mock('@/lib/access', () => ({
  diagnosticOpensAt: async () => {
    boom('diagnosticOpensAt');
    return null;
  },
  firstQuestionTaken: async () => {
    boom('firstQuestionTaken');
    return false;
  },
  REFUND_DAYS: 14,
}));
vi.mock('@/lib/study/open-session', () => ({
  openSession: async () => {
    boom('openSession');
    return null;
  },
}));

const SESSION = 'cs_test_a1g379jTnf7fj7iHkv1wbE5PbGUHRtXh8NqxLIPzCSY9zeoK2qh68OBR8W';
const CALLS = ['getSession', 'dbConnect', 'resolveWelcome', 'diagnosticOpensAt', 'openSession', 'firstQuestionTaken'] as const;

/** The heading of each of the four, so a render can be shown to be exactly one. */
const STATES = ['One moment', 'You’re in', 'Payment received', 'Thank you'];

const render = async (searchParams: Promise<{ session_id?: string }>) => {
  const { default: WelcomePage } = await import('@/app/welcome/page');
  return renderToStaticMarkup(await WelcomePage({ searchParams }));
};
const visible = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

let logged: unknown[][] = [];
beforeEach(() => {
  logged = [];
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    logged.push(args);
  });
});
afterEach(() => {
  state.throwing = '';
  vi.restoreAllMocks();
});

describe('whatever throws, the page is one of the four states', () => {
  for (const call of CALLS) {
    it(`${call} throwing renders confirming, and never rejects`, async () => {
      state.throwing = call;

      const html = await render(Promise.resolve({ session_id: SESSION }));

      expect(visible(html)).toContain('Confirming your payment');
      expect(STATES.filter((s) => visible(html).includes(s)), 'exactly one state').toEqual(['One moment']);
      // The reader is told the receipt is safe, which is the point of the state.
      expect(visible(html)).toMatch(/receipt is already in your email/i);
    }, 30000);

    it(`${call} throwing leaves a record of what actually failed`, async () => {
      state.throwing = call;

      await render(Promise.resolve({ session_id: SESSION }));

      const line = logged.find((args) => String(args[0]).includes(`[welcome] ${call} threw`));
      expect(line, `${call} was named in the log`).toBeTruthy();
      expect(String((line![1] as Error)?.message), 'the underlying error, not a summary').toBe(`${call} exploded`);
    }, 30000);
  }

  it('the query itself throwing is caught too, and is still a state', async () => {
    const html = await render(Promise.reject(new Error('bad query')));

    expect(visible(html)).toContain('Confirming your payment');
    expect(logged.some((args) => String(args[0]).includes('[welcome] searchParams threw'))).toBe(true);
  }, 30000);

  it('with nothing throwing, a payer still reads as a payer', async () => {
    const html = await render(Promise.resolve({ session_id: SESSION }));

    expect(STATES.filter((s) => visible(html).includes(s))).toEqual(['You’re in']);
    expect(visible(html)).not.toContain('Confirming your payment');
    expect(logged, 'nothing logged when nothing failed').toHaveLength(0);
  }, 30000);

  it('no session id at all is the settled confirming state, not a failure', async () => {
    const html = await render(Promise.resolve({}));

    expect(visible(html)).toContain('Confirming your payment');
    expect(logged).toHaveLength(0);
  }, 30000);
});
