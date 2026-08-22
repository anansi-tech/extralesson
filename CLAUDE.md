# CLAUDE.md — ExtraLesson

AI-powered CSEC Mathematics tutoring for the Caribbean. The current spec is
`ROUND_1_5_FINAL.md` (visuals, multi-part schema, target matrices) layered on
`ROUND_1_EXTRALESSON.md` — read both before any non-trivial change. The
photo-grading examiner engine is Round 2. `feat/question-bank-fingerprint` is
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

No code/imports/stubs for: WhatsApp/Twilio · parent reports · Stripe SDK/API/webhooks
(payment-link href is exempt) · Investigation-type questions ·
SBA coaching · spaced repetition · streak REWARDS · CAPE or second subject ·
in-app payments · Railway/cron · offline sync · native apps.

**Photo capture and vision left this list in Round 2.** They were R1 gates because
R1 had no examiner, and half a camera would have been scope creep. R2
(`ROUND_2_EXAMINER.md`) IS that examiner, so they are now the round's subject.
The gate moved rather than lifted — R2 brings its own, below — and everything R1
banned for a reason that still holds stays banned.

**Round 2 additions.** No handwriting model or OCR training · no per-stroke or video
capture · no live camera guidance · no marking without a stored transcription · no
vision pass that can reduce a deterministically-earned mark · no image retained beyond
the TTL · no parent report · no instrument constructions · no second marking dialect
(transcription targets the grader's existing conventions).
Greps: `tesseract`, `ocr`, `per-stroke`, `inkml`, `handwriting-model`. Note that
`stroke` itself is NOT a banned word — SVG stroke attributes account for fifty
legitimate hits in `lib/visuals` — so the ban is written as the thing it forbids:
capturing strokes, ink formats, or a bundled recogniser.

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

## Working style

First principles. Occam's razor. Surgical changes only — no scope creep, no speculative
abstractions. Every changed line traces to the spec. Verify with `pnpm test` before
committing; one task per commit, push after each.

## Commands

- `pnpm dev` — run locally (needs `.env` from `.env.example`)
- `pnpm seed:topics` / `pnpm seed:blueprints` — seed syllabus graph + paper allocations
- `pnpm generate -- --topic M1-ALG1 --difficulty 2 --count 10 --kind structured` — question pipeline
- `pnpm test` — Vitest
