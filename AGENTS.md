# AGENTS.md — ExtraLesson

Instructions for any AI coding agent working in this repo.

## Read first

1. `ROUND_1_EXTRALESSON.md` — the complete Round 1 spec. It is the contract; do not build
   anything outside it.
2. `CLAUDE.md` — condensed guardrails (ground truth, stack rules, kill list).
3. `design/syllabus-2027.pdf` — the CXC syllabus. It overrides the spec and your training
   data on anything exam-related. An extracted text copy may exist in scratch space;
   the PDF is authoritative.

## Non-negotiable rules

- **Kill list**: no WhatsApp/Twilio, parent reports, Stripe SDK (payment-link href
  exempt), photo/vision/upload, Investigation questions, SBA, spaced repetition,
  gamification, CAPE, in-app payments, cron, offline sync, or native-app code — not even
  stubs or commented placeholders. Greps for `whatsapp|twilio|stripe|vision|upload|investigation|sba`
  over `app/ lib/ scripts/` must stay clean.
- **Append-only attempts**: never write an update to the `attempts` collection; mastery
  is always recomputed as a fold over attempts.
- **CK/AK/R** is the only mark-profile vocabulary. Old M1/A1 language appears only in the
  original design mockup, never in shipped code or copy.
- **No past-paper content**: generated/authored questions must be original, exam-style only.
- **Zod at every external boundary**: request bodies, AI output, CLI input, env parsing.
- Schema changes ship with a same-commit backfill script.
- Secrets: only via env; `.env.example` documents names, never values.

## Conventions

- TypeScript strict; App Router server components by default, `'use client'` only where
  interaction demands it.
- Schemas/models in `lib/db/`, prompts in `lib/prompts/`, grade math in `lib/grade/`,
  mastery config in one file (`lib/mastery/config.ts`).
- Tests in Vitest, colocated under `tests/` mirrors or `*.test.ts` beside pure logic.
  Pure logic (folds, rollups, prediction, session ordering, token expiry) must be
  unit-tested; UI wiring need not be.
- One task per commit; push after each; commit messages describe the task outcome.

## Verify before committing

```
pnpm test
grep -riE 'whatsapp|twilio|investigation|sba' app lib scripts                 # zero hits
grep -riE 'tikz|jsxgraph|minhash|latex' app lib scripts                       # zero hits (say "KaTeX")
grep -riwE 'vision|upload' app lib scripts                                    # zero hits (word-boundary:
                                                                              #  "division" in syllabus text
                                                                              #  is not a hit)
grep -riE "from ['\"]stripe|require\(['\"]stripe" app lib scripts             # zero hits
```

R1.5 specifics: the current spec is `ROUND_1_5_FINAL.md`. Visuals are ONLY the
parametric templates in `lib/visuals/` (model emits `{template, params}`,
never SVG); every visual is Zod-validated and numerically cross-checked in
`lib/visuals/verify.ts` before the solve pass. Generation is recipe-driven
from the target matrices (`lib/targets/`, `lib/generation/recipe.ts`). The
dedup gate compares only against OUR approved bank — never external corpora.
