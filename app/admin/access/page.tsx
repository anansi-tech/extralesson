import { dbConnect, Attempt, Payment, PracticeSession, Student } from '@/lib/db';
import { FREE_SESSIONS, hasAccess } from '@/lib/access';
import { grantAccess, resolvePayment, revokeAccess } from './actions';
import { DeleteAccount } from './delete-account';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Access — ExtraLesson admin' };

const SITTINGS = [
  { value: 'may-june-2027', label: 'May/June 2027' },
  { value: 'jan-2027', label: 'Jan 2027 re-sit' },
] as const;

/**
 * WHO HAS PAID, and who the webhook could not settle on its own.
 *
 * A payment carrying an address that matches an account is granted
 * automatically; this screen is where the rest arrives — a typo'd address, a
 * payment made before the student registered, a refund, a comp. It is also the
 * fallback that makes the automatic path safe to run at all: every grant is
 * visible and revocable here, and an unmatched payment surfaces instead of
 * vanishing.
 *
 * The list is ordered by who is up against the free tier, because that is who
 * is waiting: a student who has used their free sessions and cannot start
 * another is the one whose payment needs matching now.
 */
export default async function AccessPage() {
  await dbConnect();
  const students = await Student.find()
    .sort({ created_at: -1 })
    .select('email name exam_sitting access created_at')
    .lean<
      {
        _id: unknown;
        email: string;
        name: string;
        exam_sitting: string;
        access?: { sitting: string; granted_at: Date; source: string; note?: string } | null;
        created_at: Date;
      }[]
    >();

  // Payments the webhook could not attach to an account. Recorded rather than
  // dropped: someone has paid, and this is the only place that says so.
  const unmatched = await Payment.find({ student_id: null, resolved_at: null })
    .sort({ received_at: -1 })
    .lean<
      { _id: unknown; event_id: string; email?: string; amount_total?: number; currency?: string; received_at: Date }[]
    >();

  const ids = students.map((s) => s._id);
  const [sessionCounts, attemptCounts] = await Promise.all([
    PracticeSession.aggregate<{ _id: unknown; n: number }>([
      { $match: { student_id: { $in: ids }, mode: { $ne: 'diagnostic' } } },
      { $group: { _id: '$student_id', n: { $sum: 1 } } },
    ]),
    Attempt.aggregate<{ _id: unknown; n: number }>([
      { $match: { student_id: { $in: ids } } },
      { $group: { _id: '$student_id', n: { $sum: 1 } } },
    ]),
  ]);
  const sessionsBy = new Map(sessionCounts.map((r) => [String(r._id), r.n]));
  const attemptsBy = new Map(attemptCounts.map((r) => [String(r._id), r.n]));

  const rows = students
    .map((s) => ({
      ...s,
      id: String(s._id),
      sessions: sessionsBy.get(String(s._id)) ?? 0,
      attempts: attemptsBy.get(String(s._id)) ?? 0,
    }))
    .sort((a, b) => {
      // Waiting first: no access, free tier used up.
      // Waiting means "has paid us nothing and cannot continue". An expired
      // sitting is not waiting on anyone — it ended on its own.
      const wait = (r: typeof a) => (r.access ? 2 : r.sessions >= FREE_SESSIONS ? 0 : 1);
      return wait(a) - wait(b) || b.sessions - a.sessions;
    });
  const waiting = rows.filter((r) => !r.access && r.sessions >= FREE_SESSIONS).length;
  const paid = rows.filter((r) => hasAccess(r.access)).length;

  return (
    <main className="ruled relative min-h-screen px-6 py-8">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 font-mono text-xs text-dim">
            <span>
              <b className="text-ink">{paid}</b> with access ·{' '}
              <b className={waiting > 0 ? 'text-red-pen' : 'text-ink'}>{waiting}</b> waiting
            </span>
          </div>
        </header>

        <p className="mb-3 max-w-prose text-[13px] leading-snug text-dim">
          Free tier is the diagnostic plus {FREE_SESSIONS} sessions. Match a Stripe payment to the
          email the student paid with, then grant. Nothing a student has already earned is ever
          hidden — the gate is on starting a new session.
        </p>
        {/* The note is the only evidence a grant has. The convention lives here
            because here is where notes are typed; the reasoning is ROUND_3 §3. */}
        <details className="mb-5 max-w-prose text-[13px] text-dim">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest">
            Note convention — first token is the class of grant
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre bg-white p-3 font-mono text-[11px] leading-relaxed">
{`stripe <event id>                         a sale
comp · teacher · <school> · <YYYY-MM-DD>  a teacher's own account
comp · pilot · <teacher> · <n of N>       a pilot seat
comp · other · <reason> · <YYYY-MM-DD>    anything else, reason required`}
          </pre>
          <p className="mt-2 leading-snug">
            The date is when the grant was <b>agreed</b>, not typed. A bare &ldquo;comp&rdquo; with
            no reason is not acceptable — six months on it is indistinguishable from a mistake.
            Teacher comps are granted on the <b>latest sitting</b> in the dropdown: a comp that
            quietly dies in July is a teacher telling other teachers the thing stopped working.
          </p>
        </details>

        {unmatched.length > 0 && (
          <section className="mb-6 border-[1.5px] border-red-pen bg-[#FDF1F0] p-3">
            <div className="section-label is-alert">
              {unmatched.length} payment{unmatched.length === 1 ? '' : 's'} with no matching account
            </div>
            <p className="mt-1 text-[12px] leading-snug">
              Someone has paid and the email does not belong to a student. Find the account they
              actually registered with and grant it below, or mark this resolved if it was a refund
              or a duplicate.
            </p>
            <ul className="mt-2 space-y-2">
              {unmatched.map((p) => (
                <li
                  key={String(p._id)}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-t border-dashed border-red-pen pt-2"
                >
                  <span className="font-mono text-[12px]">
                    {p.email ?? 'no email on the payment'}
                    <span className="ml-2 text-dim">
                      {typeof p.amount_total === 'number'
                        ? `${(p.amount_total / 100).toFixed(2)} ${(p.currency ?? '').toUpperCase()}`
                        : ''}{' '}
                      · {new Date(p.received_at).toISOString().slice(0, 10)} · {p.event_id}
                    </span>
                  </span>
                  <form action={resolvePayment}>
                    <input type="hidden" name="id" value={String(p._id)} />
                    <button className="min-h-11 font-mono text-[11px] uppercase tracking-widest underline">
                      Mark resolved
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        {rows.map((r) => (
          <section key={r.id} className="mb-3 border-[1.5px] border-ink bg-white p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-mono text-[13px]">{r.email}</div>
                <div className="font-mono text-[11px] text-dim">
                  {r.name} · {r.exam_sitting} · {r.sessions} session{r.sessions === 1 ? '' : 's'} ·{' '}
                  {r.attempts} question{r.attempts === 1 ? '' : 's'}
                </div>
              </div>
              {r.access && hasAccess(r.access) ? (
                <span className="font-mono text-[11px] uppercase tracking-widest text-green-pen">
                  access · {r.access.sitting}
                </span>
              ) : r.access ? (
                <span className="font-mono text-[11px] uppercase tracking-widest text-dim">
                  expired · {r.access.sitting}
                </span>
              ) : r.sessions >= FREE_SESSIONS ? (
                <span className="font-mono text-[11px] uppercase tracking-widest text-red-pen">
                  waiting
                </span>
              ) : (
                <span className="font-mono text-[11px] uppercase tracking-widest text-dim">
                  free tier
                </span>
              )}
            </div>

            {r.access ? (
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t border-dashed border-paper-deep pt-2">
                <span className="font-mono text-[11px] text-dim">
                  granted {new Date(r.access.granted_at).toISOString().slice(0, 10)} ·{' '}
                  {r.access.source}
                  {r.access.note ? ` · ${r.access.note}` : ''}
                </span>
                <form action={revokeAccess}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="min-h-11 font-mono text-[11px] uppercase tracking-widest text-red-pen underline">
                    Revoke
                  </button>
                </form>
              </div>
            ) : (
              <form
                action={grantAccess}
                className="mt-2 flex flex-wrap items-center gap-2 border-t border-dashed border-paper-deep pt-2"
              >
                <input type="hidden" name="id" value={r.id} />
                <select
                  name="sitting"
                  defaultValue={r.exam_sitting}
                  className="min-h-11 border-[1.5px] border-ink bg-white px-2 font-mono text-base"
                >
                  {SITTINGS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <input
                  name="note"
                  required
                  placeholder="comp · teacher · school · 2026-08-26"
                  className="min-h-11 min-w-0 flex-1 border-[1.5px] border-ink px-2 font-mono text-base"
                />
                <button className="min-h-11 bg-ink px-3 font-mono text-[11px] uppercase tracking-widest text-paper">
                  Grant access
                </button>
              </form>
            )}
          </section>
        ))}
        <DeleteAccount />
      </div>
    </main>
  );
}
