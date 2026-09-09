import { dbConnect, Attempt, Payment, PracticeSession, Student } from '@/lib/db';
import { FREE_MODES, FREE_SESSIONS, hasAccess } from '@/lib/access';
import { SITTINGS, SITTING_IDS, sittingsOpenAt } from '@/lib/sittings';
import { grantAccess, revokeAccess } from './actions';
import { PaymentQueue } from './payment-queue';
import { loadQueue } from '@/lib/payment-queue';
import { DeleteAccount } from './delete-account';
import { Refusal } from '../../refusal';
import { CAPS, FIELD, INK, QUIET, ROW, SELECT } from '../ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Access — ExtraLesson admin' };

/** A pending fulfilment older than this needs a person: the webhook should have finished in seconds. */

/**
 * Who has paid, and who the webhook could not settle. Every grant is visible and
 * revocable here and an unmatched payment surfaces instead of vanishing, which
 * is what makes the automatic path safe (ROUND_2 §8c). What needs a person
 * comes first (ROUND_7 Task 3), then paid access, then the free allowance used.
 */
export default async function AccessPage({ searchParams }: { searchParams: Promise<{ find?: string; attention?: string; granted?: string; sitting?: string; ungranted?: string }> }) {
  const { find = '', attention, granted, sitting: grantedSitting, ungranted } = await searchParams;
  await dbConnect();
  const queue = await loadQueue();
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

  const ids = students.map((s) => s._id);
  const [sessionCounts, attemptCounts] = await Promise.all([
    PracticeSession.aggregate<{ _id: unknown; n: number }>([
      { $match: { student_id: { $in: ids }, mode: { $nin: FREE_MODES } } },
      { $group: { _id: '$student_id', n: { $sum: 1 } } },
    ]),
    Attempt.aggregate<{ _id: unknown; n: number }>([
      { $match: { student_id: { $in: ids } } },
      { $group: { _id: '$student_id', n: { $sum: 1 } } },
    ]),
  ]);
  const sessionsBy = new Map(sessionCounts.map((r) => [String(r._id), r.n]));
  const attemptsBy = new Map(attemptCounts.map((r) => [String(r._id), r.n]));

  const needle = find.trim().toLowerCase();
  const all = students
    .map((s) => ({
      ...s,
      id: String(s._id),
      sessions: sessionsBy.get(String(s._id)) ?? 0,
      attempts: attemptsBy.get(String(s._id)) ?? 0,
    }))
    .filter((r) => !needle || r.email.toLowerCase().includes(needle));
  const paidRows = all.filter((r) => hasAccess(r.access)).sort((a, b) => b.sessions - a.sessions);
  const usedRows = all.filter((r) => !hasAccess(r.access) && r.sessions >= FREE_SESSIONS).sort((a, b) => b.sessions - a.sessions);
  const freeRows = all.filter((r) => !hasAccess(r.access) && r.sessions < FREE_SESSIONS).sort((a, b) => b.sessions - a.sessions);
  const attentionOnly = attention === '1';
  const defaultSitting = sittingsOpenAt(new Date())[0] ?? SITTING_IDS[SITTING_IDS.length - 1];
  const paid = paidRows.length;

  return (
    <div>
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 font-mono text-xs text-dim">
            <span>
              <b className="text-ink">{paid}</b> with access ·{' '}
              <b className={queue.length > 0 ? 'text-red-pen' : 'text-ink'}>{queue.length}</b> payments needing attention ·{' '}
              <b className="text-ink">{usedRows.length}</b> free allowance used
            </span>
          </div>
          <form className="flex flex-wrap items-center gap-2" action="/admin/access">
            <input name="find" defaultValue={find} placeholder="find an email" className={FIELD} />
            <label className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-dim">
              <input type="checkbox" name="attention" value="1" defaultChecked={attentionOnly} /> attention only
            </label>
            <button className={CAPS}>Search</button>
          </form>
        </header>
        {ungranted && (
          <p className="mb-4 border-l-3 border-red-pen bg-red-tint px-3 py-2.5 font-mono text-[12px]">
            No account on <b className="break-all">{ungranted}</b> · nothing was granted. Search for the address they registered with.
          </p>
        )}
        {granted && (
          <p className="mb-4 border-l-3 border-green-pen bg-green-tint px-3 py-2.5 font-mono text-[12px]">
            Granted: <b className="break-all">{granted}</b> · {grantedSitting}
          </p>
        )}

        <PaymentQueue rows={queue} />

        

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

        

        {/* Always here, whatever the lists hold: an account is granted by its address,
            so a payment with no matching account has somewhere to go. */}
        <section className="mb-6 border-[1.5px] border-ink bg-white p-4">
          <div className="section-label">Grant access</div>
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-dim">
            By the address the student registered with, which need not be the address that paid.
          </p>
          <form action={grantAccess} className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <input name="email" type="email" required placeholder="the account's email" className={`${FIELD} w-full min-w-0 sm:w-auto sm:flex-1`} />
            <select name="sitting" defaultValue={defaultSitting} className={`${SELECT} w-full sm:w-auto`}>
              {SITTING_IDS.map((s) => (
                <option key={s} value={s}>
                  {SITTINGS[s].label}
                </option>
              ))}
            </select>
            <input name="note" required placeholder="comp · teacher · school · 2026-08-26" className={`${FIELD} w-full min-w-0 sm:w-auto sm:flex-1`} />
            <button className={`${INK} w-full text-sm sm:w-auto`}>Grant access</button>
          </form>
        </section>

        

        {([
          ['Paid access', paidRows],
          ['Free allowance used', usedRows],
          ['Free tier', attentionOnly ? [] : freeRows],
        ] as const).map(([title, list]) =>
          list.length === 0 ? null : (
            <div key={title}>
              <div className="section-label mt-6">{title} · {list.length}</div>
              <ul>
              {list.map((r) => (
          <li key={r.id} className={ROW}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="min-w-0">
                <div className="min-w-0 break-all font-mono text-[13px]">{r.email}</div>
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
                  free allowance used
                </span>
              ) : (
                <span className="font-mono text-[11px] uppercase tracking-widest text-dim">
                  free tier
                </span>
              )}
            </div>

            {r.access ? (
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] text-dim">
                  granted {new Date(r.access.granted_at).toISOString().slice(0, 10)} ·{' '}
                  {r.access.source}
                  {r.access.note ? ` · ${r.access.note}` : ''}
                </span>
                <form action={revokeAccess}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className={`${QUIET} text-red-pen`}>Revoke</button>
                </form>
              </div>
            ) : (
              // Stacked on a phone: three controls in one row left the note two letters wide.
              <form action={grantAccess} className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <input type="hidden" name="id" value={r.id} />
                <select name="sitting" defaultValue={r.exam_sitting} className={`${SELECT} w-full sm:w-auto`}>
                  {SITTING_IDS.map((s) => (
                    <option key={s} value={s}>
                      {SITTINGS[s].label}
                    </option>
                  ))}
                </select>
                <input
                  name="note"
                  required
                  placeholder="comp · teacher · school · 2026-08-26"
                  className={`${FIELD} w-full min-w-0 sm:w-auto sm:flex-1`}
                />
                <button className={`${INK} w-full text-sm sm:w-auto`}>Grant access</button>
              </form>
            )}
          </li>
              ))}
              </ul>
            </div>
          ),
        )}
        <DeleteAccount />
    </div>
  );
}
