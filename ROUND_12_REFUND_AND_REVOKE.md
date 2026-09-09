# ROUND 12 — REFUND AND REVOKE

The landing page promises a refund within `REFUND_DAYS` of paying. Nothing
in the product implements it. Today an operator refunds in Stripe and the
record still says the payment granted access — money returned, access
live, and no trace of either fact in the same place. That is the failure
R11 removed from every other payment path, left standing in the one path
that gives money back.

**Scope rule.** Six tasks, one commit each unless the task says otherwise.
Nothing here changes how access is assigned; it only adds the way it ends.
Task 0 is a prerequisite: nothing else may be built until it lands.

## The principle

Take back the entitlement, never the record.

- Access ends **immediately** on revocation. The money is gone; the
  service stops.
- The student's work is **untouched**. Every attempt, mark, read and
  dispute stays readable. They cannot start new sessions.
- Revocation is an **event, not a deletion**. The grant is ended with its
  reason, operator and time, and the previous note carried forward.
- The act is **idempotent**. Stripe is the truth on the money.
- It is **never automatic**. An operator approves, with a reason. The
  window governs what is agreed to; it never acts on its own. A status
  update arriving from Stripe never authorises a refund.

## Task 0 — The references a refund needs

Nothing here can run without these. One commit, additive, no behaviour
change. **Forward as well as backward:** every new payment and every new
grant writes these references from now on; the backfill only repairs the
past.

- `Payment` gains `payment_intent_id` and `paid_at` — the moment Stripe
  confirmed payment, which is **not** `received_at` (local receipt, and
  earlier than payment for a delayed method).
- `Access` gains `payment_id` on paid grants. A comp has none.
- Backfill both from Stripe for every existing payment, reporting each
  row it cannot resolve. The six `legacy:` keys are **not** Checkout
  Sessions and must be resolved by their event or left explicitly
  unresolvable — never treated as sessions.
- Legacy `access.payment_id` is resolved explicitly where the link is
  provable, and left null where it is not. **Never inferred from the
  student's latest payment.**
- A paid grant whose payment cannot be resolved is **not a comp**. It
  shows on the operator screen as *refund unavailable — no payment
  reference*, with the manual Stripe path as the way out.
- Report before writing, as R11's migration did.

## Task 1 — The states

`Payment` gains three, and carries Stripe's own refund status alongside:

| state | meaning | on the queue? |
|---|---|---|
| `refund_approved` | an operator approved; Stripe not called, or the outcome is unknown | yes — needs finishing |
| `refunded` | Stripe accepted the refund; access revoked | no |
| `refund_failed` | Stripe rejected it, or it failed after acceptance | yes — needs a person |

Reachable **only from `granted`, `waiting` or `duplicate`** — every paid
state. `waiting` and `duplicate` have no grant to revoke; refunding them
returns money and touches nobody's access.

`Payment` also stores `refund_id`, `refund_status` (Stripe's own) and
`refund_attempts[]`, each attempt carrying its idempotency key, when it
was made, and what came back.

**Two kinds of event, and they are not the same.** A *checkout* event
redelivered can never change refund state. A *refund-status* event can:
`succeeded` and `pending` are accepted (the operator approved; the money
is committed) and revoke; `failed` and `canceled` move the payment to
`refund_failed` and put it back on the queue. A status event never
authorises a refund that no operator approved.

**Status binds to the attempt, not to the payment.** A status event
updates the attempt it names, and moves the payment only if that attempt
is the one the payment currently rests on. A delayed failure from a
superseded attempt A never overwrites a succeeded attempt B, and an
older pending event never undoes a recorded failure.

`Access` gains `revoked_at`, `revoked_by`, `revoked_reason`. The grant is
ended, not erased: `hasAccess` reads a revoked grant as no access,
`grantFor` still returns it so the screen and the note history can show
what happened.

## Task 2 — Refund and revoke, in the safe order

One operation, called from one place:

```
refundAndRevoke(payment_id, operator, reason)
  -> 'done' | 'already-refunded' | 'unknown-outcome' | 'not-refundable'
```

**Order matters, and it is the opposite of `claim`.** The external act is
the irreversible one, so it may never be recorded as done before it has
happened — and never happen without a record that it was attempted.

1. **Approve, conditionally.** A single conditional write moves the
   payment to `refund_approved` and records the operator, the reason and
   a fresh **idempotency key for this attempt**. Only the winner of a
   race writes; a loser reads the existing approval and joins it. A crash
   here leaves an approved payment on the queue and no money moved.
2. **Recover before you create.** If the payment already has an attempt
   whose outcome is unknown, **list refunds for the payment intent
   first, paginating fully**. Match them to the recorded attempt by
   refund id, or by the attempt's key written into the refund's
   metadata.
   - Recover only an existing **pending or succeeded full** refund.
   - **Never** treat a failed, canceled or partial refund as proof this
     operation completed. A failed refund must not block the retry it
     was approved for, and a partial or dashboard-issued refund on the
     same intent is never adopted as ours.
   - An **empty result does not prove an in-flight request failed**:
     keep the same attempt and key while its outcome is unknown.
   - An idempotency key protects one attempt; Stripe may prune keys
     after at least 24 hours. It is not a durable handle — the refund
     id and the metadata are.
3. **Call Stripe** with this attempt's key, on `payment_intent_id`,
   writing that key into the refund's **metadata** so a later recovery
   can match this attempt rather than any refund on the intent.
4. **Complete, conditionally.** In one transaction, matched to that
   approval and that refund id: record the refund id and status, set the
   payment `refunded`, and end the grant **whose `payment_id` matches
   this payment**. Neither commits on failure. A completion that finds
   the work already done changes nothing, preserves the existing
   revocation, and sends no second email.

- **A timeout is `unknown-outcome`, never a failure.** The payment stays
  `refund_approved` on the queue; retrying recovers by step 2.
- A payment already refunded, locally or at Stripe, is
  `already-refunded`: revoke if not yet revoked, and record it.
- Stripe rejecting sets `refund_failed`. An operator-approved retry after
  a confirmed failure takes a **new** key — the old one is spent, and
  Stripe caches failures against it.
- A refund failing *after* acceptance (a later status event) moves the
  payment to `refund_failed` and back onto the queue. Access stays
  revoked; the operator decides what happens next.
- **Revocation is bound to the grant.** Only a grant whose `payment_id`
  is this payment is ended, checked inside the transaction. A grant with
  no `payment_id`, or another payment's, is never touched. That is how
  refunding an August payment cannot revoke a September purchase.
- A payment in no paid state returns `not-refundable`.

**Comps take a different action.** An admin grant with no payment gets
**Revoke** — reason, operator, time, no Stripe call. It is not this
operation.

**Email is not in the transaction.** One notification attempted after a
transition that actually happened — never on a no-op completion. A
`waiting` or `duplicate` refund's email says the money is on its way and
**never that access ended**, because none did. At-most-once, as in R11.

## Task 3 — Revocation actually stops a session

`hasAccess` alone does not enforce it: `canStartSession` allows the free
allowances and checks the diagnostic and first-question modes before it
looks at paid access, so a revoked student with an unused free session
would keep studying.

- An explicit revocation check runs **before** every allowance, **on the
  student, ahead of any sitting filter**. If a caller filtered through
  `grantFor` first, a sitting change would make the revoked grant vanish
  and the allowances reopen. Revocation survives a sitting change.
- A revoked student starts nothing: no session, no diagnostic, no first
  question.
- A session already in flight may be finished. Ending mid-question would
  destroy work that is theirs.
- History, progress and every marked question stay open, always.
- The refusal they meet is the paywall pattern, saying access ended and
  their work is still here.

## Task 4 — The operator's path

- **One row per payment.** An open refund request and a
  `refund_approved` or `refund_failed` state on the same payment are one
  row and one count, never two.
- A student's row with a live paid grant carries **Refund and revoke**
  with a required reason, stating what will happen: the money goes back,
  access ends now, their work stays. A comp's row carries **Revoke**. A
  paid grant with no payment reference says *refund unavailable* and
  points at Stripe.
- A `waiting` or `duplicate` row carries **Refund** — money back, no
  grant touched.
- Rows show days since `paid_at` against `REFUND_DAYS`; past the window
  it still works and the record notes the request came late.
- `refund_approved` and `refund_failed` rows sit on the queue with what
  is known and one control to finish or retry.
- Every row links to its payment in the Stripe dashboard.
- A refunded student appears under the paid list as revoked, with reason,
  operator and date — never silently absent.

## Task 5 — Asking is one tap, deciding is a person

**The student asks.** The account disclosure carries **Request a refund**
whenever the account holds a live paid grant. Tapping it writes a
`RefundRequest { student_id, payment_id, asked_at, state, resolved_at,
resolved_by, resolution_reason }` — one per payment, enforced — then opens
a prefilled mail to the help address so they can say why. The explanation
is optional: the policy says no questions asked. Ownership is enforced
server-side; a request can only be made for the signed-in student's own
payment.

**A payer who is not the student** has no account and no disclosure. The
help address remains the way in, as the offer already says. No verified
payer path is built.

**The operator decides in the app.** The request appears on the payments
queue with the student, the payment, the amount, and **`asked_at` minus
`paid_at`** against `REFUND_DAYS` — measured from when they asked, never
from when an operator got to it. It carries **Refund and revoke** with a
required reason, and **Dismiss** with a reason.

**A request resolves on successful completion of the refund, never on the
click.** A rejected or unknown refund leaves it outstanding. Dismissal
resolves it directly. The row and its resolution are kept.

**Not built:** a button that returns money without a person approving it.

## The window

`REFUND_DAYS` is one constant, default 14, read by the landing page,
`/refunds`, the FAQ and the operator screen. Changing it changes every
surface. It is a stated policy and never blocks the action.

## Gate

1. Refund a granted payment: one refund at Stripe, payment `refunded`,
   that grant ended, one email attempted, the work still readable.
2. **Stripe succeeds, then the process dies before the transaction:** the
   payment is `refund_approved`; the retry recovers the existing refund
   from the payment intent and finishes the revocation. **One refund.**
3. **Timeout calling Stripe:** `unknown-outcome`, payment stays
   `refund_approved` on the queue, nothing revoked, retry completes it.
4. **Concurrent refund clicks on one payment:** one approval, **one
   refund** — not necessarily one HTTP call — one email.
5. Stripe rejects: `refund_failed` with the reason, on the queue, nothing
   revoked; an approved retry uses a new key.
6. **A refund-status event reporting failure after acceptance:**
   `refund_failed`, on the queue, access stays revoked. A redelivered
   *checkout* event changes no refund state.
7. Crash inside the transaction: neither the state nor the grant changes.
8. **Refunding an old payment after a newer grant exists:** only the
   grant whose `payment_id` matches is ended; the newer one is untouched.
   A grant with no `payment_id` is never revoked by a refund.
9. A refunded payment redelivered by a checkout event: nothing granted,
   state unchanged.
10. **A revoked student with unused free sessions:** starts nothing — no
    session, no diagnostic, no first question — **and still nothing after
    changing sitting**. History and marked work still open. A session
    already in flight finishes.
11. Refund past `REFUND_DAYS`: works, and the record says it was late.
12. `already-refunded` for a payment already refunded locally or at
    Stripe; `not-refundable` only for a state that was never paid.
13. Refunding a `waiting` or `duplicate` payment: money returned, no
    grant touched anywhere, and the email never says access ended.
14. A comp: **Revoke** only, no Stripe call, no payment state change.
15. **An unauthorised refund request** — another student's payment — is
    refused server-side.
16. One request however many times it is tapped; it resolves only on a
    successful refund or an explicit dismissal, and a rejected refund
    leaves it outstanding.
17. **One row, one count** for a payment carrying both an open request
    and a refund state.
18. A concurrent completion of an already-completed refund: no second
    email, no overwritten history, revocation preserved.
19. **A failed earlier refund does not block an approved retry:**
    recovery does not adopt it, and the retry creates a new refund under
    a new key.
20. **A delayed failure event from a superseded attempt** leaves a
    succeeded refund and its revocation alone.
21. **An out-of-order pending event** does not undo a recorded failure.
22. **A partial or dashboard-issued refund on the same payment intent**
    is never adopted as this operation's refund.

## Kill list

No automatic refunds on any rule or schedule. No partial refunds. No
button that returns money without a person approving it. No deletion of
student work on revocation. No verified payer path.
