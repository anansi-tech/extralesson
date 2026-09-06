import ResetForm from './reset-form';
import { Door } from '../../door';

export const metadata = { title: 'Set a new password — ExtraLesson' };
export const dynamic = 'force-dynamic';

/** The end of the reset: the link from the email, and one field. */
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <Door signedIn={false}>
      <h1 className="mb-1.5 text-2xl font-black tracking-[-0.015em] lg:text-[34px] lg:leading-[1.04] lg:tracking-[-0.02em]">
        Set a new password<span className="text-red-pen">.</span>
      </h1>
      {token ? (
        <ResetForm token={token} />
      ) : (
        <p className="mt-4 border-l-3 border-amber bg-[#FDF8EC] px-3 py-2.5 text-[13px] leading-snug">
          This page needs the link from your email. Ask for a new one on the sign-in page.
        </p>
      )}
    </Door>
  );
}
