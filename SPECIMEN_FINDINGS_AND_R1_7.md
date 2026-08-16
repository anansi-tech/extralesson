# SPECIMEN_FINDINGS_AND_R1_7.md

**Sources studied:** `design/reference/CSEC-Mathematics-2027-Specimen.pdf` (Papers 01, 02, 032 + official keys and mark schemes, SPECIMEN 2025 for first examination 2027), `CSECMayJuneMathematicsSubjectReport.pdf` (May/June 2025), `CSEC_Mathematics_P1_2024_MJ.pdf`.

**Rule unchanged:** these are calibration material. No CXC stems, values, contexts, options, or answers enter prompts, the bank, fixtures, or tests. Conventions, structures, and documented student errors are facts about the exam and may be encoded.

---

## PART A — What the specimen VALIDATES (no action, but now evidence-backed)

1. **CK/AK/R is the real marking vocabulary.** The official Paper 02 mark scheme allocates marks literally as `CK1`, `AK1`, `R1` with a per-question profile total row (CK / AK / R / Total). Our rubric architecture is not an approximation of the exam — it is the exam's own notation.
2. **Every Paper 01 item carries a cognitive level.** The specimen key tags each of the 60 MCQs with topic, specific objective, CK/AK/R, and answer. Our per-MCQ `profile` field is correct and required.
3. **Blueprint marks and paper timings** match what we seeded (P1 60 items / 90 min; P2 2 h 40 min).
4. **Modules map to paper sections** (see B1) exactly 3 questions per module, as seeded.

## PART B — CORRECTIONS to land (R1.7)

### B1. 2027 Paper 02 has THREE sections — one per module
Sections I, II and III carry three questions each, headed by module name (Module 1 – Fundamentals of Secondary-Level Mathematics, etc.). The legacy "Section I / Section II with topic-block headers" is gone. **Action:** `legacy-jan` display copy must not describe module sections; `modular-2027` copy should use the module-section framing. Verify the seeded P2 blueprint's per-module question count is 3 (expected: already correct).

### B2. The 2027 formulae sheet is EXPANDED — this changes question design
New on the sheet versus the legacy paper: volume of right circular cone/right pyramid, curved surface area of a cone, surface area **and** volume of a sphere, `C = πd`, **simple interest**, **compound interest**, **Pythagoras' theorem**, and the **counting formula `n(A∪B) = n(A) + n(B) − n(A∩B)`**.
**Action (prompt v7 + style spec A2):** questions may freely assume all of the above are supplied. Do **not** generate items whose difficulty rests on recalling these formulae — the marks are for selecting and applying the right one. This directly affects Consumer Arithmetic (SI/CI are now given), Measurement (spheres/cones now in scope for computation), and Sets (union counting given).

### B3. Rubric criteria must adopt the official descriptor conventions
The mark scheme uses a small, consistent descriptor vocabulary. Encode it in the rubric-writing prompt and in `STYLE_SPEC` (this is Part C below). Our current criteria are prose paraphrases; aligning them makes both the review queue and R2's grader examiner-shaped.

### B4. Answer *form* earns a Reasoning mark
The scheme awards an `R` mark explicitly for expressing a result in the required form (e.g. standard form) separately from the `CK` mark for the value. This validates R1.6 §2 and sharpens it: **when a form is demanded, the rubric must carry a distinct mark for the form**, and format-aware equivalence must be able to award the value mark while withholding the form mark. Update `answer_format` handling accordingly — partial credit, not binary rejection.

### B5. Paper 01 items escalate CK → AK → R *within each topic block*
The specimen key shows items grouped by topic in blocks of 2–4, ordered by cognitive demand (concept first, procedure(s) next, reasoning last). **Action:** the P1 recipe generator should emit topic blocks in that order rather than sampling profiles independently — it makes generated practice sets feel like the real paper and gives students the same ramp.

### B6. Paper 032 exists and matters for the January cohort
Paper 032 is the alternative to the SBA for private candidates. Our January re-sit users may well be private candidates. **Not building it** — but the coverage statement (R1.6 §3) should name it so nobody assumes we prepare them for it.

---

## PART C — MARK SCHEME CONVENTIONS (permanent design asset)

Append to `design/STYLE_SPEC_AND_EXEMPLARS.md` as Part A6. All rubric criteria — generated, reviewed, and used by the R2 grader — follow these:

- **`CAO`** — "correct answer only". Used where the mark is for the final value with no method credit. Typically a `CK` mark.
- **`method/process`** (also "computation/method/process") — awarded for a correct procedure irrespective of arithmetic slips downstream. Typically `AK`.
- **Follow-through is standard and is marked by quoting the candidate's own value** (the scheme writes the possessive in quotes, e.g. dividing by "their" earlier result). A later mark is earned when the method is right and the input is the candidate's own earlier answer, even if that answer was wrong.
- **`R` marks** attach to: forming a correct equation from words, choosing/justifying a valid method (e.g. applying Pythagoras' theorem, substituting a ratio), stating a result in a required form, describing or interpreting a result, and reading correctly from a diagram or graph.
- **Profile totals close every question**: rubric mark_values must sum per profile and overall — already enforced by Zod, now with an exam-derived justification.

**Why this matters more than it looks:** follow-through marking is the single biggest fidelity gap in our current grading. Today a student who slips once scores zero on the whole chain; in the real exam that student earns most of the marks. Implementing follow-through is both accuracy *and* the difference between a tool that discourages and one that teaches.

---

## PART D — MISCONCEPTION SEED LIBRARY (from the May/June 2025 subject report)

Examiner-documented, region-wide candidate errors. Seed `lib/misconceptions/` with these and feed them into generation prompts as the misconception families for the relevant objectives. Written in our own words; each is a real error pattern with a real fix.

**Consumer Arithmetic**
- Compound interest: computing the accumulated amount and forgetting to subtract the principal when the question asks for *interest*.
- Compound interest: applying the simple-interest formula instead.
- Percentage questions: computing the *amount* when the question asks for the *percentage*.
- Order of operations: performing the bracket multiplication correctly, then applying the remaining operations out of sequence.

**Algebra / Functions**
- Factorisation: correct factor pair but wrong sign inside a bracket.
- Transposing to find an inverse function: errors swapping and isolating the variable.
- Composite functions: after forming the composition and solving, giving only one root when the equation has more.

**Relations, Functions & Graphs**
- Axis of symmetry stated as a bare number rather than an equation of a vertical line.
- Reading features off a curve (roots, intercept, minimum) but expressing them in the wrong object type (value vs coordinate vs equation).

**Statistics**
- Range reported as an interval rather than a single value.
- Mode confused with median; and reporting the modal *frequency* instead of the modal *value*.
- Cumulative frequency column completed correctly while the plain frequency column is not.

**Geometry / Transformations**
- Enlargement: describing the transformation but failing to identify the centre of enlargement — the most-missed element.
- Transformation described on the diagram correctly but recorded inaccurately in the written answer.

**Patterns**
- Next figure in a sequence drawn with the correct shape count but wrong orientation (earns partial credit — mirror this in rubrics).

---

## PART E — CTO DIRECTION: what actually makes this the best option for students

The specimen changes my view of where the moat is. Three priorities, in order:

1. **Follow-through grading is the killer feature, not photo capture.** Every competitor marks final answers. The real exam pays for method, and pays *again* on your own wrong number. A tutor that says "your value was wrong at step 2, but your method after that earned 3 of 4 marks — here's the one slip" is teaching exam technique, which is exactly what the extra-lessons market believes it is buying. This becomes R2's headline requirement, and Part C gives us the official vocabulary to implement it.
2. **Coverage honesty plus the mark-scheme profile is a report no one else can produce.** We can already tell a parent: your child earns AK marks reliably and loses R marks — she can *do* the maths but not *set up* the problem. That diagnosis, in CXC's own profile language, is worth more than a predicted grade and is impossible for a quiz-bank competitor to fake.
3. **Calibrate the prediction against reality before launch.** With CK/AK/R data per attempt and the official profile totals, our estimate should be checkable. Use the subject report's performance commentary as a sanity anchor, and state the model's assumptions in the UI. A predicted grade that survives contact with January results is the asset that sells May/June.

**Sequencing:** land R1.7 (Part B) with the misconception seed (Part D) → resume bank scale-up under prompt v7 → R2 = examiner engine built on Part C conventions, with follow-through as a first-class requirement and the golden-set eval gate now measurable against real mark-scheme allocations.

## PART F — Definition of done (R1.7)

1. Style spec gains Part A6 (mark-scheme conventions) and an updated formulae-sheet section per B2; prompt v7 recorded.
2. Rubric generation emits criteria in the official descriptor vocabulary; existing approved questions are **not** retro-edited (they remain valid), new generation follows the convention.
3. `answer_format` supports partial credit: value mark awarded, form mark withheld, with targeted feedback.
4. P1 recipes emit topic blocks ordered CK → AK → R.
5. Misconception library seeded from Part D and wired into generation prompts.
6. Display copy corrected for the three-section module structure; Paper 032 named in the coverage statement.
7. Tests: format partial-credit cases; P1 block ordering; rubric-descriptor lint (criteria use the approved vocabulary).
