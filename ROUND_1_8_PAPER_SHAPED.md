# ROUND_1_8_PAPER_SHAPED.md

**Premise (corrects an R1.5 decision and an R1.8-planning error of mine):** ExtraLesson exists to imitate the paper. Where fidelity and convenience conflict, fidelity wins. Two consequences drive this round: our questions are fragments where the paper sets multi-part, multi-topic questions; and a part can hold only one answer where the paper routinely puts several answerable slots under one instruction.

**Evidence.** Across the five text-layer P2 papers (2016–2019, 2021): ~26 lettered parts per paper carrying ~19 `(ii)` and ~10 `(iii)` sub-parts. Nesting is the dominant structure, not an edge case. Figure and table findings come from the 2021–2025 page-image review recorded in `paper-figure-census`.

**Standing rules unchanged.** No CXC text, values, contexts, options or answers in prompts, bank, fixtures or tests. First principles, Occam, surgical changes, same-commit backfill, kill-list greps.

---

## PART 0 — Ships FIRST, separately, no schema (the repetitiveness round)

Land this before anything below; every question generated under the current prompt inherits the sameness the founder felt at 123 approved.

1. **Context ledger.** We already show the model recent stems — extend to recent *contexts* and forbid the top recurring ones (market, school, stall, sign, and the "the coordinate grid shows…" opener). Track context_category on the question; refuse a category that appears in the last N approved for that topic.
2. **Bare P1 items.** Target ~50% of MCQs as context-free symbolic manipulation (index laws, determinant of a named matrix, solve an exponential equation, simplify a product of powers). Our current median MCQ stem is ~27 words with 35% named real-world context; the real paper writes symbols.
3. **Distractor discipline.** Distractors must include near-miss *forms*, not only near-miss values (e.g. same coefficient wrong exponent, wrong coefficient right exponent). Encode as a distractor-family requirement in the MCQ prompt.
4. **Missing item shapes → archetype vocabulary + exemplars:** defined-operation items ("given a*b defined by…"), "which statement is TRUE" set items, unit conversion, currency conversion, hire-purchase vs cash comparison, "state a value that CANNOT be in the domain".

---

## PART 1 — The slot primitive (the architectural change)

One primitive resolves sub-part nesting, completable table cells, and multi-value descriptive answers.

```ts
part {
  label: string,            // 'a' | 'b' | 'c' ... (lettered part, as printed)
  prompt: string,           // the instruction that governs the slots
  marks: number,            // sums over its slots' rubric rows
  slots: Slot[]             // 1..n
}
slot {
  label: string,            // 'i' | 'ii' | 'iii' | cell key ('r5.S') | descriptor key ('centre')
  prompt?: string,          // omitted when the part prompt says it all (table cells, EACH-of-the-following)
  answer: string,
  answer_format?: AnswerFormat,
  response_mode: 'answer' | 'show_that' | 'explain',
  rubric_codes: string[]    // rubric rows this slot earns
}
```

- **Backfill is additive: every existing part becomes a one-slot part.** No approved question is retired. This is the reason to do it at 123 approved rather than 300.
- Rubric rows move from `part_label` to `slot_ref` (`part.slot`); `part_label` retained as derived.
- Marking: per-slot equivalence and format checks; part correct iff all slots correct; profile marks accrue per slot. Session summary and mastery folds unchanged in shape — the unit of attempt becomes the slot.
- `response_mode` moves to slot level: a part may mix an auto-marked value slot with an `explain` slot. Only the explain slot leaves the graded pool; the rest still counts. (Today an explain sub-part exiles the whole part.)
- **Recovered family:** "Describe fully the single transformation" becomes slots `type` / `centre-or-line` / `factor-or-angle` — auto-marked, back in graded sessions, worth ~3 marks a paper.
- Depth stops at two levels (part → slot). The occasional third level in real papers flattens into slot labels ('iii-a'); do not build a tree.

## PART 2 — Paper-shaped, multi-topic questions

Questions become what the paper sets, not fragments of it.

- **Size:** target 9–10 marks for standard questions and 12 for extended ones, with 2–4 lettered parts and sub-parts under them. Short drill items (1–4 marks, single slot) remain a valid category — the existing 123 approved are exactly that — but are no longer the default shape.
- **Multi-topic recipes:** a recipe may draw objectives from **2–3 topics within the same module**, mirroring how the papers open a question with computation and continue into an applied context, or move from rearranging a formula into a word problem. Single-topic recipes remain for drill items.
- **Chaining:** "hence, or otherwise" across parts, with follow-through rubric wording (already in prompt v10) now meaningful because the chain lives inside one question.
- **Session builder:** a 15-minute session becomes one or two paper-shaped questions (or a mix of one question plus drill items), not eight fragments. Weakest-first now selects the question whose objective set best covers the student's weak objectives; the M1 prerequisite gate is unchanged.
- **Matrix recomputation:** P2 targets are already measured in rubric marks, so recompute the 400 target in **marks, not question counts** — expect the headline number to move; that is correct, not a regression. P1 stays item-counted at 160.

## PART 3 — Tables that can be completed (Claude Code item 1 — top priority)

Worth 7 of 10 marks in the sequence question in each of 2023, 2024 and 2025, and the vehicle for the CF/tally table in 2025.

- `dataTable` gains **completable cells**: a cell is either a printed value or a slot reference. Blank cells render as input fields bound to slots.
- **Scaffolded expression cells:** a cell may be a template containing blanks (a structured expression with gaps to fill, ending in a value) — each blank is its own slot. This is how the paper walks a candidate from arithmetic to a general rule; a value-only cell cannot express it.
- **The `n` row:** a final row whose cells are answers in terms of `n`, with `answer_format: 'equation_form'` where the paper demands an expression.
- **Reverse rows:** a row where a later column is given and earlier columns are the answers (the "given the totals, find the figure number" shape).
- Verification extends: table cell answers must be consistent with the stated sequence/data — the same intrinsic-consistency principle as visual verify.

## PART 4 — Figure work (Claude Code items 2–5, all included)

**4.1 Fine sub-grid and plotted points (item 2 — every graph figure, all five years).** `coordinateGrid`, `travelGraph`, `cumulativeFrequency` gain a fine sub-mesh under emphasised unit lines (paper uses a 2 mm mesh) and the ability to mark plotted points on a drawn curve. This is what makes "read the value at x = 1.5" or "how many took at most 32 minutes" legitimate rather than guesswork.

**4.2 Partially-drawn charts (item 3 — 2022, 2023).** A chart may render in an incomplete state as the question's premise: `barChart` with some categories drawn and others empty; `cumulativeFrequency` as plotted crosses with no curve. The completion itself is a drawing act and stays out of scope, but every downstream demand (modal category, probability, sector angle for a pie chart, reading from the curve) is assessable and currently unreachable.

**4.3 Prisms in perspective with shaded cross-section (item 4 — 2024 Q6).** `compositeShape` gains perspective solids with a shaded cross-section, beyond today's cuboid/cylinder/triangular prism: **trapezoidal prism** first (the 2024 gold-bar shape), plus the equal-volume cuboid comparison. This reverses R1.6 §6's deferral, which is now costing a recurring question.

**4.4 Two-way table (item 5 — 2025 Q5c).** Contingency table with row/column totals, feeding conditional-probability demands. Built on the PART 3 table work; some cells completable.

**4.5 Labelled trapezium / quadrilateral as a plane figure (item 5 — 2019, 2023).** Parallel-side marks, marked angles, given side lengths; the standard Section I geometry figure. Extend `polygonMarkedAngle` rather than adding a template if the parameters fit cleanly.

**4.6 Cone and sphere (item 5 — 2027 formulae sheet).** Build them, and build them with the measurement work rather than last. Rationale corrected: CXC added cone volume, curved surface area, sphere surface area and sphere volume to the 2027 sheet, and a formula is placed on the sheet because it will be examined. Absence from pre-2027 papers is evidence about the old syllabus, not the one we are building for. Include right circular cone (with slant height labelled), sphere, hemisphere, and composite solids combining them with a cylinder or prism.

## PART 5 — Definition of done

1. Slots landed with additive backfill; all 123 approved questions still valid and reviewable; rubric rows reference slots; per-slot marking, formats and response modes tested.
2. Explain slots no longer exile their whole part from graded sessions; transformation-description family auto-marked (regression test).
3. Paper-shaped generation produces 9–12 mark, multi-part, multi-topic-within-module questions; drill items still generable; matrix recomputed in marks with the dashboard updated.
4. `dataTable` supports completable cells, scaffolded expression cells, an `n` row and reverse rows, with cell-consistency verification.
5. Fine sub-mesh + plotted points on all three graph templates; partially-drawn bar chart and CF-crosses states; trapezoidal prism in perspective with shaded cross-section; two-way table; labelled trapezium; cone, sphere, hemisphere and composites.
6. Part 0 prompt work live and measurable: report context-category distribution and the share of context-free P1 items in the next batch.
7. Tests green, typecheck and build clean, kill-list greps zero. Report per-topic acceptance rates on the first paper-shaped batch.

## PART 6 — Not in this round

Full simulated-paper assembly (now a real feature rather than a verification script, but after the bank has paper-shaped questions in it); construction/drawing response types; three-level part nesting as a tree; multi-topic across modules.
