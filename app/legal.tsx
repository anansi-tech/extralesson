import Link from 'next/link';
import { LANDING } from '@/lib/landing-content';

/** Shared shell for /privacy and /terms — same page furniture, different words. */
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
    <main className="relative min-h-screen px-5 py-10">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-prose">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-widest text-dim underline">
          ← extralesson
        </Link>
        <h1 className="mt-4 text-2xl font-black leading-tight">{title}</h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-dim">
          Last updated {updated}
        </p>
        {/* Prose set to the notebook's own rhythm: line-height and every
            vertical gap are the rule spacing, so the lines sit ON the rules
            rather than under and through them. h2 picks up the shared section
            heading from globals.css — one definition, every page. */}
        <div className="on-rules mt-6 text-sm [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
        <p className="mt-8 border-t-[1.5px] border-rule pt-4 text-[12px] text-dim">
          Questions about this page:{' '}
          <a href={`mailto:${LANDING.contactEmail}`} className="underline">
            {LANDING.contactEmail}
          </a>
        </p>
      </div>
    </main>
  );
}
