'use client';

import { useEffect, useRef } from 'react';

/** Native details still owns toggling; dismissal never intercepts form actions. */
export function attachAccountDismissal(details: HTMLDetailsElement): () => void {
  const doc = details.ownerDocument;
  const outside = (event: PointerEvent) => {
    if (details.open && event.target instanceof Node && !details.contains(event.target)) {
      details.open = false;
    }
  };
  const escape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented || !details.open) return;
    details.open = false;
    // Do not send focus to the other, hidden copy of the responsive header.
    if (details.getClientRects().length) details.querySelector('summary')?.focus();
  };
  doc.addEventListener('pointerdown', outside, true);
  doc.addEventListener('keydown', escape);
  return () => {
    doc.removeEventListener('pointerdown', outside, true);
    doc.removeEventListener('keydown', escape);
  };
}

export function AccountDisclosure({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (ref.current) return attachAccountDismissal(ref.current);
  }, []);
  return <details ref={ref}>{children}</details>;
}
