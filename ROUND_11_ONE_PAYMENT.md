# ROUND 11 — ONE PAYMENT

Money and access are tracked in three places that disagree: `Payment`,
`Fulfilment`, and the student's `access` object. The operator screen reads
one and the actions write another, so a payment can be resolved and still
sit in the queue, be listed twice and counted twice, be closed and granted
again, or be granted successfully and then recorded as a duplicate. None of
that is a UI problem. There is one question — *what happened to this
money?* — and it must have one answer, in one record. The queue is the
subset of that record with an obligation still outstanding; it is derived,
never stored.

**Scope rule.** Six tasks. Most are one commit; where the task says two, it
is two. Nothing else ships until the gate in Task 6 passes. This is the
last round before the pilot.

**Before Task 1.** Confirm the MongoDB deployment supports multi-document
transactions (a replica set or Atlas, not a standalone). Task 2 requires
one. If it does not, stop and say so — that is a blocker, not something to
discover mid-build.

**Rollout order.** Every push deploys, so nothing may read a field that
production rows do not have yet. Task 1 is **additive only**: the new
fields are written alongside the old ones, `Fulfilment` stays, and the
existing readers keep working. The queue switches to `Payment.state`, and
`resolved_at` and `Fulfilment` are removed, **only after Task 5's
migration is verified**.

Tasks 2–4 may be implemented before migration but activate only at the
verified cutover. During migration, every active writer maintains both
representations consistently — not only on creation. The backfill is
restartable and conditional: it must never overwrite a newer live
transition. Run the complete gate before deploying the cutover. Remove
legacy writers and readers before dropping `Fulfilment`.

## The model

**One Payment per Checkout Session**, uniquely keyed by `session_id`. An
event id identifies a *delivery*, not a payment; Stripe redelivers, and a
redelivery must find the same row.

A payment is in exactly one state:

| state | meaning | on the queue? |
|---|---|---|
| `pending` | ours, but Stripe has not confirmed payment | no |
| `waiting` | paid; no account holds it yet | yes — Grant to this account · Close |
| `duplicate` | that account's sitting was already covered | yes — Close (refunded) |
| `granted` | access assigned | no |
| `closed` | settled by a person without granting | no |
| `refused` | not ours: another product, or not a payment | no |

`duplicate` staying on the queue until Close is the model, not an
exception: it is a state with an obligation, like `waiting`. Nobody should
"fix" it later.

`pending` is a delayed payment method — the session completed unpaid.
`async_payment_succeeded` transitions that same row `pending -> waiting`,
then the claim runs. `refused` means only "not ours" and is terminal.

`Student.access` remains the entitlement. The payment's state records what
happened to the money. Nothing else stores either.

**Every transition is conditional.** Not only the claim:

- Close transitions `waiting` or `duplicate` -> `closed` and nothing else,
  so a stale form cannot close a payment that has since been granted.
- A webhook delivery never regresses an existing state: a late unpaid
  event cannot overwrite a confirmed payment.
- A missing or invalid student email never moves an unpaid session to
  `waiting`. Payment confirmation comes first, always.

## Task 1 — The record, additive

One commit. Nothing changes what any existing reader sees.

- `Payment` gains `session_id`, `state`, `state_reason`, `state_at`,
  `closed_by`. `resolved_at` stays. `Fulfilment` stays.
- `session_id` uses a **partial unique index covering populated values**
  during migration: existing rows have none, and a full unique index
  would either reject them or collide on their absence. The field
  becomes required with a full unique index only after every row is
  resolved, in Task 5's second commit.
- New payments are written with both the new state and the old fields.
- `/admin/access` is untouched in this task.

## Task 2 — One claim, one transaction

Every path that assigns access from a payment — webhook, registration,
admin grant against a payment — calls one operation:

```
claim(session_id, student) -> 'granted' | 'duplicate' | 'not-claimable'
```

- **One database transaction.** Read the payment's state and the student's
  current entitlement, then commit the Payment transition and
  `Student.access` **together**. A failure commits neither. There is no
  ordering in which a crash leaves access without its record, or a record
  without its access.
- A conditional update on Payment alone protects one payment; it does not
  protect two payments racing for one account. The transaction must
  serialize claims **for the same student**, so exactly one grants and any
  other becomes `duplicate`.
- A payment not in `waiting` is never granted from, whatever the caller.
  `granted`, `closed` and `refused` are terminal.
- If the student already holds a live grant for their sitting, the claim
  returns `duplicate`, writes no access, and leaves the existing grant and
  its note untouched.
- Registration claims every waiting payment for its address, oldest first:
  the first `granted`, any others `duplicate`.
- **Comps have no payment.** An admin grant with no session takes its own
  path and never touches payment state. Its note convention is unchanged.

**Ordering rule for the race:** the webhook persists the Payment *before*
looking up the Student; registration persists the Student *before*
querying waiting payments. Both then call `claim` on fresh reads. One side
may legitimately find nothing; the ordering guarantees that **both sides
cannot miss each other**.

**Email is not in the transaction.** Nothing atomically commits a database
write and an external send. One notification per successful claim, sent
after commit. A crash between commit and send loses the notification, not
the access — that is at-most-once, and it is the accepted limit.

## Task 3 — The student email, honestly

- Read the Payment Link's **named** student-email custom field by its key,
  not "any custom text containing @".
- Validate it. **No fallback to the payer address, ever.** A missing or
  invalid student field on a *paid* session leaves the payment `waiting`
  with `state_reason: 'no valid student email on the session'`. On an
  unpaid session it stays `pending`.
- `email_source` and the "payer address" grant note go with it.
- A valid but wrong address is indistinguishable from an unregistered one
  and stays `waiting`; the welcome page shows the address in full so the
  payer catches it themselves.

## Task 4 — The queue and the welcome page

- `/admin/access` reads Payment alone. One list, "Payments that need you",
  holding `waiting` and `duplicate` only. One counter. No payment appears
  twice, and nothing links away.
- Each row displays its state, the full student email — or
  **missing/invalid** where there is none — the amount and the currency,
  alongside its controls.
- Each row carries its own controls.
  - `waiting`: an address field and **Grant to this account**; **Close**
    with a required reason.
  - `duplicate`: **Close (refunded)**, required reason. The copy says the
    refund happens in Stripe — this button moves no money.
- Closing records reason, operator and time; the row leaves the queue.
- Granting to an account whose sitting is already covered moves the row to
  `duplicate`; it stays until closed.
- A payment whose processing failed stays `waiting` with its reason until
  it is granted or explicitly closed. A successful retry removes the row.
- **`/welcome` reads Payment, not Fulfilment**, and once the payment is
  `granted` it resolves the account by the payment's `student_id`, not by
  the address originally paid with. A corrected typo must produce the
  right welcome state.

## Task 5 — Migration, then deletion

**Two commits.** Migrate and verify first; drop nothing until it passes.

Derive each existing Payment's state by explicit precedence, never by
whether a student happens to hold access:

1. `resolved_at` set -> `closed`, carrying its reason and operator.
2. Fulfilment `duplicate` -> `duplicate`.
3. Fulfilment `refused` -> `refused`, **except** where the reason is
   not-paid, which maps to `pending`. A delayed payment must not be
   stranded in a terminal state.
4. Fulfilment `granted` -> `granted`.
5. Fulfilment `pending` means unfinished processing, not unpaid ->
   `waiting`.
6. Otherwise -> `waiting`.

Also migrate **Fulfilment-only records with no Payment** — a refused
session may never have written one. `session_id` comes from the
Fulfilment. Preserve operator information where it exists; never invent
it.

Report counts per state, every payment with no Fulfilment to link to, and
every ambiguous case, **by id, before running against production**.
Ambiguous cases block deletion.

Only after the counts are checked and the screen reads correctly does the
second commit switch the readers, remove `resolved_at`, and drop
`Fulfilment` and its reconciliation paths.

## Task 6 — The gate

All must pass before anything else ships:

1. **Retry** — the same event twice, and a different event for the same
   session: one Payment, one grant, one email.
2. **Concurrent registration** — the interleavings forced, not
   `Promise.all`: webhook-then-registration, registration-then-webhook,
   and two registrations at once. Exactly one grant, no payment claimed
   twice, no window where both miss.
3. **Two payments, one student** — different payments claiming the same
   account concurrently: one `granted`, the other `duplicate`.
4. **Close racing a claim** — an admin Close and a claim on the same
   payment at once: one wins, the other is refused, no access written by
   the loser.
5. **Duplicate charge** — a second payment for a covered sitting: no
   access written, original grant and note intact, row `duplicate`.
6. **Closed replay** — a closed payment redelivered: nothing granted,
   state unchanged. Same for `refused` and `granted`.
7. **Delayed payment** — `completed` unpaid writes `pending`;
   `async_payment_succeeded` moves the same row to `waiting` and claims.
8. **Crash between the two writes** — simulated failure inside the
   transaction leaves neither the state nor the access changed.
9. One test that no payment appears in two lists or is counted twice.

## Kill list

No refund automation. No new admin screens. No exactly-once email
machinery. No schema for multiple live grants.
