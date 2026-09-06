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

/**
 * Stripe sends the payer here with the checkout session id. The page reads
 * what the webhook wrote for it and shows one of four states; it never
 * shows an error.
 */
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const viewer = await getSession();
  await dbConnect();
  const state: WelcomeState = session_id ? await resolveWelcome(session_id, viewer) : { state: 'confirming', settled: true };

  let lead: LeadPanel = 'first';
  let diagnosticOpen = true;
  if (state.state === 'payer') {
    const opensAt = await diagnosticOpensAt(state.studentId);
    diagnosticOpen = opensAt === null || Date.now() >= opensAt.getTime();
    lead = leadPanel({
      open: Boolean(await openSession(state.studentId)),
      firstTaken: await firstQuestionTaken(state.studentId),
      diagnosticTaken: opensAt !== null,
    });
  }

  return <WelcomeView state={state} sessionId={session_id ?? null} signedIn={viewer !== null} lead={lead} diagnosticOpen={diagnosticOpen} />;
}
