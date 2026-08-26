# ROUND_1_EXTRALESSON.md — v2 (2027 syllabus)

**Product:** ExtraLesson — AI-powered CSEC Mathematics tutoring for the Caribbean.
**Round scope:** Content system + practice loop + landing page port. The photo-grading examiner engine is Round 2. Nothing outside this document exists yet.
**Repo:** `anansi-tech/extralesson` (new).
**Ground truth:** CXC CSEC Mathematics syllabus **CXC 05/G/SYLL 16, Amended Oct 2025, effective May–June 2027** (PDF in `/design/syllabus-2027.pdf`). The syllabus document overrides anything in this spec or in model memory. Never use CXC past-paper content verbatim or near-verbatim — original questions in exam *style* only.
**Guiding lights (standing):** First principles. Occam's razor. Surgical changes only. No scope creep.

---

## 0. Syllabus structure this build targets (from the 2027 document)

- **Three modules**, each 1 credit, M1 recommended prerequisite to M2/M3:
  - **M1 Fundamentals:** Number Theory & Computation · Consumer Arithmetic · Sets · Measurement · Algebra 1 · Introduction to Graphs
  - **M2 Intermediate:** Statistics 1 · Algebra 2 · Relations, Functions & Graphs 1 · Geometry & Trigonometry 1 · Vectors & Matrices 1
  - **M3 Higher:** Statistics 2 · Relations, Functions & Graphs 2 · Geometry & Trigonometry 2 · Vectors & Matrices 2
- **Sittings:** Regular (all modules) or Modular (one or two modules). Per-module letter grades A–C; micro-credential (CTEC) per module; 4-year completion window.
- **Papers:** P1 = 60 MCQ (20/module, 30%); P2 = structured, 3 questions/module, 30 raw marks/module (50%), includes a 9-mark Investigation question in M1; P3 = SBA project (20%), reusable 4 years.
- **Mark profiles (official):** every mark is CK (Conceptual Knowledge), AK (Algorithmic Knowledge), or R (Reasoning). P2 per module: 9 CK + 12 AK + 9 R raw.
- **TIMING CAVEAT:** January 2027 re-sit uses the OLD exam format; new structure begins May–June 2027. Content is ~common. Build content once on this graph; a display-level `syllabus_mode` ('legacy-jan' | 'modular-2027') controls exam-facing copy only. No structural branching anywhere else.

---

## 1. Stack

Next.js 15 (App Router, TS strict) · MongoDB + Mongoose · Tailwind v4 (+shadcn/ui sparingly) · Vercel AI SDK (generation pipeline only this round) · Vercel hosting · Zod at all external boundaries · Vitest · KaTeX for math rendering.

Env (`.env.example`, never commit values): `MONGODB_URI`, `AI_API_KEY`, `SESSION_SECRET`, `ADMIN_EMAILS`, `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` (href only).
Standing rule: rotating `SESSION_SECRET` = global logout. Intentional; document in README.

## 2. Route map

| Route | Purpose | Auth |
|---|---|---|
| `/` | Landing page (originally a port of a design HTML file, since deleted — `app/page.tsx` is the source of truth) | Public |
| `/study` | Student app | Magic-link session |
| `/study/login` | Email → magic link | Public |
| `/admin/review` | Question review queue | Admin allowlist |
| `/admin/topics` | Syllabus graph + blueprint viewer (read-only) | Admin allowlist |

## 3. Data model (6 collections)

Schemas in `lib/db/`. Any later schema addition ships with same-commit backfill (standing rule).

### 3.1 `topics` — module-intrinsic syllabus graph
```ts
{ _id,
  module: 1 | 2 | 3,
  code: string,            // 'M1-ALG1', 'M2-GEO1', ...
  title: string,           // 'Algebra 1'
  order: number,           // position within module
  objectives: [{
    id: string,            // syllabus numbering, e.g. 'M1.5.10' (module.topic.objective)
    text: string,          // faithful paraphrase of the specific objective
    notes?: string         // condensed content/explanatory notes
  }] }
```
Seed via `scripts/seed-topics.ts` from the syllabus PDF. All 15 topics, all specific objectives. No invented weights — weights come from blueprints (3.2).

### 3.2 `blueprints` — official paper allocations (seeded verbatim from syllabus)
```ts
{ _id, paper: 'P1' | 'P2',
  module: 1 | 2 | 3,
  allocations: [{ topic_codes: string[], items?: number, marks?: number }],
  profile_split: { CK: number, AK: number, R: number } }   // raw marks/items per module
```
P1: item counts per topic per module (e.g., M1: NT&C 4, Consumer 4, Sets 3, Measurement 4, Graphs 2, Algebra 3). P2: mark allocations per topic cluster (e.g., M2: Algebra 2 + RFG1 = 12, Geo&Trig1 = 9, Stats1 = 6, V&M1 = 3), P2 profile split 9/12/9 per module. These tables drive session weighting and grade prediction. Transcribe exactly; cite page in seed-file comments.

### 3.3 `questions`
```ts
{ _id,
  objective_ids: string[],
  module: 1 | 2 | 3,               // denormalized from objectives; must agree
  kind: 'mcq' | 'structured',      // P1 style | P2 style. ('investigation' is R2+ — do NOT build)
  stem: string,                     // KaTeX-safe
  options?: string[],               // mcq: exactly 4
  answer_key?: number,              // mcq
  difficulty: 1 | 2 | 3,
  marks: number,
  rubric: [{                        // structured only
    code: string,                   // official profiles: 'CK1' | 'AK1' | 'AK2' | 'R1' ... 
    profile: 'CK' | 'AK' | 'R',
    criterion: string,
    mark_value: number }],
  worked_solution: string,
  misconceptions: [{ trigger, name, remediation }],
  status: 'draft' | 'approved' | 'retired',
  gen_meta: { model, prompt_version, verified: boolean, ts } }
```
Zod refinements: rubric mark_values sum to `marks`; mcq questions carry `profile` at top level (single profile per MCQ item, per syllabus grid); per-module bank should roughly track the CK/AK/R split so sessions can mirror the real papers.

### 3.4 `students`
```ts
{ _id, email (unique), name, island?, 
  exam_sitting: 'jan-2027' | 'may-june-2027',
  syllabus_mode: 'legacy-jan' | 'modular-2027',   // derived from sitting; display only
  target_modules: (1|2|3)[],                       // modular-2027 students may target a subset
  created_at }
```
Auth: passwordless magic link — HMAC-SHA256 token, 15-min expiry, single-use (jti persisted). Session cookie same discipline. No passwords anywhere.

### 3.5 `attempts` — append-only, never mutated
```ts
{ _id, student_id, question_id, session_id,
  answer: string | number,
  rubric_awarded: string[],          // rubric codes earned; [] | [all] for mcq
  profile_marks: { CK: number, AK: number, R: number },  // computed at write
  correct: boolean, duration_ms, ts }
```
All mastery/progress state is a fold over attempts. No mutable score fields exist anywhere.

### 3.6 `sessions`
```ts
{ _id, student_id, question_ids: string[], module_focus?: 1|2|3, started_at, completed_at? }
```

## 4. Generation pipeline — `scripts/generate.ts`

CLI: `pnpm generate --topic M1-ALG1 --difficulty 2 --count 10 --kind structured`
1. Draft: prompt = objective text + notes + 2 style exemplars + rubric format (CK/AK/R codes) + misconception guidance → question JSON.
2. Zod validation (incl. rubric-sum + profile fields). Fail → discard, log.
3. Independent solve pass: fresh call, stem only; mismatch vs worked_solution/answer_key → auto-reject. Match → insert `draft`, `verified: true`.
4. Idempotent, resumable, `--dry-run`. Prompts in `lib/prompts/` with `prompt_version` recorded.

Bank targets: **400 approved** across all 15 topics; ≈60% structured / 40% mcq; difficulty-balanced; per-module CK/AK/R mix roughly tracking the official grid. M1 gets priority (largest P1 topic spread + prerequisite status).

## 5. Admin review queue — `/admin/review`

One question per screen (stem, options/rubric with CK/AK/R chips, solution, misconceptions; KaTeX rendered). Approve (A) / Edit→Approve / Reject (R); keyboard-first; auto-advance. Counters: drafts remaining, approved total, per-topic and per-module coverage vs blueprint targets. Queue order: lowest-coverage topics first. Reviewer throughput target 30–40/evening — friction here is product failure.

## 6. Student practice loop — `/study`

1. Magic-link login → dashboard: **mastery map grouped by module** (M1/M2/M3 sections, bar per topic), per-module status, predicted outcome, "Start today's session".
2. Session builder: 8 approved questions; weakest-objectives-first *within the student's target modules*, honoring M1-prerequisite ordering on cold start (M1 topics before M2/M3 until M1 mastery > threshold); blend structured/mcq per bank availability, biased toward blueprint-heavy topics.
3. Question card: mcq = 4 options, instant mark + one-line explanation; structured = typed final answer + optional typed working (photo input is R2) → final-answer equivalence check drives A-profile-style marks; award method-ish CK/AK marks by documented simple heuristics only (full examiner marking is R2 — do not build partial LLM grading).
4. Miss → matching misconception remediation, else worked solution. Session summary: marks by profile (CK/AK/R), objectives touched, mastery deltas.
5. Mastery per objective = weighted fold over last 5 attempts (weights 5..1); bands STRONG/BUILDING/WEAK/NOT STARTED from one config file; module mastery = blueprint-weighted rollup of its topics.
6. **Predicted outcome v1** (`lib/grade/predict.ts`): honest arithmetic, no ML —
   - per module: blueprint-weighted mastery → P1(30) + P2(50) share estimate; SBA(20) assumed at carry-over neutral (document assumption) → module letter estimate (A–C bands from documented assumptions);
   - overall: modules combined → six-point-scale estimate;
   - UI labels everything "estimate", and for `legacy-jan` students shows overall grade only (no per-module letters — their sitting doesn't award them).

**UI:** copybook design language per approved mockup — ruled paper, margin rule, red-pen `#C1121F`, Fraunces + IBM Plex Mono + Caveat; rubric chips now **CK/AK/R** (not M1/A1). Tokens into Tailwind theme (`--paper #FBF7EE`, `--ink #1E2430`, `--rule #C9D6E8`, `--margin #E4B8B4`, `--red #C1121F`, `--green #2E7D5B`). Mobile-first, fully usable at 360px, no heavy assets.

## 7. Landing page port — `/`

Port the landing design HTML faithfully to a server component (copy, structure, aesthetic preserved). **The design file was deleted after Round 2:** it had twice become the stale copy that reintroduced wording already fixed on the page — a wrong company name, a removed flag — and having two files to sweep made every copy change a two-file job that was silently one. `app/page.tsx` is the source of truth for the landing page. CTA = plain `<a href>` to `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` — no Stripe SDK/API/webhooks. Content constants (dates, places count) in one file; no fake counters. Copy tweak permitted in this round only where exam facts changed: any M1/A1 mark language → CK/AK/R-neutral phrasing ("marked the way examiners award marks — step by step"). Basic SEO + OG image + sitemap.

## 8. Kill list — hard gates

No code/imports/stubs for: WhatsApp/Twilio · parent reports · Stripe SDK/API/webhooks · photo upload/vision · Investigation-type questions · SBA coaching · spaced repetition · streaks/gamification · CAPE or second subject · in-app payments · Railway/cron · offline sync · native apps.
Verification greps (zero hits in `app/ lib/ scripts/`): `whatsapp`, `twilio`, `stripe` (imports; env href exempt), `vision`, `upload`, `investigation`, `sba`.

## 9. Definition of done

1. Fresh clone + `.env` + `pnpm i && pnpm seed:topics && pnpm seed:blueprints && pnpm dev` = working app.
2. Topics and blueprints match the syllabus PDF on spot-check (all 15 topics; P1 item table and P2 mark table exact).
3. Pipeline produces valid drafts; independent-solve rejection demonstrably fires on a poisoned prompt.
4. Review queue works at keyboard speed; coverage counters correct against blueprint targets.
5. Student path: magic-link in → 3 full sessions across ≥2 modules → mastery map, module rollups, and predicted outcome all move correctly per the folds; M1-first ordering observable on a cold account.
6. 100+ approved questions (founder task, parallel).
7. Landing page live, pixel-faithful, CTA → payment link.
8. Vitest green: mastery fold fixtures · module rollup weighting · rubric-sum + profile Zod refinements · magic-link expiry + single-use · session-builder ordering (M1-prerequisite + weakest-first) · predict.ts fixtures.
9. Deployed to Vercel; `/admin/*` blocked for non-allowlisted accounts (verified as a normal student).

## 10. Verification protocol (post-build)

Fresh clone → seed → `pnpm test` → kill-list greps → syllabus spot-check (topics/blueprints vs PDF pages) → manual DoD-5 pass as fake student → hand-check 10 generated questions for mathematical correctness before any approval session.

---
*R2 preview (do not build): photo-of-working capture + vision transcription, full CK/AK/R rubric LLM grading with golden-set eval gate (>90% mark-level agreement), Investigation-question type, parent weekly report.*
