# ROUND 9 — EVERY DOOR

R8 gave the signed-in student the notebook. Nine doors into and around
it were never drawn: the landing, the footer, sign-in, the page a payer
lands on after paying, the paywall and its six sibling refusals, the
diagnostic, the end of a session, the emails, the failures, and the icon.
Claude Design drew them (`design/ui/`, five new files). This round builds
them.

**One rule above every design file.** Layout, order, spacing and states
come from the design file. **Words come from the repo** — `landing-
content.ts`, the R7 decisions, the fold's own labels. Where a design file
carries copy the product retired, or asserts behaviour the product doesn't
have, the file is wrong and this document says what's true. Claude Code
notes every such departure in the commit.

**Scope rule.** Nine tasks, in order. Admin is R10. Launch sequence begins
the day task 8 merges.

## Task 1 — Welcome after purchase

Stripe's Payment Link redirects to `/welcome?session_id={CHECKOUT_SESSION_ID}`.
The page reads the `Fulfilment` the webhook wrote for that session and
renders one of four states from `Auth and Welcome.dc.html` §04:

- **Confirming** — no fulfilment yet. The design's copy. Polls every 3 s
  for up to 60 s, then says the receipt is in their email and nothing is
  lost. No spinner theatre.
- **Signed in as the payer** — the fulfilment's email is the session's
  student. "You're in." Access line with sitting. Primary: whatever
  `leadPanel` would show (first question if untaken, else notebook).
- **Not yet registered** — no account on the fulfilment's email. "Payment
  received. The access is waiting on <email>." Primary: Create the account,
  email pre-filled and locked.
- **Bought for someone else** — signed in as a different account, or not
  signed in and the email has an account. Copy: "Access is on <email>,
  running to <sitting>. Whoever sits the exam creates their account with
  that address, or signs in if they have one." No claim that we emailed
  anyone. The design's "how you will know it is working" paragraph stays;
  its pronouns go.

Email is shown masked except to the signed-in owner. Refused or failed
fulfilments show the confirming state's fallback line, never an error.
Tests for all four states and the poll timeout.

## Task 2 — Landing and footer

Layout and order from `Landing.dc.html` §01: hero → stakes tiles → marked
page → how it works → founder → offer → FAQ → closing CTA → footer.
**Every word from `landing-content.ts` as it stands after R7 and R8.** The
design file's hero, 84%, 38%, MARKS/WHY/NEXT, "fifteen minutes", "predicted
grade from day one", "similar question immediately" and "CXC examiner" do
not exist and are not built. The stakes are the R8 tiles. Signed-out nav:
lockup, Sign in.

Footer, §02, on every page including the app: mark, Help (mailto),
Refunds, Privacy, Terms, "An Anansi Technology product · Miami,
Florida", and "ExtraLesson is not affiliated with or endorsed by the
Caribbean Examinations Council." Refunds, Privacy and Terms are real
pages in the notebook system if they exist; if any doesn't, it is written
now, short, and true.

## Task 3 — Sign in, create account, reset

Layout from `Auth and Welcome.dc.html` §03: one 576px card on the paper,
errors above the field, the alternative route a quiet link. **Passwords
stay.** Sign in is email + password; create account is email, password,
sitting; reset is email → "check your email" → new password. The design's
magic-link copy is not built. States: error (one plain sentence), rate-
limited (the design's copy with the real window), reset-sent (sender is
`RESEND_FROM`). Arriving from the free button opens Create account with
the free question named above the form.

## Task 4 — Refusals

The four-part pattern from `Refusals.dc.html` §05, exactly: label · one
sentence · what remains true · one action · optional quiet link. Amber or
ink, never red; never "sorry"; never the cross. Applied to all seven:

- **Paywall** — the only red action. Copy names the real boundary: the
  free question, the diagnostic and two free sessions are used. $49,
  one payment, runs to the sitting. Secondary: read your marked work.
- Sitting passed · no retakes left · module not open · nothing to revisit
  · question handed in · not covered — as drawn, with these changes:
  "not covered" quotes no numbers unless they come from the coverage
  computation at render; "no retakes" reflects the live take count.

## Task 5 — Diagnostic

`Diagnostic and Summary.dc.html` §06. Intro with the three facts (about
12 minutes, nothing scored, tap not paper) and the real question count.
MCQ card with "I don't know" at full option weight. "Stop here — keep what
I've answered" only if a partial diagnostic ranks today; if it doesn't,
the button is not built and the intro doesn't promise it. Ranked finish as
drawn, with the marks figures from the leverage computation and the
"no grade yet" line.

## Task 6 — Session summaries

§07. One skeleton — marks, the questions in a row, one line of what moved,
one action. Four claims: first (no trend), adaptive (trend on the same
topic where one exists, else none), revisit (recovered / still going per
objective from the fold), diagnostic (no marks, the ranking). **Not
built:** "Remind me at 7 PM" (no reminders exist), "upper III" (no
sub-bands exist). The estimate line shows the letter only, and only when
the gate allows an estimate.

## Task 7 — Email template and the failures

One email layout: lockup, one sentence, one button, sender `RESEND_FROM`.
Applied to access-granted, password-reset and admin-provisioning. Plain-
text alternative kept.

Failures, `Refusals.dc.html` §09, same pattern as refusals: couldn't read
the page (nothing counted, take it again), rate-limited (the real window),
404, and the error boundary. Never a code the student can't use. The Next
defaults no longer show anywhere.

## Task 8 — Share image, icon, manifest

`Share and Icon.dc.html` §10. Share image at 1200×630 with the current h1
and `extralesson.app`, the marked line from an approved question, not an
invented one. Icon at 512 as drawn, with the 180/96/60/32 reductions. A
web manifest so the app can sit on a home screen with the icon and the
name. Gate: the OG image renders from `landing-content.ts`, so a copy
change can't strand it.

## Gate, every task

`pnpm test` green with no assertion weakened; width test at
320/360/390/1280 on every screen touched; a visible-text test that pins
the copy to its source in the repo; screenshots at 390 in the commit.

## Kill list

No magic links. No reminders. No sub-band grades. No reports to payers.
No new statistics. No admin. No copy that isn't in the repo already or in
this document.

## After the pilot

- Change sitting, then pay — built in Task 9. A grant is to a sitting;
  the account's sitting can change any time (SittingChange, append-only);
  the paywall is the gate's answer for a sitting with no grant; the
  sitting-passed refusal enters for the next sitting on the books, and
  writes to Help only while there is none.

## R10

Admin on the chrome: access, review, coverage, topics, disputes, the
dispute case. Then the launch sequence.
