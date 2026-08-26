# ROUND 3 — LAUNCH

Round 2 built the examiner. Round 3 does not build anything for a student.
Its subject is the twenty metres between a finished product and a stranger
paying for it, and every item in it is a thing that is currently either untrue,
unenforced, or undecided.

**The scope rule for this round, written first because it is the one most
likely to be broken.** No new student-facing capability. No feature that would
be nice before launch. If a task cannot be traced to "a buyer or a teacher hits
this in the first week and it is wrong", it belongs to Round 4. The failure
mode this guards against is a round that never ends because the product keeps
almost being ready.

## 1. The launch preflight

**Three environment variables fail silently in production, and one of them
takes the whole business down.**

`paymentLink()` in `lib/landing-content.ts` returns
`process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '#offer'`. Unset, the landing
page renders perfectly, the button looks right, and it scrolls the reader back
to the paragraph they just read. There is no error, no log line, and no way to
tell from the page that the product cannot be bought. A missing
`ADMIN_EMAILS` locks the operator out of `/admin/access`, which is the fallback
every automatic path depends on. A missing `STRIPE_WEBHOOK_SECRET` rejects every
delivery with 400 — that one at least fails loudly, in a place nobody is
looking.

Build a preflight that runs on boot in production and refuses to be quiet:

- A module that reads the required set — `MONGODB_URI`, `SESSION_SECRET`,
  `AI_API_KEY`, `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`, `ADMIN_EMAILS`,
  `STRIPE_WEBHOOK_SECRET` — and reports which are absent.
- In production, a missing one is a hard failure at startup or a banner on
  `/admin`, not a `||` fallback. Decide which and write down why.
- `paymentLink()` loses its `'#offer'` default in production. A dead CTA that
  looks alive is worse than a page that says it is not open yet.
- A test asserts the required list is the same list the code actually reads, so
  a variable added later cannot be omitted from the check.

## 2. The scarcity claim has to be enforced or removed

The page says **100 FAMILIES ONLY** in the hero and `Founding Families · 100
places` on the offer. `lib/landing-content.ts` says the number is "enforced
where the money is taken". **Verify that.** A Stripe payment link with no
inventory cap will take the hundred-and-first payment without blinking, and
then the page carries a limit that is not a limit.

This is not a marketing nicety, it is the rule in CLAUDE.md: no claim about
people, testing, usage or results on a public page unless it is verifiably
true. A cap is a claim about usage. Either the payment link enforces it, or the
number comes off the page — and per the same rule, it is not replaced with a
softer version.

Report which is true before changing anything, and say how it was checked.

## 3. Teachers: the offer exists and the product has no idea

The launch message offers ExtraLesson free to any teacher using it with a
class. In the product a teacher is a `Student` row with a hand grant on
`/admin/access` and a note. That is the right amount of machinery at this size
and it should stay. What is missing is the RULE, and this round writes it down
before the first teacher asks, not after.

Answer, in the spec and in the note convention:

- Does free mean a free account for the teacher, or free access for that
  teacher's students? A teacher will read it the generous way. What is the
  answer when one asks for thirty seats?
- What goes in the grant note so a comp is distinguishable from a sale six
  months later. `comp · teacher` and the school, at minimum — the note is the
  only evidence a grant has.
- Does a teacher account expire with the sitting like a paid one, or not?
  `hasAccess` reads `accessEndsAt(sitting)`; a comp that quietly dies in July is
  a teacher who tells other teachers the thing stopped working.

**No teacher role, no classes, no rosters, no invite flow.** Those are Round 4
if teachers actually arrive. This item is a decision and a note convention, and
it should cost almost no code.

## 4. Regression coverage for the payment orderings

`tests/payment-ordering.test.ts` does not test behaviour. It reads the source
files as strings and asserts substrings appear in them — `toContain('pendingPaymentFor')`,
`not.toMatch(/access:\s*\{/)`, a regex over `sort({ received_at: 1 })`, and a
line of admin copy. It passes if the functions are called and internally
broken, and it fails if someone reformats an argument or rewords a caption.

That matters more here than it would elsewhere, because `.githooks/pre-commit`
runs the whole suite as a GATE. A gate made of substrings gives false green on
the code that takes money, and red on unrelated copy edits — and the second one
teaches everybody to distrust the gate, which is how the first one gets through.

Replace it with behaviour tests over a real database and a really-signed
webhook body, in the pattern `tests/auth.test.ts` already uses
(`mongodb-memory-server`). The route's `POST` can be called directly with a
`Request` whose `stripe-signature` header is a genuine HMAC-SHA256 over
`${t}.${body}`; set `MONGODB_URI`, `STRIPE_WEBHOOK_SECRET` and
`STRIPE_LINK_SITTINGS` before importing the modules under test.

Cases that must be covered:

1. Pay first, then register — webhook returns `matched: false`, the payment is
   unmatched, and registration grants from it.
2. Register first, then pay — the webhook grants on its own.
3. The custom field beats `customer_details.email`. This is the aunt-pays-for-
   nephew defect of §8e and it is the one with a real victim.
4. No custom field collected falls back to the payer address — asserted as
   CORRECT, which is precisely why the Stripe field must be Required.
5. An unmapped payment link falls back to the registered sitting and says so in
   the note.
6. A typo'd address stays unmatched and reaches `/admin/access`.
7. A Stripe retry on the same event id does not grant twice.
8. The oldest waiting payment is taken; a second stays unmatched.
9. A payment an admin has resolved is not re-taken.
10. A bad signature records nothing.

`register()` itself cannot be called from a test — it sets a session cookie and
redirects, both of which need a request scope. One clearly-labelled source
assertion that it still calls `pendingPaymentFor` and `grantFromPayment` is
acceptable, and it is the ONLY one permitted in the file.

**Two of these assertions encode decisions rather than facts, and they need
confirming before they are written down as expectations:** that the payment
link's sitting beats the sitting the student registered for, and that the payer
fallback is desired rather than tolerated.

## 5. What the operator can see on day one

Before the first stranger pays, `/admin/access` is the only window into whether
any of this is working. Check, and fix only what is missing:

- Unmatched payments are visible with enough detail to resolve them by hand —
  address, amount, when.
- A grant shows its source and note, so an automatic grant is distinguishable
  from a hand one at a glance.
- The screen is usable on a phone, because that is where it will be read at
  9pm on a Sunday.

No new dashboards. `app/admin/coverage/page.tsx` already carries the note about
a dashboard bolted onto a review screen; do not add a second one.

## 6. Kill list (unchanged, plus)

Everything in CLAUDE.md still holds. Round 3 adds no exemptions and asks for
none. Specifically not permitted in this round, however convenient launch makes
them look: a teacher role or class roster · an invite or referral flow · a
coupon or discount-code mechanism · analytics or tracking pixels on the landing
page · an email sequence to buyers · anything that reads a student's data to
tell a third party how they are doing (§8d, declined and not deferred).

## 7. Definition of done

1. A missing required environment variable in production is impossible to miss.
   `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` has no silent fallback there.
2. The hundred-places claim is either enforced at Stripe or off the page, and
   which one was chosen is recorded with the evidence.
3. The teacher offer has a written rule covering seats, note convention and
   expiry, and no new schema.
4. `tests/payment-ordering.test.ts` asserts behaviour against a real database
   and a real signature, with at most one labelled source assertion.
5. `pnpm test`, `npx tsc --noEmit` and `pnpm check:kill-list` all clean, and the
   pre-commit hook passes without `--no-verify`.
6. Nothing student-facing changed.

## 8. Sequencing

1. Preflight (§1) — it is the item that can lose every sale, and it is small.
2. Ordering tests (§4) — they protect the code that just changed while it is
   still fresh.
3. The places claim (§2) — investigation first, then one decision.
4. The teacher rule (§3) — writing, not code.
5. Admin read-through (§5) — last, and only fix what is actually missing.

One task per commit, pushed after each, per CLAUDE.md working style.

## 9. Outside the repo, and not Claude Code's to do

Recorded here so the round is not reported complete while these are open:
Stripe custom field set to REQUIRED with a label naming the student's address ·
after-payment redirect to `/welcome` · back-to-site URL in Stripe business
details · `STRIPE_WEBHOOK_SECRET` and `STRIPE_LINK_SITTINGS` set in Vercel
production · redeploy from a commit containing the ordering fix · one real test
purchase paying with one address and entering a different student address ·
operator granted access on `/admin/access`.
