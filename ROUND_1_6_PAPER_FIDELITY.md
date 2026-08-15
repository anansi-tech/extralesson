# ROUND_1_6_PAPER_FIDELITY.md

**Source of findings:** correlation of three real CSEC Mathematics Paper 02 papers (Jan 2026 "Hybrid", May/June 2025, Jan 2025) against the current build. Aggregate structural findings only — no CXC question text, values, contexts, or answers enter this repo, prompts, fixtures, or tests. Read the papers, keep nothing.

**Status of prior specs:** ROUND_1 and ROUND_1_5_FINAL are built. This round is corrective: it closes fidelity gaps found in the real papers. Where it conflicts with earlier specs, this document wins.

---

## 0. Confirmed correct (no action)

Paper shape and vocabulary match what we seeded: 3 s.f. / 1 d.p. for angles, "all working must be shown", diagrams not to scale, formulae sheet provided (so questions may assume it), and the CK/AK/R demand mix. Templates confirmed in live use: dataTable, pieChart, barChart, coordinateGrid, travelGraph (velocity–time appears in every paper), patternFigure (a full 10-mark sequence question appears in every paper), compositeShape, venn/circle geometry, bearingDiagram, numberLine, histogram/cumulativeFrequency. Matrices confirmed as prose + KaTeX, not visuals. Content coverage verified against seeds: probability, number bases, significant figures, inverse/composite functions, bearings, inequalities all present.

---

## 1. CRITICAL — "Show that" questions cannot be graded by final-answer equivalence

Every paper uses this pattern repeatedly (multiple times per paper, 1–3 marks each): the stem **states the answer** and the candidate must produce the derivation. Our grading compares a final answer that the question has already given away, so these are ungradeable and, worse, trivially "passable" — false confidence, exactly the failure mode this product exists to prevent.

**Action:**
- Add `response_mode: 'answer' | 'show_that' | 'explain' | 'construct'` to parts.
- R1.5 generation: `show_that` and `explain` parts may be generated but are **excluded from the auto-graded session pool** until R2. Present them in a "worked practice" surface: student attempts on paper, taps to reveal the full worked solution and mark scheme, self-marks. No auto-marks recorded.
- `constructed`/drawing parts: not generated at all (see §3).
- Mastery/prediction must count only marks it can actually assess (see §4).

## 2. CRITICAL — answer-format requirements conflict with our permissive equivalence

Papers demand specific forms: EXACT form, standard form, lowest terms, integer estimate, correct to 1 s.f., 3 s.f., 1 d.p. for angles, "in the form y = mx + c", "in the form a√b". Our equivalence layer deliberately treats fractions and decimals as equal — correct for general marking, **wrong when the form is the thing being tested**.

**Action:** add `answer_format?: 'exact' | 'standard_form' | 'lowest_terms' | 'integer' | 'sf:N' | 'dp:N' | 'surd' | 'equation_form'` to parts. Format-aware equivalence: when set, an otherwise-equivalent answer in the wrong form is marked incorrect with targeted feedback ("correct value, but the question asks for exact form"). Prompt v6 must set the field whenever the stem demands a form. Unit tests for each format.

## 3. CRITICAL — construction/drawing marks are uncoverable and must be declared

Every paper carries drawing/construction work: ruler-and-compass constructions, completing the next figure in a sequence, drawing a line and shading a region satisfying inequalities, plotting graphs on a supplied grid, drawing transformation images, inserting bearings on a diagram, marking a point on a line. Observed load: roughly **5–10 marks per paper (≈5–10%)**. The syllabus objectives exist (confirmed in seeds); our kill list excludes them.

**Action:** keep them out of scope (an interactive construction surface is not a 2026 build), but stop the silence:
- Tag affected objectives `assessable: false` in the topics seed, with reason.
- Student UI states plainly on the mastery map and predicted grade: *"ExtraLesson covers X% of exam marks. Construction and drawing questions (about Y marks) still need pencil, ruler and compasses — practise these with past papers."*
- Landing-page copy gains one honest line to the same effect. This is a trust asset, not a weakness: nobody else states their coverage.

## 4. Prediction must be coverage-honest

`predict.ts` currently extrapolates from assessed mastery to a whole-paper grade. With §1 and §3 excluded, it would over-predict. Recompute over **assessable marks only**, then present the estimate with its coverage basis stated. Never silently extrapolate across marks we cannot assess.

## 5. Schema corrections

- **Part cap 6 → 10.** Real questions flatten to 7–8 items routinely (parts carry (i)/(ii) and occasionally a third level a)/b)). Flat labels remain correct; the cap was too low.
- **Question size:** Section I questions run 9–10 marks, Section II 12 marks; our generated questions are effectively single *parts* (4–6 marks). Fine for practice granularity — but simulated-paper assembly (later) must compose part-sized items into 9/12-mark shells. Record the intent; build nothing now.
- **Section II topic blocks** (Algebra/Relations/Functions & Graphs · Geometry & Trigonometry · Vectors & Matrices) exist in the legacy format only; the 2027 modular structure replaces them. No schema change — but `legacy-jan` display copy must not promise modular framing.

## 6. Template amendments

- **ADD `vectorFigure`** (missing, and Section II vectors is a 12-mark question in every paper): polygon/triangle/parallelogram with labeled vector arrows, midpoints and ratio-divided points, vertex labels. Highest-priority new template.
- **`coordinateGrid` + quadratic curves** (already specced separately): confirmed essential — reading roots, y-intercept, minimum, axis of symmetry from a parabola, then drawing a line and solving simultaneously by intersection. Also needs region shading for inequality systems.
- **`pieChart`**: sector labels must accept algebraic expressions (e.g. multiples of an unknown) alongside numeric angles; `verify.ts` must handle sectors that are only consistent symbolically.
- **`compositeShape`**: must cover semicircle+rectangle composites and shaded-region subtraction. 3D isometric solids (prisms drawn in perspective with a sector cross-section) are **out of scope** — mark the affected measurement objectives partially assessable rather than fake them.
- **`circleCenter`**: confirm tangent + alternate-segment configurations render (tangent-with-external-point appears in two of three papers).
- **`triangleLabeled`**: must support non-right triangles for sine/cosine rule and "shortest distance from a point to a line" configurations.

## 7. Generation weighting corrections (prompt v6)

- Function notation `f: x → …` alongside `f(x) = …`; composite `fg(x)`, `gf(x)`, and inverse `f⁻¹(x)` appear in the Section II algebra question of **all three** papers — weight accordingly in M2/M3 RFG recipes.
- "Hence, or otherwise" chaining across parts is standard; generation should use it and rubrics should allow follow-through.
- "Give a reason for your answer" is routine on circle-theorem and reasoning parts — pairs with `response_mode: 'explain'`.
- Sequence/pattern questions are a full 10-mark item in every paper, always shaped: complete the next figure (construction — excluded) → complete table rows including the nth term → a reverse/justification part. Generate the assessable parts, skip the drawing part.

## 8. Strategic note (not a build item)

The January 2026 paper is labelled **HYBRID** and is computer-delivered: candidates log in with a keycode, responses go into an on-screen booklet, and the rubric warns against configuration changes and external devices. CXC is moving Mathematics on-screen. Two implications: typed-answer practice is *more* exam-authentic than assumed, and construction-heavy items are likely to shrink over time — which shrinks §3's gap on its own. Worth confirming against CXC's hybrid-delivery notices before the January cohort launches.

## 9. Definition of done

1. `response_mode` and `answer_format` on parts, with backfill; format-aware equivalence with per-format unit tests.
2. `show_that` / `explain` parts routed to worked-practice surface, excluded from auto-graded sessions and from mastery arithmetic.
3. Non-assessable objectives tagged; coverage percentage computed and surfaced in student UI, prediction, and landing copy.
4. `predict.ts` recomputed over assessable marks; fixtures updated.
5. Part cap raised to 10.
6. `vectorFigure` template added (snapshot + verify tests); pieChart algebraic labels; compositeShape semicircle/shaded-region support; circleCenter tangent case; triangleLabeled non-right case.
7. Prompt v6 weighting per §7; regenerate a 20-question mixed batch and confirm the new fields populate correctly.
