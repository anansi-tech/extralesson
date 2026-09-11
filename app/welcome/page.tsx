import { dbConnect } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { resolveWelcome, type WelcomeState } from '@/lib/welcome';
import { leadPanel, type LeadPanel } from '@/lib/study/lead-panel';
import { openSession } from '@/lib/study/open-session';
import { diagnosticOpensAt, firstQuestionTaken } from '@/lib/access';
import { WelcomeView } from './welcome-view';

export const metadata = {
  title: 'Payment received — ExtraLesson',
  // Nobody should reach this page except from checkout.
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

interface View {
  state: WelcomeState;
  signedIn: boolean;
  lead: LeadPanel;
  diagnosticOpen: boolean;
}

/**
 * WHAT WE SAY WHEN WE CANNOT TELL. The reader has just paid and arrived from
 * Stripe; this is the first thing the product says to them, so an error boundary
 * here reads as "your money went somewhere and we don't know where". Confirming
 * is the honest answer to not knowing: the delivery is on its way, the receipt
 * is already in their inbox, and the page says so.
 */
const CONFIRMING: View = { state: { state: 'confirming', settled: false }, signedIn: false, lead: 'first', diagnosticOpen: true };

/**
 * The page's promise used to be a sentence in this comment — it never shows an
 * error — while six awaited calls could each defeat it, and one of them did in
 * production: a throw fell through to the error boundary on a session whose
 * payment had not been recorded. A promise has to be kept by the code, so every
 * call is taken through here.
 *
 * The throw is logged before the fall back, because the fallback is silent by
 * design and an hour of runtime logs is all this project keeps: without a line
 * of its own, the next occurrence leaves no trace at all.
 */
async function attempt<T>(call: string, run: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> {
  try {
    return { ok: true, value: await run() };
  } catch (err) {
    console.error(`[welcome] ${call} threw; showing confirming instead:`, err);
    return { ok: false };
  }
}

async function resolveView(sessionId: string | undefined): Promise<View> {
  const viewer = await attempt('getSession', getSession);
  if (!viewer.ok) return CONFIRMING;
  const signedIn = viewer.value !== null;

  const connected = await attempt('dbConnect', dbConnect);
  if (!connected.ok) return { ...CONFIRMING, signedIn };
  // No session id to read: the page was opened without one, which is not a
  // failure and is the same "on its way" screen.
  if (!sessionId) return { ...CONFIRMING, state: { state: 'confirming', settled: true }, signedIn };

  const resolved = await attempt('resolveWelcome', () => resolveWelcome(sessionId, viewer.value));
  if (!resolved.ok) return { ...CONFIRMING, signedIn };
  const state = resolved.value;
  if (state.state !== 'payer') return { ...CONFIRMING, state, signedIn };

  const opensAt = await attempt('diagnosticOpensAt', () => diagnosticOpensAt(state.studentId));
  if (!opensAt.ok) return { ...CONFIRMING, signedIn };
  const open = await attempt('openSession', () => openSession(state.studentId));
  if (!open.ok) return { ...CONFIRMING, signedIn };
  const firstTaken = await attempt('firstQuestionTaken', () => firstQuestionTaken(state.studentId));
  if (!firstTaken.ok) return { ...CONFIRMING, signedIn };

  return {
    state,
    signedIn,
    diagnosticOpen: opensAt.value === null || Date.now() >= opensAt.value.getTime(),
    lead: leadPanel({
      open: Boolean(open.value),
      // A payer has access; the notebook says so itself if the bank is empty.
      questions: true,
      access: 'ok',
      firstTaken: firstTaken.value,
      diagnosticTaken: opensAt.value !== null,
    }),
  };
}

/**
 * Stripe sends the payer here with the checkout session id. The page reads what
 * the webhook wrote for it and shows one of four states; it never shows an
 * error, and resolveView is what makes that true rather than hoped for.
 */
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  // The backstop, for what is not on the list above: reading the query, or
  // anything a later edit adds here.
  const params = await attempt('searchParams', () => searchParams);
  const sessionId = params.ok ? params.value.session_id : undefined;
  const view = params.ok ? await resolveView(sessionId) : CONFIRMING;

  return (
    <WelcomeView
      state={view.state}
      sessionId={sessionId ?? null}
      signedIn={view.signedIn}
      lead={view.lead}
      diagnosticOpen={view.diagnosticOpen}
    />
  );
}
