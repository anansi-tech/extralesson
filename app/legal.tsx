import Link from 'next/link';
import { Door } from './door';
import { LANDING } from '@/lib/landing-content';

/** Shared shell for /refunds, /privacy and /terms — the door, one card, different words. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <Door signedIn={false}>
      <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim underline underline-offset-[3px]">
        ← extralesson
      </Link>
      <h1 className="mt-4 text-2xl font-black leading-tight">{title}</h1>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-dim">
        Last updated {updated}
      </p>
      {/* Inside the card there are no rules to sit on: plain prose spacing, the section heading in the notebook's mono label. */}
      <div className="mt-6 text-sm leading-relaxed [&_h2]:mt-6 [&_h2]:font-mono [&_h2]:text-[11px] [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-[0.14em] [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
      <p className="mt-8 border-t-[1.5px] border-rule pt-4 text-[12px] text-dim">
        Questions about this page:{' '}
        <a href={`mailto:${LANDING.contactEmail}`} className="underline">
          {LANDING.contactEmail}
        </a>
      </p>
    </Door>
  );
}
