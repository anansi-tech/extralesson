import LoginForm from './login-form';
import { Lockup } from '../../lockup';

export const metadata = { title: 'Sign in — ExtraLesson' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="ruled relative min-h-screen px-6 py-12">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-sm">
        <Lockup width={150} />
        <h1 className="mt-8 text-3xl font-black leading-tight">Sign in.</h1>
        <p className="mt-2 text-dim">
          Your email and a password. We keep you signed in for 30 days, so on your own phone this
          is usually the last time you type it.
        </p>
        {error === 'expired' && (
          <p className="mt-4 border-l-3 border-red-pen bg-[#FDF1F0] p-3 text-sm text-red-pen">
            Your session ended. Sign in again.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
