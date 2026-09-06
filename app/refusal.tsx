import Link from 'next/link';
import { startSession } from './study/actions';

export interface RefusalAction {
  label: string;
  small?: string;
  /** The paywall's is the only red one. */
  red?: boolean;
  href?: string;
  /** A session to start instead. */
  form?: { mode: string; topic?: string };
  newTab?: boolean;
  /** Something to do on this page, such as taking the photograph again. */
  onClick?: () => void;
  disabled?: boolean;
}

const QUIET = 'inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.14em] underline underline-offset-[3px]';

/**
 * ONE PATTERN FOR EVERY REFUSAL (ROUND_9 Task 4; Refusals.dc.html §05): the
 * label, one sentence, what remains true, one action, an optional quiet
 * link. Ink, never red — except the paywall's action — and never a cross.
 */
export function Refusal({
  id,
  label,
  sentence,
  remains,
  action,
  advice,
  quiet,
  children,
  className,
  amber = false,
  bare = false,
}: {
  id: string;
  label: string;
  sentence: React.ReactNode;
  remains?: React.ReactNode;
  action?: RefusalAction;
  /** One mono line under the action, such as how to hold the phone. */
  advice?: string;
  quiet?: { label: string; href: string };
  /** A failure: the label and the sentence on the amber bar — none of these costs a mark, so never red. */
  amber?: boolean;
  /** Already inside a card, such as the door's: no frame of its own. */
  bare?: boolean;
  /** Between what remains true and the action: the paywall's price. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section data-refusal={id} className={`${bare ? '' : 'border-[1.5px] border-ink bg-white p-5 shadow-[var(--shadow-panel)]'} ${className ?? ''}`}>
      {amber ? (
        <div className="border-l-3 border-amber bg-[#FDF8EC] px-3 py-2.5">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]">{label}</div>
          <p className="mt-2 text-sm leading-normal">{sentence}</p>
        </div>
      ) : (
        <>
          <div className="block pb-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] shadow-[0_1.5px_0_var(--margin)]">{label}</div>
          <p className="mt-3.5 text-[15px] leading-normal">{sentence}</p>
        </>
      )}
      {remains && <p className={`${amber ? 'mt-3' : 'mt-2'} text-[13px] leading-normal text-dim`}>{remains}</p>}
      {children}
      {action && <Action {...action} />}
      {advice && <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-dim">{advice}</p>}
      {quiet && (
        <div className="mt-[18px] border-t border-paper-deep pt-3">
          <Link href={quiet.href} className={QUIET}>{quiet.label}</Link>
        </div>
      )}
    </section>
  );
}

function Action({ label, small, red, href, form, newTab, onClick, disabled }: RefusalAction) {
  const className = red
    ? 'mt-[18px] block min-h-11 w-full bg-red-pen p-4 text-left text-[17px] font-black text-white shadow-[var(--shadow-card)]'
    : 'mt-4 block min-h-11 w-full border-[1.5px] border-ink p-3 text-left text-sm';
  const smallClass = red
    ? 'mt-1 block font-mono text-[10px] font-medium tracking-[0.1em] opacity-85'
    : 'mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-dim';
  const body = (
    <>
      {label}
      {small && <small className={smallClass}>{small}</small>}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={`${className} bg-white font-mono text-xs uppercase tracking-[0.1em] disabled:opacity-60`}>
        {body}
      </button>
    );
  }
  if (form) {
    return (
      <form action={startSession}>
        <input type="hidden" name="mode" value={form.mode} />
        {form.topic && <input type="hidden" name="topic" value={form.topic} />}
        <button className={className}>{body}</button>
      </form>
    );
  }
  return (
    <a href={href} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener' : undefined} className={className}>
      {body}
    </a>
  );
}
