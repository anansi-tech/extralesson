'use server';

import { dbConnect } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { resolveWelcome } from '@/lib/welcome';

/**
 * One answer for the poll: keep waiting, or the page has somewhere to go.
 *
 * A POLL THAT FAILS IS "WE STILL CANNOT TELL", never an error. This runs every
 * three seconds against a reader who has just paid, and a rejected server action
 * takes the whole page to the error boundary — which tells them their money went
 * somewhere nobody can name. Confirming is the honest answer to not knowing, and
 * the next tick asks again.
 */
export async function checkWelcome(sessionId: string): Promise<'confirming' | 'moved'> {
  try {
    await dbConnect();
    const state = await resolveWelcome(sessionId, await getSession());
    return state.state === 'confirming' && !state.settled ? 'confirming' : 'moved';
  } catch (err) {
    console.error('[welcome] checkWelcome threw; the poll keeps waiting:', err);
    return 'confirming';
  }
}
