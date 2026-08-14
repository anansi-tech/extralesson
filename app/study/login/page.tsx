import LoginForm from './login-form';

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
        <div className="text-2xl font-black">
          extra<em className="not-italic text-red-pen">lesson</em>
        </div>
        <h1 className="mt-8 text-3xl font-black leading-tight">Sign in with a magic link.</h1>
        <p className="mt-2 text-dim">
          No passwords. We send a link that signs you in — it works once and expires in 15
          minutes.
        </p>
        {error === 'expired' && (
          <p className="mt-4 border-l-3 border-red-pen bg-[#FDF1F0] p-3 text-sm text-red-pen">
            That link has expired or was already used. Request a fresh one.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
