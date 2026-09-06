'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkWelcome } from './actions';
import { POLL_EVERY_MS, pollDue } from '@/lib/welcome';

/**
 * Asks every three seconds for a minute whether the fulfilment has landed,
 * and re-renders the page when it has. After the minute, or when there is
 * nothing to wait for, it says the receipt is in their email and nothing is
 * lost. No spinner.
 */
export function ConfirmingNote({ sessionId, settled }: { sessionId: string | null; settled: boolean }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (settled || !sessionId) return;
    const startedAt = Date.now();
    const timer = setInterval(async () => {
      if (!pollDue(startedAt, Date.now())) {
        clearInterval(timer);
        setTimedOut(true);
        return;
      }
      if ((await checkWelcome(sessionId)) === 'moved') {
        clearInterval(timer);
        router.refresh();
      }
    }, POLL_EVERY_MS);
    return () => clearInterval(timer);
  }, [sessionId, settled, router]);

  return (
    <p aria-live="polite" className="mt-3.5 border-l-3 border-margin bg-[#FFFDF6] px-3 py-2 text-[13px] leading-snug text-dim">
      {settled || timedOut
        ? 'Your receipt is already in your email — nothing is lost.'
        : 'This page will move on by itself. If it is still here in a minute, your receipt is already in your email — nothing is lost.'}
    </p>
  );
}
