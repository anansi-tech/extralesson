'use client';

import { useState, useTransition } from 'react';
import { disputeMark } from './dispute';

/** One tap per withheld row (ROUND_4 Task 3). Once noted, the button is gone. */
export function DisputeButton({
  attemptId,
  transcriptionId,
  code,
  noted,
}: {
  attemptId: string;
  transcriptionId: string;
  code: string;
  noted: boolean;
}) {
  const [done, setDone] = useState(noted);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <span className="block font-mono text-[11px] text-dim">
        Queried. A person will look before anything changes.
      </span>
    );
  }
  return (
    <span className="block">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await disputeMark({ attemptId, transcriptionId, code });
            if ('error' in res) setError(res.error);
            else setDone(true);
          })
        }
        className="min-h-11 font-mono text-[11px] uppercase tracking-widest text-red-pen underline disabled:opacity-60"
      >
        Query this mark
      </button>
      {error && <span className="ml-2 font-mono text-[11px] text-red-pen">{error}</span>}
    </span>
  );
}
