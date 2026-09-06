import Link from 'next/link';
import { Door } from '../door';
import { startSession } from '../study/actions';
import { LANDING } from '@/lib/landing-content';
import { REFUND_DAYS } from '@/lib/access';
import { DIAGNOSTIC_MINUTES, SESSION_MINUTES } from '@/lib/session/builder';
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

const PRIMARY = 'min-h-11 w-full bg-red-pen px-4 py-[18px] text-left text-lg font-black text-white shadow-[var(--shadow-card)]';
const PRIMARY_SMALL = 'mt-1.5 block font-mono text-[10.5px] font-medium tracking-[0.1em] opacity-85';
const QUIET = 'inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.14em] underline underline-offset-[3px]';

/** The same card, and the action changes with who is holding the phone (§04). */
export function WelcomeView({ state, sessionId, signedIn, lead, diagnosticOpen }: WelcomeProps) {
  return (
    <Door signedIn={signedIn}>
      {state.state === 'confirming' && (
        <>
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-dim">Confirming your payment</div>
          <Heading>One moment</Heading>
          <p className="mb-4 text-[15px] leading-normal">Your card has been charged. We are matching the payment to an account.</p>
          <div className="h-2 overflow-hidden rounded border border-ink bg-paper-deep">
            <i className="block h-full w-[62%] bg-amber" />
          </div>
          <ConfirmingNote sessionId={sessionId} settled={state.settled} />
        </>
      )}

      {state.state === 'payer' && (
        <>
          <Tick />
          <Heading>You&rsquo;re in</Heading>
          <p className="mb-[18px] text-[15px] leading-normal">
            Full access on <b>{state.email}</b>
            {state.sitting && <>, running to <b>{state.sitting}</b></>}.
          </p>
          <Primary lead={lead} />
          {lead === 'first' && diagnosticOpen && (
            <div className="mt-5 border-t border-paper-deep pt-3">
              <form action={startSession}>
                <input type="hidden" name="mode" value="diagnostic" />
                <button className={QUIET}>Or start with the diagnostic</button>
              </form>
            </div>
          )}
        </>
      )}

      {state.state === 'unregistered' && (
        <>
          <Tick />
          <Heading>Payment received</Heading>
          <p className="mb-[18px] text-[15px] leading-normal">
            The access is waiting on <b>{maskEmail(state.email)}</b>. Create the account on that address and it is applied.
          </p>
          <Link href={`/study/login?new=1&paid=${encodeURIComponent(sessionId ?? '')}`} className="block min-h-11 w-full bg-red-pen p-4 text-center text-[17px] font-black text-white shadow-[var(--shadow-card)]">
            Create the account
          </Link>
          <Note>Nothing expires while you do this. The payment stays attached to that address.</Note>
        </>
      )}

      {state.state === 'other' && (
        <>
          <Tick />
          <Heading>Thank you</Heading>
          <p className="mb-[18px] text-[15px] leading-normal">
            Access is on <b>{maskEmail(state.email)}</b>
            {state.sitting && <>, running to <b>{state.sitting}</b></>}. Whoever sits the exam creates their account with that address, or signs in if they have one.
          </p>
          <div className="flex flex-wrap gap-x-5">
            <Link href={`/study/login?new=1&paid=${encodeURIComponent(sessionId ?? '')}`} className={QUIET}>Create an account</Link>
            <Link href="/study/login" className={QUIET}>Sign in</Link>
          </div>
          <p className="mt-4 text-[13.5px] leading-relaxed">
            How you will know it is working: the student will show you. We do not send reports. The student can open their own marked working — every question, every mark, and the reason for each one — at any time. You will hear how it is going from the student, not from us.
          </p>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-dim">
            Not satisfied? Email{' '}
            <a href={`mailto:${LANDING.contactEmail}`} className="underline underline-offset-[3px]">{LANDING.contactEmail}</a>{' '}
            within {REFUND_DAYS} days of paying and we will refund you.
          </p>
        </>
      )}

      {(state.state === 'confirming' || state.state === 'unregistered') && (
        <p className="mt-4 text-xs leading-snug text-dim">
          Access usually appears within a minute. If it has not after a few minutes, email{' '}
          <a href={`mailto:${LANDING.contactEmail}`} className="underline underline-offset-[3px]">{LANDING.contactEmail}</a>{' '}
          with the address you paid with and we will sort it out by hand.
        </p>
      )}
    </Door>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="mb-3 mt-2 text-2xl font-black tracking-[-0.015em]">
      {children}
      <span className="text-red-pen">.</span>
    </h1>
  );
}

function Tick() {
  return <div className="font-hand text-[32px] leading-none text-green-pen">✓</div>;
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-3.5 border-l-3 border-margin bg-[#FFFDF6] px-3 py-2 text-[13px] leading-snug text-dim">{children}</p>;
}

/** Whatever the notebook would lead with for this student: the same words, the same forms. */
function Primary({ lead }: { lead: LeadPanel }) {
  if (lead === 'resume') {
    return (
      <Link href="/study" className={`${PRIMARY} block`}>
        Carry on with your session
      </Link>
    );
  }
  if (lead === 'first') {
    return (
      <form action={startSession}>
        <input type="hidden" name="mode" value="first" />
        <button className={PRIMARY}>
          Mark one question free
          <small className={PRIMARY_SMALL}>ONE REAL QUESTION · NOT ONE OF YOUR SESSIONS</small>
        </button>
      </form>
    );
  }
  if (lead === 'diagnostic') {
    return (
      <form action={startSession}>
        <input type="hidden" name="mode" value="diagnostic" />
        <button className={PRIMARY}>
          Start with a quick diagnostic
          <small className={PRIMARY_SMALL}>ABOUT {DIAGNOSTIC_MINUTES} MINUTES · EIGHT QUESTIONS · NOTHING SCORED</small>
        </button>
      </form>
    );
  }
  return (
    <form action={startSession}>
      <button className={PRIMARY}>
        Start today&rsquo;s session
        <small className={PRIMARY_SMALL}>{SESSION_MINUTES} MINUTES · WEAKEST TOPICS FIRST</small>
      </button>
    </form>
  );
}
