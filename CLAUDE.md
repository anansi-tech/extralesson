# CLAUDE.md — ExtraLesson

AI-powered CSEC Mathematics tutoring for the Caribbean. The current spec is
`ROUND_8_NOTEBOOK.md` (the notebook as designed: tokens, chrome and every
student screen to `design/ui/*.dc.html` — pixels, not behaviour), on top of
`ROUND_7_LAST_MILE.md` (feedback that speaks to the student, no dead ends,
the operator can act, the landing restructured), `ROUND_6_ONE_TRUTH.md` (one score fold, scoped payment,
unique attempts and reads, the gate as a gate), `ROUND_5_CLAIMS.md` (criteria as claims rendered for the student's own values,
"not what I wrote", disputes feeding the golden set), `ROUND_4_FIRST_RUN.md`
(photo-first answering, the first-question session, mark disputes),
`ROUND_1_5_FINAL.md` (visuals, multi-part schema, target matrices) and
`ROUND_1_EXTRALESSON.md` — read all seven before any non-trivial change. The photo-grading examiner engine is Round 2. `feat/question-bank-fingerprint` is
a quarry, not a merge target — see the R1.5 branch policy.

## Ground truth

- The CXC syllabus PDF (`design/syllabus-2027.pdf`, CXC 05/G/SYLL 16, Amended Oct 2025,
  effective May–June 2027) overrides this file, the spec, and model memory.
- Never use CXC past-paper content verbatim or near-verbatim. Original questions in exam
  *style* only.
- Mark profiles are **CK / AK / R** (Conceptual Knowledge, Algorithmic Knowledge,
  Reasoning) — never the old M1/A1 language in code or student-facing copy.
- Jan 2027 re-sit uses the OLD exam format; the modular structure starts May–June 2027.
  `syllabus_mode` ('legacy-jan' | 'modular-2027') is **display-only** — no structural
  branching anywhere else.

## Stack

Next.js 15 (App Router, TS strict) · MongoDB + Mongoose (`lib/db/`) · Tailwind v4
(shadcn/ui sparingly) · Vercel AI SDK (generation pipeline only) · Zod at all external
boundaries · Vitest · KaTeX.

- Env vars: see `.env.example`. Never commit values. Rotating `SESSION_SECRET` = global
  logout (intentional; documented in README).
- Auth is email + password (scrypt from `node:crypto`, no dependency). Sessions last
  30 days. R1 was passwordless magic-link; checking an inbox every session was friction
  a student on a phone would not pay, and it cost us the session. The HMAC-SHA256
  single-use-jti machinery survives for the ONE flow that still has to prove control of
  an inbox: password reset, 30-min expiry.
- Reset links go out through Resend (`lib/email.ts`, same env var names as cognicare).
  With no `RESEND_API_KEY` the link falls back to the server log so local dev works;
  with one set it is never logged.
- `attempts` is append-only — never mutate an attempt; all mastery/progress state is a
  fold over attempts. No mutable score fields anywhere.
- Any schema addition ships with a same-commit backfill.
- "Copybook" is the INTERNAL name for the design language only — tokens, comments,
  specs. It never appears in student-facing text, where the word is "notebook":
  a Caribbean sixteen-year-old does not reliably know the term, and neither did
  the person who chose it. Design tokens (copybook language): `--paper #FBF7EE`, `--ink #1E2430`, `--rule #C9D6E8`,
  `--margin #E4B8B4`, `--red #C1121F`, `--green #2E7D5B`. Fonts: Fraunces, IBM Plex Mono,
  Caveat. Mobile-first, usable at 360px.

## Kill list — hard gates

No code/imports/stubs for: WhatsApp/Twilio · parent reports · Stripe as a DEPENDENCY —
no `stripe` npm package, no `@stripe/*`, no SDK, no outbound API call (exempt: the
payment-link href, and a webhook handler verifying signatures with `node:crypto`
alone) · Investigation-type questions ·
SBA coaching · spaced repetition · streak REWARDS · CAPE or second subject ·
in-app payments · Railway/cron · offline sync · native apps.

**The Stripe webhook left this list, deliberately.** The ban read "Stripe
SDK/API/webhooks" and the reason under it was that hand-matching is right at a
hundred sales. By volume that is still true — but a student who pays at 9pm
should not wait for someone to read an inbox, and `/admin/access` already exists
as the fallback that makes automation safe: every grant is visible, revocable,
and an unmatched payment surfaces there instead of vanishing. So the DEPENDENCY
ban stands exactly as it was — no package, no SDK, no outbound call — and the
exemption widened by one: a handler that verifies the signature with
`node:crypto` and writes to our own database. Anything reaching for the npm
package is still a violation, and the pre-commit grep now also fails on stripe
appearing in `package.json`, because the rule was about the dependency and the
grep only knew about imports. Reasoning in `ROUND_2_EXAMINER.md` §8c.

**Photo capture and vision left this list in Round 2.** They were R1 gates because
R1 had no examiner, and half a camera would have been scope creep. R2
(`ROUND_2_EXAMINER.md`) IS that examiner, so they are now the round's subject.
The gate moved rather than lifted — R2 brings its own, below — and everything R1
banned for a reason that still holds stays banned.

**No decorative claims on a public page.** No claim about PEOPLE, TESTING, USAGE
or RESULTS goes on a public page unless it is verifiably true. "My own family
tested it first" was removed for being untrue; the test is not whether a claim is
flattering or even plausible, but whether it can be shown. **If a claim would
need a footnote to defend, cut it.** Do not replace it with a softer version —
the paragraph is stronger without a substitute.

The reason is specific to this page rather than general good manners. Its
persuasive strength IS its honesty: it states the coverage limit, names the marks
it cannot assess, says it is not CXC, and refuses to send reports. A single
decorative claim puts every one of those in doubt, because a reader who catches
one invented detail is right to reread the rest as marketing. Numbers already
follow this rule mechanically — coverage and the 84% working-marks figure are
computed and checked against the bank by `report-bank.ts` — and prose about
people and results gets no weaker standard than prose about percentages.

**Who each surface addresses.** A surface that asks for ATTENTION addresses the
reader directly and assumes nothing about who they are — the hero, lede, page
title, OG title and OG image all say "your own CXC examiner". A surface that
asks the reader to ACT addresses WHOEVER IS PAYING: the offer, checkout
captions, `/welcome`, the FAQ — no relationship, no geography, no "your child".

The rule used to say the hero should speak to "the most likely first reader"
and picked a parent. **It failed on its premise, not its conclusion**: a link
travels, and the page is opened by students, parents and teachers with no way
to tell which, so a hero addressed to one told the other two the product was
for somebody else. Do not reintroduce a guess about who arrives first — the fix
is to stop guessing, not to guess better. The cost reasoning is unchanged and
still decides the act/attention line: a wrong assumption in the hero costs a
moment, while in the offer it produced a real defect (the caption told a payer
to sign up with their own checkout email, which would have created the account
under the wrong person). "Child" stays on the privacy page, where it means a
guardian's rights over a minor's data. Reasoning in `ROUND_2_EXAMINER.md` §8e.

**Parent and sponsor reporting — declined, not deferred.** The kill-list entry
reads as an unbuilt feature; it is a decision. A report going home shifts a
fifteen-year-old's incentive from learning to looking good, and every steering
decision here — weakest-first, the revisit filter, the diagnostic ranking — is a
fold over attempts that degrades the moment a student has reason to avoid the
topics they are worst at. It would corrupt the adaptive system's input
invisibly. The buyer is often not the student, which is exactly why the
temptation is real. If it ever returns, the form is STUDENT-INITIATED SHARING,
never a scheduled report that goes behind their back — the same line drawn for
streaks and for revisiting mistakes: does the APP decide, or does the STUDENT
ask? Reasoning in `ROUND_2_EXAMINER.md` §8d.

**Image retention — asked and answered.** The 7-day TTL on captured images is
not up for revisiting for a training corpus. It is handwriting from minors tied
to identifiable accounts; the TTL is a kill-list item; and the TRANSCRIPTION —
kept permanently, no TTL — is what evals replay against, so nothing we measure
needs the pixels after they are read. A training corpus, if ever wanted, is
collected deliberately with consent, never by quietly keeping student work handed
over for a different purpose. Reasoning in `ROUND_2_EXAMINER.md` §8b.

**Round 2 additions.** No handwriting model or OCR training · no per-stroke or video
capture · no live camera guidance · no marking without a stored transcription · no
vision pass that can reduce a deterministically-earned mark · no image retained beyond
the TTL · no parent report · no instrument constructions · no second marking dialect
(transcription targets the grader's existing conventions).
**What this ban is FOR, since it was read too widely once.** It exists to stop us
building a HANDWRITING-RECOGNITION SYSTEM INTO THE PRODUCT — bundling a
recogniser, training a model on student work, capturing strokes. The shipped
answer for reading handwriting is the vision model we call, and nothing else.

It says nothing about LOCAL ONE-OFF ANALYSIS OF REFERENCE MATERIAL. Reading our
own past-paper PDFs on this machine to calibrate the generator is unrestricted —
by any means, including the same vision path the product uses, because a clean
printed page is an easier version of a task we already do. Nothing about it
ships. The ban stopped a corpus measurement once, which is the wrong shape
entirely: the gate is on what the PRODUCT contains, not on what we may look at.

Greps: `tesseract`, `ocr`, `per-stroke`, `inkml`, `handwriting-model` — enforced
in `app/ lib/ scripts/ tests/`, which is the shipped surface. Note that `stroke`
itself is NOT a banned word — SVG stroke attributes account for fifty legitimate
hits in `lib/visuals` — so the ban is written as the thing it forbids: capturing
strokes, ink formats, or a bundled recogniser.

**Streaks — the line, drawn on purpose.** A streak as a STATISTIC is permitted: days
in a row printed beside sessions, questions and marks attempted, in the same type, as
one more count of work done. Streak REWARDS are not, and the ban is on the mechanism
rather than the word — no badges, no points, no bonuses, no multipliers, no "don't
lose your streak" prompt, no notification or copy that makes a missed day a
punishment. The test: if the number disappeared, would the student lose information
or lose a prize? Information is a statistic; a prize is gamification. Written out
because the rule read "streaks/gamification" and was about to be resolved to whatever
the last person assumed.

**Revisiting mistakes — the same line, drawn again.** Selecting a session from
objectives the student has LOST MARKS ON is permitted: the attempts and rubric
rows are already stored, and choosing from them is selection, exactly like
weakest-first. Spaced repetition is still banned, and the ban is on the
mechanism: no interval or ease factor per item, no due dates, no queue that
says what must be reviewed today, no "N cards due", no notification or copy
that makes a skipped day a failure. The test: does the APP decide when you must
review, or does the STUDENT ask to revisit and we pick sensibly? A schedule is
spaced repetition; a filter on selection is not. `REVISIT_DELAY_DAYS` is one
freshness rule, not an interval — it never grows, never shrinks, and nothing is
tracked per item. Written out for the same reason the streak line was: the rule
said "spaced repetition" and was about to be resolved to whatever the next
person assumed.

R1.5 additions: no TikZ/KaTeX-server toolchains beyond the katex npm package ·
no runtime drawing code (visuals are the 15 parametric SVG templates +
dataTable HTML in `lib/visuals/` only) · no corpus inventory/classification/OCR
pipeline in main · no similarity checks against external corpora · no (i)/(ii)
sub-nesting · no image assets/CDN.

These are enforced by a **pre-commit hook**, not by remembering to check:
`.githooks/pre-commit` runs `scripts/check-kill-list.sh` over the staged files
**and the whole test suite** (~9s), and fails the commit on either. `pnpm install` wires it up (`prepare` sets
`core.hooksPath`); run `pnpm check:kill-list` to sweep the whole tree by hand.
The hook exists because the greps were twice run alongside `git commit` and read
after the push, and later because `pnpm test && git commit` in one block commits
before anyone reads the output — main went red for a commit that way. Reading
order is not a control; a gate is. A commit touching no `.ts`/`.tsx` under
`app/ lib/ scripts/ tests/` skips both checks, so docs-only commits stay quick.

Verification greps must return zero hits in `app/ lib/ scripts/`:
`whatsapp`, `twilio`, `stripe` (imports), `investigation`, `sba`,
`tikz`, `jsxgraph`, `minhash`, `latex` (write "KaTeX", never the other name),
plus the Round 2 list above. Use word-boundary matching — "division" in faithful
syllabus text is not a violation, and neither is an SVG `stroke`. Spell out "school-based assessment" / "investigative
question" in comments instead of the banned tokens.

## Next candidate, not yet built

**Rubric rows need a declared credit field.** A row that says neither "their"
nor CAO leaves it unstated whether it follows the student's own values or must
reach the true answer, and the marker resolves that silence strictly — refusing
a correct follow-through conclusion. 884 of 2424 rows (36%) sit beside a
follow-through row while declaring neither; that overstates the harm, because
most are knowledge rows, and the damaging subset is **unmeasured** and cannot be
sized without pattern-matching criterion prose.

Parked because it fails safe, sits inside the withheld-when-should-award ~6%
already reported in every eval run, and will be sized by real students' "I got
that right" reports rather than by another audit. When built:
`credit: 'follow_through' | 'cao' | 'independent'` on the rubric row, read by
the marker instead of inferred from wording, with a same-commit backfill and a
generation-contract rule. Full reasoning in `ROUND_2_EXAMINER.md` §8a.

This is the same failure mode as the streak and spaced-repetition lines below: a
rule that was not written down got resolved to whatever the reader assumed.

## Working style

First principles. Occam's razor. Surgical changes only — no scope creep, no speculative
abstractions. Every changed line traces to the spec. Verify with `pnpm test` before
committing; one task per commit, push after each.

**Code rule, new in this round and permanent.** Code is the explanation. Short
functions, plain names, one idea per line. A comment says *why*, never *what*
or *what used to be*. If the code can't say it, change the code first. History
lives in git and the ROUND docs. A comment over five lines is a paragraph
looking for a home. This goes in CLAUDE.md under Working style.

## Commands

- `pnpm dev` — run locally (needs `.env` from `.env.example`)
- `pnpm seed:topics` / `pnpm seed:blueprints` — seed syllabus graph + paper allocations
- `pnpm generate -- --topic M1-ALG1 --difficulty 2 --count 10 --kind structured` — question pipeline
- `pnpm test` — Vitest
