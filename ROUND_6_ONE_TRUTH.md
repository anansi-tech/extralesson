# ROUND 6 — ONE TRUTH

An external audit (5 Sep, code `d01a159`) put an isolated database under the
product and found what reading the code did not: three surfaces compute a
student's marks three ways, a marking failure is stored as a finish, an
unreadable photo lowers the score, two submits can both land, and a payment
for a different Anansi product can grant access here. None of it is a design
problem. All of it is the design not being enforced.

**Scope rule.** Eight tasks, in order. Launch the day task 8 merges. Nothing
found along the way is added; it goes on the list at the bottom. This is the
last round before a student, and after it the only source of information is a
student.

**Standard.** A student can tell what was read, what was assessed, what was
earned, what is uncertain, and what to do next. Every task serves one of
those five.

## Task 1 — One score fold

A rubric row on an attempt is in exactly one of three states: **awarded**,
**withheld**, **unassessed**. Today "a read exists" stands in for "every row
was judged", so an illegible photo turns unassessed rows into withheld ones
and the denominator grows. A marker failure stores `marker_version` on an
empty decision list and is treated as complete.

- `lib/study/outcome.ts`: one pure function `attemptOutcome(attempt, read?)`
  → per-row state, earned, assessed-of, unassessed count. Every consumer
  calls it: question card, session summary (both modes), history, progress,
  mastery fold, revisit/mistakes, reviewable list, admin. No surface sums
  `profile_marks` on its own again.
- Denominator is marks **assessed**. Unassessed rows are shown as such on
  the card ("could not be assessed from this photo") and never as lost.
- `markWorking`: a model failure persists `marking: { status: 'failed',
  reason, ts }` and no `marker_version`. The transcript and deterministic
  marks stand. The card offers "Try marking again" over the stored text —
  no new photo, no new read. Success validates exactly one decision per
  requested row; missing, duplicate or unknown codes are a failure, not a
  partial result.
- Regression tests as behaviour, not source strings: the audit's
  unreadable-photo case (5/5 stays 5/5 assessed, 3 unassessed); a marked row
  appears in the summary and not in revisit losses; a timeout is retryable.
  Delete `tests/read-scored.test.ts`'s source-string assertions.

## Task 2 — Payment is scoped and recoverable

The Stripe account is shared across Anansi products. The webhook grants on
any signed `checkout.session.completed`.

- Accept only sessions whose `payment_link` is in the ExtraLesson allowlist,
  `mode === 'payment'`, `payment_status === 'paid'`. Anything else is logged
  and acknowledged, never granted.
- Two records, not one: `StripeEvent { id, received_at }` for idempotency;
  `Fulfilment { session_id, email, status: pending|granted|failed, ts }` for
  the grant. A retry on a failed grant retries the grant. Duplicate-key
  errors are duplicates; every other write error is a failure.
- Test: a Cognicare session is refused; a delayed-payment session is held
  until `paid`; a grant failure is retried on the next delivery.

## Task 3 — Admin identity and rate limits

- Admin accounts are provisioned by script with a verified email, never by
  public registration. Registering an allowlisted address through the
  public form creates a student, not an admin. Test it.
- Login, reset-request, reset-confirm, and `readWorking` are rate-limited
  per account and per IP with a small in-process token bucket; no Redis.
- A password reset invalidates existing sessions (session secret version on
  the student, checked on every request).
- Sign-in returns one message for unknown, legacy and wrong-password.
- `pnpm audit --prod`: assess the six high advisories for reachability;
  apply patched versions where supported; record the rest with the reason.

## Task 4 — Attempts and reads are unique

- Unique index `{ session_id, question_index }` on Attempt. A second submit
  returns the existing attempt's outcome; it never inserts.
- `readWorking` reserves its take (insert the Transcription shell first,
  unique on `{session_id, question_index, take}`) before the model call, so
  a concurrent read fails on the index and spends nothing.
- Free-session and first-mode gates use the same insert-first pattern.
- Concurrent tests: two submits, two reads, two first-sessions, in
  parallel; exactly one of each lands.

## Task 5 — The first minute, and the dashboard

- `/study/login` shows **Create account** and **Sign in** as two explicit
  actions. Arriving from "Mark one question free" opens Create account with
  the free question named. The unknown-email-flows-to-registration path is
  deleted.
- Dashboard: remove the "What we cover" block entirely. Remove the
  trajectory line. The overall estimate shows only when every target module
  has ≥ 35 assessed marks; otherwise "N of 35 marks seen" per module.
- Landing: "a similar question straight away" → say what the code does
  (revisit after three days), or make revisit immediate — pick the copy.

## Task 6 — Mastery attributes per slot

`mastery/fold.ts` gives a question's whole fraction to every objective it
lists and counts unseen objectives as zero.

- Attribute per slot via `slot.objective_id`. A student who got (a) right
  and (b) wrong moves the two objectives in opposite directions.
- Unseen is unknown, not zero: mastery is over seen objectives; steering
  treats unseen as high-leverage, not weak.
- `predict.ts`: `coverage` either changes the arithmetic or is removed from
  the signature. Cutoffs stay assumed and say so in one comment.

## Task 7 — The gate is a gate

- `eval-marker.ts` and `eval-reads.ts` exit nonzero below the bar or when a
  golden file is missing. Results are written with the model id, prompt
  hash, rubric version and commit.
- Reading exactness counts omitted truth lines against the reader.
- One composition test through the production path: photo → `readWorking`
  → `markWorking`, on the five committed calibration pages, reported
  separately from the isolated marker score.
- Golden export matches the image to the disputed transcription's take,
  not the attempt's latest. Field export defaults to text; `--with-image`
  is explicit, and `design/golden/field/README.md` states retention: images
  deleted on account deletion (`erase` walks the directory) and after 90
  days by a listed command.

## Task 8 — Small and real

- `Transcription` schema gains `usage.marking_input/output`, drawing usage,
  and the model id per call; `readingCost` totals all three and says which
  are present.
- Adaptive and topic modes exclude question ids attempted in the last 14
  days; deterministic tie-break.
- `dbConnect` clears a rejected promise so a warm process recovers.
- Attempt stores a rubric hash alongside the fingerprint; history and
  progress render the rubric the attempt was marked against.
- Docs: `AGENTS.md` matches `CLAUDE.md` or is deleted; README points at
  R6 and current commands; one-off repair scripts move to `scripts/done/`.

## Kill list, this round

No second provider. No teacher surface. No correction events (see below).
No new question types. No marker prompt changes. No landing redesign.

## After the pilot — written down so it stays out

- Human correction event, folded through `attemptOutcome`, and an
  attempt-level report when no row verdict exists. First thing after the
  pilot.
- Second vision/marking provider.
- A genuinely short authored starter question for `'first'`.
- Teacher digest.
