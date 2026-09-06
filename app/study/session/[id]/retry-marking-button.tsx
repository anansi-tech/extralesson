'use client';

import { useState, useTransition } from 'react';
import { retryMarking } from './capture';
import type { CaptureResult } from './mark-working';

/** Marks the stored text again. No photo is taken and nothing is re-read. */
export function RetryMarkingButton({ attemptId, onMarked }: { attemptId: string; onMarked?: (result: CaptureResult) => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-3.5 border-l-3 border-amber bg-[#FDF8EC] px-3 py-2.5 text-[13px] leading-snug lg:mt-4 lg:px-4 lg:py-3.5 lg:text-sm lg:leading-normal">
      <div className="lg:max-w-[58ch]">Marking did not finish. Your marks so far are unchanged, and what we read is kept.</div>
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
        className="mt-2.5 block min-h-11 w-full border-[1.5px] border-ink bg-white p-2.5 font-mono text-xs uppercase tracking-[0.1em] disabled:opacity-60 lg:mt-3 lg:w-auto lg:px-4"
      >
        {pending ? 'Marking…' : 'Try marking again'}
        <small className="mt-0.5 block font-mono text-[10px] normal-case tracking-[0.08em] text-dim">No new photograph — the same page is marked again</small>
      </button>
      {error && <p className="mt-1 text-red-pen">{error}</p>}
    </div>
  );
}
