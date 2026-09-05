import LoginForm from './login-form';
import { Lockup } from '../../lockup';

export const metadata = { title: 'Sign in — ExtraLesson' };

/**
 * TWO DOORS ON ONE PAGE (ROUND_6 Task 5): create an account, or sign in. Which
 * one is open first is decided by where the student came from, never by what
 * a failed sign-in guessed about them. ?new=1 is the landing's free-question
 * button, so that door opens with the question named above it.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; new?: string }>;
}) {
  const { error, new: fresh } = await searchParams;
  const creating = fresh === '1';
  return (
    <main className="ruled relative min-h-screen px-6 py-12">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-sm">
        <Lockup width={150} />
        <h1 className="mt-8 text-3xl font-black leading-tight">{creating ? 'Create your account.' : 'Sign in.'}</h1>
        {creating ? (
          <p className="mt-2 text-dim">
            Your first question is waiting: one Paper 2 question, marked the way an examiner marks it,
            free. Make an account and it is the first thing you see.
          </p>
        ) : (
          <p className="mt-2 text-dim">
            Your email and a password. We keep you signed in for 30 days, so on your own phone this
            is usually the last time you type it.
          </p>
        )}
        {error === 'expired' && (
          <p className="mt-4 border-l-3 border-red-pen bg-[#FDF1F0] p-3 text-sm text-red-pen">
            Your session ended. Sign in again.
          </p>
        )}
        <LoginForm door={creating ? 'create' : 'signin'} />
      </div>
    </main>
  );
}
