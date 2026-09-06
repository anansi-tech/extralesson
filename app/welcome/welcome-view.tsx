import Link from 'next/link';
import { Lockup } from '../lockup';
import { LANDING } from '@/lib/landing-content';
import { maskEmail, type WelcomeState } from '@/lib/welcome';
import type { LeadPanel } from '@/lib/study/lead-panel';
import { ConfirmingNote } from './confirming';

export interface WelcomeProps {
  state: WelcomeState;
  sessionId: string | null;
  signedIn: boolean;
  lead: LeadPanel;
  diagnosticOpen: boolean;
}

export function WelcomeView({ state, sessionId }: WelcomeProps) {
  return (
    <main className="ruled relative min-h-screen px-5 py-10">
      <div className="mx-auto max-w-md">
        <Lockup width={150} />
        {state.state === 'confirming' && (
          <>
            <h1 className="mt-6 text-2xl font-black">One moment.</h1>
            <p className="mt-2 text-sm">Your card has been charged. We are matching the payment to an account.</p>
            <ConfirmingNote sessionId={sessionId} settled={state.settled} />
          </>
        )}
        {state.state === 'payer' && (
          <>
            <h1 className="mt-6 text-2xl font-black">You&rsquo;re in.</h1>
            <p className="mt-2 text-sm">
              Full access on <b>{state.email}</b>{state.sitting && <>, running to <b>{state.sitting}</b></>}.
            </p>
            <Link href="/study" className="mt-4 block bg-red-pen p-3 text-center font-black text-white">Notebook</Link>
          </>
        )}
        {state.state === 'unregistered' && (
          <>
            <h1 className="mt-6 text-2xl font-black">Payment received.</h1>
            <p className="mt-2 text-sm">The access is waiting on <b>{maskEmail(state.email)}</b>.</p>
            <Link href={`/study/login?new=1&paid=${encodeURIComponent(sessionId ?? '')}`} className="mt-4 block bg-red-pen p-3 text-center font-black text-white">Create the account</Link>
          </>
        )}
        {state.state === 'other' && (
          <>
            <h1 className="mt-6 text-2xl font-black">Thank you.</h1>
            <p className="mt-2 text-sm">
              Access is on <b>{maskEmail(state.email)}</b>{state.sitting && <>, running to <b>{state.sitting}</b></>}. Whoever sits the exam creates their account with that address, or signs in if they have one.
            </p>
          </>
        )}
        <p className="mt-4 text-[12px] text-dim">
          <a href={`mailto:${LANDING.contactEmail}`} className="underline">{LANDING.contactEmail}</a>
        </p>
      </div>
    </main>
  );
}
