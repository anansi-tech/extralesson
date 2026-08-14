# ROUND_1_5_FINAL.md — Visuals, multi-part schema, target matrices (CONSOLIDATED)

**This is the single authoritative spec for Round 1.5.** It supersedes ROUND_1_5_VISUALS_AND_MATRIX.md and merges the confirmed corpus findings (STYLE_SPEC_ADDENDUM_A2b). Hand nothing else to the build.

**Branch policy:** Build from `main`. `feat/question-bank-fingerprint` is a quarry, not a merge:
- CARRY to main: `design/research/*.json` (verified clean — aggregates only, zero source text) as reference data; the archetype taxonomy; the visual renderer/component IF template-shaped; the re-solve-on-edit fix.
- DO NOT port: corpus inventory/classification pipeline code (its job is done), similarity/MinHash machinery, the 12-field recipe.

**Ground truth:** syllabus PDF + seeded blueprints govern allocations. `design/research/question-corpus-classification.json` governs representation/archetype targets. No CXC text, questions, or assets anywhere — including fixtures and tests.

**Standing rules:** First principles. Occam. Same-commit backfill on schema changes. Kill-list greps at the end.

---

## 1. Why this round exists (context for the build)

~70% of recent-era P2 structured questions carry a visual; 37% of P1 MCQs do. A text-only bank trains false confidence. This round makes questions structurally exam-true (stimulus + parts + visuals) and makes generation deficit-driven so the bank mirrors the real papers' composition.

## 2. Schema change — stimulus + parts + visual (same-commit backfill)

`questions` gains:

```ts
{
  stimulus?: string,          // shared context (KaTeX-safe)
  visual?: { template: TemplateName, params: <per-template Zod schema> },
  parts: [{                   // structured: 1..6 parts (flat labels 'a'..'f'; no (i)/(ii) nesting)
    label: string, prompt: string, marks: number,
    answer: string            // values-only convention, as today
  }],                         // mcq: exactly 1 part
  archetype: 'multi-step-application' | 'direct-procedure' | 'interpretation' |
             'justification' | 'reverse-reasoning' | 'comparison' | 'complete-the-table',
  representation: 'prose' | 'diagram' | 'graph' | 'table' | 'chart' | 'venn'
}
```
- Rubric stays question-level; each rubric row gains `part_label` (must ⊆ part labels).
- Part marks sum to `marks` (Zod refinement). `final_answer` = "; "-joined part answers (derived, kept).
- If representation ≠ 'prose' → `visual` required and type-consistent. Matrices are NOT visuals (KaTeX notation in stem/parts).
- Existing drafts: regenerate under the new prompts rather than migrate content (bank is small). Backfill = schema-level defaults so old records remain readable until retired.
- Grading: one input per part; per-part equivalence; session summary unchanged.

## 3. Visual system — 15 parametric SVG templates (TypeScript, deterministic)

`lib/visuals/`: pure `(params) => svg-string`, KaTeX labels, black-line exam aesthetic, viewBox-scaled, no external assets. Model emits `{template, params}` — never raw SVG or drawing code.

Templates: triangleLabeled · circleCenter · parallelTransversal · polygonMarkedAngle · coordinateGrid (incl. pre/post transformation polygon overlays) · travelGraph · barChart · pieChart · histogram · cumulativeFrequency · venn2 (opt. 3rd set) · compositeShape (compound plane figures / prisms-cylinders with dimension labels) · patternFigure (dot/matchstick sequences — REQUIRED, pairs with complete-the-table) · numberLine · bearingDiagram. dataTable renders as semantic HTML, not SVG.

**Integrity rule (load-bearing):** every template's params are Zod-validated AND numerically cross-checked against the question in `lib/visuals/verify.ts` (angles sum/consistency, plotted data matches stem numbers, graph slopes match scenario). Visual-verify failure = auto-reject before the solve pass. Snapshot tests per template with ORIGINAL fixture data only.

## 4. Target matrices — separate P1 and P2

Replace combined coverage in `lib/admin/coverage.ts`:
- **P1 — 160 MCQs** by the seeded P1 item table (×2.67), per-module profile tracking 6 CK / 8 AK / 6 R per 20 items. **37% of MCQs visual**, biased to Sets/Geometry/Graphs/Statistics.
- **P2 — 240 structured** by the seeded P2 mark table, coverage measured in RUBRIC MARKS, per-module profile tracking 9 CK / 12 AK / 9 R per 30. Blueprints (2027) are authoritative for marks — corpus is authoritative for representation/archetype shares only.
- Representation targets per topic, from the corpus (recent era, n in parens): M1.1 NT&C(29): prose 37/pattern-figure 31/table 13 · M1.2 Consumer(11): prose 63/table 27 · M1.3 Sets(3, low-n): venn-dominant · M1.4 Measurement(26): visuals ~96 (measurement 42/geometry 34/graph 15) · M1.5 Algebra1(27): pattern-figure 40/prose 22/table 14/number-line 11 · M1.6 Graphs(6): always visual (grid 66/graph 33) · M2.1 Stats1(7): always visual (table 57/chart 42) · M2.2 Algebra2(17): prose 41/figure 23/number-line 11/graph 11 · M2.3 RFG1(25): graph 40/grid 32/prose 12 · M2.4 Geo&Trig1(29): figure 79 · M2.5 V&M1(7): mostly prose-notation + occasional vector figure · M3.1 Stats2(11): always visual (table 63/chart 36) · M3.2 RFG2(13): grid 38/graph 38/prose 15 · M3.3 Geo&Trig2(26): figure 61/transformation 15/bearing 7 · M3.4 V&M2(15): prose-notation/vector figure/grid.
- Archetype shares (structured bank): multi-step-application 67 · justification 11 · interpretation 11 · reverse-reasoning 9 · direct-procedure 2; comparison and complete-the-table live inside multi-step counts. Part-count distribution: median 4, a third at 5–6.
- Floors: ≥2 approved questions per objective where mathematically sensible.
- Admin dashboard reports deficits by module, objective, paper, difficulty, profile, archetype, representation. Reviewer additionally sees the recipe.

## 5. Recipe-driven generation (6 fields)

```ts
QuestionRecipe = { objective_ids, kind, difficulty, marks, archetype, representation }
```
- `scripts/generate.ts` computes the largest matrix deficit and emits recipes; `--topic/--count` become optional overrides. Model no longer free-chooses objectives.
- Prompts (v5): recipe + style spec Part A + 2 module-matched founder exemplars + visual-template contract. Record prompt_version.
- Solve pass: for visual questions, receives stimulus + a TEXT rendering of visual params (not SVG) and must reach the answers.
- Post-gen gate order: Zod → visual verify → independent solve → internal dedup vs approved bank (normalized-stem containment + cheap embedding cosine; conservative threshold; store score only). NO similarity checks against external corpora — archive text never enters the system by design.
- Edit→Approve re-runs solve + visual verify before approval (regression test required).

## 6. Rollout

1. Land schema + templates + matrices + recipes.
2. Pilot: 30 questions across 3 contrasting topics (one visual-heavy, one prose-heavy, one mixed).
3. Founder blind review ("would this belong in the paper at this band?"); tune from misses.
4. → 100 approved → coverage audit → 400 → simulated-paper verification script (assembly is verification only, not a feature).

## 7. Kill list (additions to R1's)

No TikZ/LaTeX toolchain · no JSXGraph/runtime drawing code · no corpus inventory/classification/OCR pipeline in main · no MinHash/semantic similarity vs external corpora · no (i)/(ii) sub-nesting · no composite/fill-blank response types · no interactive visuals · no image assets/CDN (SVG strings + HTML tables only) · no paper_meta/sections schema.
Greps (zero hits in app/ lib/ scripts/): `tikz`, `jsxgraph`, `minhash`, `latex`.

## 8. Definition of done

1. Schema migrated with backfill; tests green; old drafts readable, marked for regeneration.
2. 15 templates render exam-plausible SVGs; snapshot + verify tests green; a deliberately inconsistent visual (angle sum ≠ stated) auto-rejects end-to-end.
3. Matrices live with representation/archetype targets above; dashboard shows P1/P2 deficits; generation consumes deficit-driven recipes.
4. Edit→Approve re-solves (regression test).
5. Pilot 30 generated across the 3 topics; rejection logs explain failures; founder review queue ready.
6. Kill-list greps clean.
