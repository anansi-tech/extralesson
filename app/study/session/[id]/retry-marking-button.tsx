'use client';

import { useState, useTransition } from 'react';
import { retryMarking } from './capture';
import type { CaptureResult } from './mark-working';

/** Marks the stored text again. No photo is taken and nothing is re-read. */
export function RetryMarkingButton({ attemptId, onMarked }: { attemptId: string; onMarked?: (result: CaptureResult) => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-2 border-l-3 border-[#D9A62E] bg-[#FDF8EC] p-2 text-[12px] leading-snug">
      Marking did not finish. Your marks so far are unchanged, and what we read is kept.
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await retryMarking({ attemptId });
            if ('error' in res) setError(res.error);
            else if (onMarked) onMarked(res);
            else window.location.reload();
          })
        }
        className="mt-2 block min-h-11 w-full border-[1.5px] border-ink bg-white p-2 font-mono text-xs uppercase tracking-widest disabled:opacity-60"
      >
        {pending ? 'Marking…' : 'Try marking again'}
      </button>
      {error && <p className="mt-1 text-red-pen">{error}</p>}
    </div>
  );
}
