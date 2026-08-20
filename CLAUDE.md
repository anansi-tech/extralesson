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
- No email provider is configured, so a reset link is delivered to the server log —
  the same gap the sign-in link had. Configure one before real students.
- `attempts` is append-only — never mutate an attempt; all mastery/progress state is a
  fold over attempts. No mutable score fields anywhere.
- Any schema addition ships with a same-commit backfill.
- Design tokens (copybook language): `--paper #FBF7EE`, `--ink #1E2430`, `--rule #C9D6E8`,
  `--margin #E4B8B4`, `--red #C1121F`, `--green #2E7D5B`. Fonts: Fraunces, IBM Plex Mono,
  Caveat. Mobile-first, usable at 360px.

## Kill list — hard gates (Round 1)

No code/imports/stubs for: WhatsApp/Twilio · parent reports · Stripe SDK/API/webhooks
(payment-link href is exempt) · photo upload/vision · Investigation-type questions ·
SBA coaching · spaced repetition · streaks/gamification · CAPE or second subject ·
in-app payments · Railway/cron · offline sync · native apps.

R1.5 additions: no TikZ/KaTeX-server toolchains beyond the katex npm package ·
no runtime drawing code (visuals are the 15 parametric SVG templates +
dataTable HTML in `lib/visuals/` only) · no corpus inventory/classification/OCR
pipeline in main · no similarity checks against external corpora · no (i)/(ii)
sub-nesting · no image assets/CDN.

These are enforced by a **pre-commit hook**, not by remembering to check:
`.githooks/pre-commit` runs `scripts/check-kill-list.sh` over the staged files
and fails the commit. `pnpm install` wires it up (`prepare` sets
`core.hooksPath`); run `pnpm check:kill-list` to sweep the whole tree by hand.
The hook exists because the greps were twice run alongside `git commit` and read
after the push — reading order is not a control.

Verification greps must return zero hits in `app/ lib/ scripts/`:
`whatsapp`, `twilio`, `stripe` (imports), `vision`, `upload`, `investigation`, `sba`,
`tikz`, `jsxgraph`, `minhash`, `latex` (write "KaTeX", never the other name).
Use word-boundary matching for `vision`/`upload` — "division" in faithful syllabus
text is not a violation. Spell out "school-based assessment" / "investigative
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
