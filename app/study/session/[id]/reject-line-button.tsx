'use client';

import { useState, useTransition } from 'react';
import { rejectLine } from './reject-line';

/** One tap per read line, while the read is unmarked (ROUND_5 Task 2). */
export function RejectLineButton({
  transcriptionId,
  lineIndex,
  onRejected,
}: {
  transcriptionId: string;
  lineIndex: number;
  onRejected: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="ml-2 inline-flex items-center">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await rejectLine({ transcriptionId, lineIndex });
            if ('error' in res) setError(res.error);
            else onRejected();
          })
        }
        className="min-h-11 font-mono text-[10px] uppercase tracking-widest text-dim underline disabled:opacity-60"
      >
        Not what I wrote
      </button>
      {error && <span className="ml-2 font-mono text-[10px] text-red-pen">{error}</span>}
    </span>
  );
}
