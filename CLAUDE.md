# CLAUDE.md — ExtraLesson

AI-powered CSEC Mathematics tutoring for the Caribbean. Round 1 scope is defined in
`ROUND_1_EXTRALESSON.md` — read it before any non-trivial change. Nothing outside that
document exists yet; the photo-grading examiner engine is Round 2.

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
- Auth is passwordless magic-link only (HMAC-SHA256, 15-min expiry, single-use jti).
  No passwords anywhere.
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

Verification greps must return zero hits in `app/ lib/ scripts/`:
`whatsapp`, `twilio`, `stripe` (imports), `vision`, `upload`, `investigation`, `sba`.

## Working style

First principles. Occam's razor. Surgical changes only — no scope creep, no speculative
abstractions. Every changed line traces to the spec. Verify with `pnpm test` before
committing; one task per commit, push after each.

## Commands

- `pnpm dev` — run locally (needs `.env` from `.env.example`)
- `pnpm seed:topics` / `pnpm seed:blueprints` — seed syllabus graph + paper allocations
- `pnpm generate -- --topic M1-ALG1 --difficulty 2 --count 10 --kind structured` — question pipeline
- `pnpm test` — Vitest
