'use client';

import { useEffect } from 'react';
import { Door } from './door';
import { Refusal } from './refusal';

/**
 * The error boundary on the door (ROUND_9 Task 7; Refusals.dc.html §09).
 * The error goes to the console for us; the student sees no code they
 * cannot use, and the one thing to do is try again.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Door signedIn={false}>
      <Broken reset={reset} />
    </Door>
  );
}

export function Broken({ reset }: { reset: () => void }) {
  return (
    <Refusal
      id="broken"
      amber
      bare
      label="Something went wrong on our side"
      sentence="Not your phone and not your connection."
      remains="Every mark you have earned is saved. Nothing you did is affected."
      action={{ label: 'Try again', onClick: reset }}
      quiet={{ label: 'Go to your notebook', href: '/study' }}
    />
  );
}
