'use client';

import { useState, useTransition } from 'react';
import { requestRefund } from './actions';

/**
 * ONE TAP (ROUND_12 Task 5): the request is recorded, then the mail opens so
 * they can say why if they want to. The record is what an operator acts on,
 * so it is written first and the mail is a convenience on top of it — if the
 * mail never opens, the request still exists.
 */
export function RequestRefundButton({ paymentId, className }: { paymentId: string; className: string }) {
  const [pending, start] = useTransition();
  const [asked, setAsked] = useState(false);
  if (asked) {
    return <span className="mt-2 block font-mono text-[11px] normal-case tracking-normal text-dim">Asked. A person will look at it.</span>;
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await requestRefund(paymentId);
          if (!res.ok) return;
          setAsked(true);
          if (res.mailto) window.location.href = res.mailto;
        })
      }
      className={className}
    >
      Request a refund
    </button>
  );
}
