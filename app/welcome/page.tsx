import Link from 'next/link';
import { LANDING } from '@/lib/landing-content';

export const metadata = {
  title: 'Payment received — ExtraLesson',
  // Nobody should reach this page except from checkout.
  robots: { index: false, follow: false },
};

/**
 * WHERE STRIPE SENDS A STUDENT AFTER PAYING.
 *
 * One instruction, because there is only one way this goes wrong: access is
 * matched on the EMAIL ADDRESS, so an account made with a different one gets
 * nothing until someone matches it by hand. Everything else can wait.
 */
export default function WelcomePage() {
  return (
    <main className="ruled relative min-h-screen px-5 py-10">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-md">
        <div className="text-xl font-black">
          extra<em className="not-italic text-red-pen">lesson</em>
        </div>

        <h1 className="mt-6 text-2xl font-black leading-tight">Payment received.</h1>

        <section className="mt-5 border-[1.5px] border-ink bg-white p-4 shadow-[4px_4px_0_var(--ink)]">
          <div className="font-mono text-[10px] uppercase tracking-widest text-red-pen">
            Use the same email address
          </div>
          <p className="mt-1 text-sm leading-snug">
            Sign up with <b>the student email address you entered at checkout</b>. That address is
            how your payment is matched to your account — a different one, and your access will not
            appear.
          </p>
          <Link
            href="/study/login"
            className="mt-4 block bg-red-pen p-3 text-center font-black text-white shadow-[3px_3px_0_var(--ink)]"
          >
            Create your account
          </Link>
          <p className="mt-2 text-center text-[12px] text-dim">
            Already signed up with that address?{' '}
            <Link href="/study/login" className="underline">
              Sign in
            </Link>{' '}
            — your access will be there.
          </p>
        </section>

        <p className="mt-4 text-[12px] leading-snug text-dim">
          Access usually appears within a minute. If it has not after a few minutes, email{' '}
          <a href={`mailto:${LANDING.contactEmail.toLowerCase()}`} className="underline">
            {LANDING.contactEmail.toLowerCase()}
          </a>{' '}
          with the address you paid with and we will sort it out by hand.
        </p>
      </div>
    </main>
  );
}
