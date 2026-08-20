import ResetForm from './reset-form';

export const metadata = { title: 'Set a new password — ExtraLesson' };
export const dynamic = 'force-dynamic';

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="ruled relative min-h-screen px-5 py-10">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-sm">
        <div className="text-xl font-black">
          extra<em className="not-italic text-red-pen">lesson</em>
        </div>
        <h1 className="mt-6 text-2xl font-black">
          Set a new password<span className="text-red-pen">.</span>
        </h1>
        {token ? (
          <ResetForm token={token} />
        ) : (
          <p className="mt-6 border-l-3 border-red-pen bg-white p-4 text-sm">
            This page needs the link from your email. Ask for a new one on the sign-in page.
          </p>
        )}
      </div>
    </main>
  );
}
