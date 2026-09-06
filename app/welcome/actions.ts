'use server';

import { dbConnect } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { resolveWelcome } from '@/lib/welcome';

/** One answer for the poll: keep waiting, or the page has somewhere to go. */
export async function checkWelcome(sessionId: string): Promise<'confirming' | 'moved'> {
  await dbConnect();
  const state = await resolveWelcome(sessionId, await getSession());
  return state.state === 'confirming' && !state.settled ? 'confirming' : 'moved';
}
