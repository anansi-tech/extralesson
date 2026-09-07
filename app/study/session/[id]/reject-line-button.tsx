'use client';

import { useState, useTransition } from 'react';
import { rejectLine, restoreLine } from './reject-line';

/** One tap per read line, and one tap back, while the read is unmarked (ROUND_5 Task 2; ROUND_7 Task 2). */
export function RejectLineButton({
  transcriptionId,
  lineIndex,
  rejected,
  onToggled,
}: {
  transcriptionId: string;
  lineIndex: number;
  rejected: boolean;
  onToggled: (rejected: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="inline">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = rejected ? await restoreLine({ transcriptionId, lineIndex }) : await rejectLine({ transcriptionId, lineIndex });
            if ('error' in res) setError(res.error);
            else onToggled(!rejected);
          })
        }
        className="-my-1.5 ml-2 inline-block px-1 py-1.5 align-baseline font-mono text-[10px] text-dim underline underline-offset-2 disabled:opacity-60"
      >
        {rejected ? 'Put it back' : 'Not what I wrote'} — line {lineIndex + 1}
      </button>
      {error && <span className="ml-2 font-mono text-[10px] text-red-pen">{error}</span>}
    </span>
  );
}
