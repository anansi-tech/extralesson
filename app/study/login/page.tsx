import LoginForm from './login-form';
import { Door } from '../../door';
import { dbConnect } from '@/lib/db';
import { maskEmail, resolveWelcome } from '@/lib/welcome';
import { SENDER } from '@/lib/email';
import { RESET_TTL_MS } from '@/lib/auth/token';

export const metadata = { title: 'Sign in — ExtraLesson' };

const HEADING = 'mb-1.5 text-2xl font-black tracking-[-0.015em] lg:text-[34px] lg:leading-[1.04] lg:tracking-[-0.02em]';
const LEDE = 'mb-5 text-[13px] leading-normal text-dim lg:text-sm';

/**
 * THREE DOORS ON ONE PAGE (ROUND_6 Task 5; ROUND_9 Task 3): sign in, create
 * an account, ask for a reset link. Which one is open is decided by where
 * the student came from, never by what a failed sign-in guessed about them.
 * ?new=1 is the landing's free-question button, so that door opens with the
 * question named above it; ?paid= is the welcome page, so it opens with the
 * paid address locked.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; new?: string; paid?: string; reset?: string }>;
}) {
  const { error, new: fresh, paid, reset } = await searchParams;
  const creating = fresh === '1';
  const lockedEmail = paid ? await paidAddress(paid) : null;

  return (
    <Door signedIn={false}>
      {lockedEmail ? (
        <>
          <h1 className={HEADING}>Create your account<span className="text-red-pen">.</span></h1>
          <p className={LEDE}>
            The access is waiting on <b className="text-ink">{maskEmail(lockedEmail)}</b>. Create the account on that address and it is applied.
          </p>
          <LoginForm door="create" lockedEmail={lockedEmail} />
        </>
      ) : reset === '1' ? (
        <LoginForm door="reset" sender={SENDER} resetMinutes={RESET_TTL_MS / 60000} />
      ) : (
        <>
          <h1 className={HEADING}>{creating ? 'Create your account' : 'Sign in'}<span className="text-red-pen">.</span></h1>
          <p className={LEDE}>
            {creating
              ? 'Your first question is waiting: one Paper 2 question, marked the way an examiner marks it, free. Make an account and it is the first thing you see.'
              : 'Your email and a password. We keep you signed in for 30 days, so on your own phone this is usually the last time you type it.'}
          </p>
          {error === 'expired' && (
            <p className="mb-4 border-l-3 border-amber bg-[#FDF8EC] px-3 py-2.5 text-[13px] leading-snug">Your session ended. Sign in again.</p>
          )}
          <LoginForm door={creating ? 'create' : 'signin'} />
        </>
      )}
    </Door>
  );
}

async function paidAddress(sessionId: string): Promise<string | null> {
  await dbConnect();
  const state = await resolveWelcome(sessionId, null);
  return state.state === 'unregistered' ? state.email : null;
}
