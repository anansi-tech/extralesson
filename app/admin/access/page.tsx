import { dbConnect, Attempt, Payment, PracticeSession, Student } from '@/lib/db';
import { FREE_MODES, FREE_SESSIONS, REFUND_DAYS, hasAccess, isComp, type Access } from '@/lib/access';
import { dashboardSearchUrl, dashboardUrl, windowOf } from '@/lib/payment-queue';
import { refundPayment, revokeGrant } from './actions';
import { PaymentQueue } from './payment-queue';
import { loadQueue } from '@/lib/payment-queue';
import Link from 'next/link';
import { currentAccessOf, priorGrantsOf, revokedLineOf, type AccountRow, type StateWord } from '@/lib/admin/account-view';
import { grantControl } from '@/lib/admin/account-control';
import { AccountRows } from './account-rows';
import { DeleteAccount } from './delete-account';
import { GrantForm } from './grant-form';
import { Refusal } from '../../refusal';
import { CAPS, FIELD, QUIET } from '../ui';

export const dynamic = 'force-dynamic';

/** The window the changed list covers, said once. */
const CHANGED_WITHIN_DAYS = 7;
export const metadata = { title: 'Access — ExtraLesson admin' };

/** A pending fulfilment older than this needs a person: the webhook should have finished in seconds. */

/**
 * Who has paid, and who the webhook could not settle. Every grant is visible and
 * revocable here and an unmatched payment surfaces instead of vanishing, which
 * is what makes the automatic path safe (ROUND_2 §8c). What needs a person
 * comes first (ROUND_7 Task 3), then paid access, then the free allowance used.
 */
export default async function AccessPage({ searchParams }: { searchParams: Promise<{ find?: string; attention?: string; granted?: string; sitting?: string; ungranted?: string; noreason?: string; nositting?: string; show?: string }> }) {
  const { find = '', attention, granted, sitting: grantedSitting, ungranted, noreason, nositting, show } = await searchParams;
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
        access?: Access | null;
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
  // A revoked grant reads as no access, so it would drop into the free lists
  // and read as somebody who never paid. It stays here, said plainly.
  const onPaidList = (r: { access?: Access | null }) => hasAccess(r.access) || Boolean(r.access?.revoked_at);
  const paidRows = all.filter(onPaidList).sort((a, b) => b.sessions - a.sessions);
  const usedRows = all.filter((r) => !onPaidList(r) && r.sessions >= FREE_SESSIONS).sort((a, b) => b.sessions - a.sessions);
  const freeRows = all.filter((r) => !onPaidList(r) && r.sessions < FREE_SESSIONS).sort((a, b) => b.sessions - a.sessions);
  // The payment a grant was bought with, for the row that offers to refund it.
  const paymentOfGrant = new Map(
    (await Payment.find({ state: { $in: ['granted', 'refund_approved', 'refund_failed'] } }).select('paid_at payment_intent_id').lean<{ _id: unknown; paid_at?: Date; payment_intent_id?: string }[]>()).map((p) => [
      String(p._id),
      p,
    ]),
  );
  // WHO HAS EVER PAID US, whatever became of the record. A grant with no
  // payment reference on one of these accounts is a lost link, not a gift.
  const hasPaid = new Set((await Payment.distinct('student_id', { student_id: { $in: ids } })).map(String));
  const attentionOnly = attention === '1';

  const controlFor = (r: { id: string; email: string; access?: Access | null }) =>
    grantControl(r, r.access?.payment_id ? paymentOfGrant.get(String(r.access.payment_id)) : undefined, hasPaid.has(r.id));

  const wordFor = (r: (typeof all)[number]): StateWord =>
    r.access?.revoked_at ? 'revoked' : hasAccess(r.access) ? 'access' : r.sessions >= FREE_SESSIONS ? 'free used' : 'free tier';

  const toRow = (r: (typeof all)[number]): AccountRow => ({
    id: r.id,
    email: r.email,
    name: r.name,
    enteredFor: r.exam_sitting,
    sessions: r.sessions,
    attempts: r.attempts,
    word: wordFor(r),
    sitting: r.access?.sitting ?? r.exam_sitting,
    current: r.access ? currentAccessOf(r.access) : null,
    prior: r.access ? priorGrantsOf(r.access) : [],
    control: controlFor(r),
    revoked: r.access ? revokedLineOf(r.access) : null,
  });

  // CHANGED, NOT EVERYTHING. The operator arrives with work or with a name; a
  // list of every account at rest is neither. Access granted or ended in the
  // last week, and accounts that have just used their allowance up.
  const since = Date.now() - CHANGED_WITHIN_DAYS * 86_400_000;
  const recently = all
    .filter((r) => {
      const word = wordFor(r);
      if (word === 'access') return new Date(r.access!.granted_at).getTime() >= since;
      if (word === 'revoked') return new Date(r.access!.revoked_at!).getTime() >= since;
      if (word === 'free used') return new Date(r.created_at).getTime() >= since;
      return false;
    })
    .sort((a, b) => new Date(b.access?.revoked_at ?? b.access?.granted_at ?? b.created_at).getTime() - new Date(a.access?.revoked_at ?? a.access?.granted_at ?? a.created_at).getTime());

  const shown = show === 'access' ? paidRows.filter((r) => !r.access?.revoked_at) : show === 'free-used' ? usedRows : show === 'free-tier' ? freeRows : show === 'all' ? all : null;
  const listed = needle || attentionOnly ? all.filter((r) => !attentionOnly || wordFor(r) !== 'free tier') : (shown ?? recently);
  const heading = needle
    ? `Matching “${find.trim()}” · ${listed.length}`
    : shown
      ? `${show === 'access' ? 'With access' : show === 'free-used' ? 'Free allowance used' : show === 'free-tier' ? 'Free tier' : 'All accounts'} · ${listed.length}`
      : `Changed in the last ${CHANGED_WITHIN_DAYS} days · ${listed.length}`;

  const Count = ({ n, label, to }: { n: number; label: string; to: string }) => (
    <Link href={`/admin/access?show=${to}`} className="underline underline-offset-[3px]">
      <b className="text-ink">{n}</b> {label}
    </Link>
  );

  return (
    <div>
        <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <div className="font-mono text-xs text-dim">Access</div>
          <form className="flex flex-wrap items-center gap-2" action="/admin/access">
            <input name="find" defaultValue={find} placeholder="find an email" className={FIELD} />
            <label className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-dim">
              <input type="checkbox" name="attention" value="1" defaultChecked={attentionOnly} /> attention only
            </label>
            <button className={CAPS}>Search</button>
          </form>
        </header>

        {nositting && (
          <p className="mb-4 border-l-3 border-amber bg-amber-tint px-3 py-2 font-mono text-[11px] leading-relaxed">
            Nothing was granted: no sitting was chosen. Access ends with the sitting it is granted for, so it is never assumed.
          </p>
        )}
        {noreason && (
          <p className="mb-4 border-l-3 border-amber bg-amber-tint px-3 py-2 font-mono text-[11px] leading-relaxed">
            Nothing was granted: a grant needs a reason. A comp with no reason cannot be told from a mistake.
          </p>
        )}
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

        {/* THE WORK, FIRST AND ALWAYS OPEN. It carries the page's one card
            shadow, so the thing that needs deciding is the only thing that
            looks like work. */}
        <PaymentQueue rows={queue} />

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-dim">
          <Count n={paidRows.filter((r) => !r.access?.revoked_at).length} label="with access" to="access" />
          <Count n={usedRows.length} label="free allowance used" to="free-used" />
          <Count n={freeRows.length} label="free tier" to="free-tier" />
          <Count n={all.length} label="accounts" to="all" />
        </div>

        <div className="section-label mt-5">{heading}</div>
        <p className="mt-1 font-mono text-[11px] leading-relaxed text-dim">
          Open one to see its grant and the one thing you can do about it.
        </p>
        <AccountRows rows={listed.map(toRow)} empty={needle ? 'No account on that address.' : 'Nothing changed in the last week.'} />
        {!needle && !shown && (
          <Link href="/admin/access?show=all" className={`${QUIET} mt-2`}>
            All {all.length} accounts
          </Link>
        )}

        {/* AT THE FOOT, BEHIND A LINE EACH. Neither is the page's work: one is
            for when no account matched a payment, the other cannot be undone. */}
        <details className="mt-8 border-t border-rule pt-3">
          <summary className={`${CAPS} cursor-pointer`}>
            Grant access to an address <span className="font-normal text-dim">— when no account matched a payment</span>
          </summary>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-dim">
            By the address the student registered with, which need not be the address that paid.
          </p>
          <div className="max-w-prose text-[13px] leading-snug text-dim">
            <p className="mt-2"><b className="text-ink">Sale</b> — money arrived and the automatic path missed it. The reason is the Stripe event id.</p>
            <p className="mt-1"><b className="text-ink">Comp</b> — access given, nothing paid. The reason is who it&rsquo;s for and why.</p>
          </div>
          <GrantForm />
        </details>

        <details className="mt-3 border-t border-rule pt-3">
          <summary className={`${CAPS} cursor-pointer`}>
            Delete an account <span className="font-normal text-dim">— cannot be undone</span>
          </summary>
          <DeleteAccount />
        </details>
    </div>
  );
}

// GrantControls and CurrentAccess moved into account-rows.tsx and
// lib/admin/account-view.ts: a row builds its own blocks now (ROUND_13 Task 1).
