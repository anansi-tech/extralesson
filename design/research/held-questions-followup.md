# Held question configurations: follow-up review

Reviewed 2026-09-13. Read-only inspection of all 22 held records. No bank changes or new grading logic. This reviews response configuration and rubric alignment; it is not an independent re-solve of every question or diagram.

## Decisions requiring approval

### 037e5d — keep exact form; do not invent a rationalisation requirement

The flagpole geometry is consistent: h = d, d = 20/(sqrt(3)-1) = 10(sqrt(3)+1), h approximately 27.3 m. Part (c) asks for exact form, and explicitly accepts the unrationalised fraction. But AK4 says "Rationalises the denominator" and is not flagged as a form mark. Consequently the question fails the schema's exact-form/paid-mark rule.

Recommendation: preserve all 12 marks and the profile split; make AK4 the exact-form mark for the correct value, accepting both existing exact expressions. Update its criterion/template to match and set for_format true. Keep the existing calculation criteria R1/R2/AK3 and the separate 3-significant-figure mark in (d). Add the already-reviewed d.iii paper prompt. This changes the written AK4 criterion and its form classification, so approval is needed before applying. Do not merely remove exact form or mark rationalisation compulsory when the question does not ask for it.

Subsequently approved and applied: AK4's criterion/template now reward the correct exact value, and for_format is true. All 12 marks, profiles, accepted answers and historical attempts are unchanged. `scripts/done/repair-037e5d.ts` preview and post-apply verification passed (changed: false). Tests confirm both exact forms earn all four part-(c) marks; an equivalent decimal earns the three calculation marks only; wrong and blank entries earn none. Four focused suites passed 124 tests, with type checking and whitespace checks also passing. This application changed AK4 only; the separate d.iii prompt is not yet applied. No grading-code change or deployment was needed.

### 797be2 — do not infer symmetry solely from equal mean and median

The histogram has equal-width bins 20–30 through 60–70 and frequencies 4,7,12,9,8. Its grouped mean and estimated median are both 47.5, but equal mean/median alone does not establish symmetry. The frequency pairs are not mirror images. "Approximately symmetrical" may be a judgement, not a conclusion forced by the numerical equality.

Recommendation: review the intended distribution-description criterion using the actual histogram, allowing defensible descriptions rather than enforcing one unsupported inference. Keep this explanation photo-assessed. Separately, d.iii's acceptance decision follows the printed median ± semi-IQR rule and can be considered for a typed verdict; do not bundle the symmetry decision into that conversion.

### Accepted explanations versus criteria

Some accepted phrases give only part of what the rubric requests. Keep those explanations photo-assessed, with explicit instructions matching all criteria. Do not convert them to exact-match blanks that would award every attached mark for a short phrase. Removing/narrowing an accepted exemplar affects marking expectations and should be approved with its rubric review.

## All 22 records

| Question | Finding and proposed next action |
| --- | --- |
| d9c254 | b.ii and c.iii require a property AND its application to the calculated vectors. Add explicit paper prompts for both; preserve photo assessment and criteria. |
| d9c322 | c.ii requires whole-number feasibility and verification by substitution. Prompt both explicitly; preserve both marks. |
| d9c35e | Symbolic (q,p) is currently classified as one word field, not a numeric coordinate grid. A one-box typed answer can work; approve explicit spacing/parenthesis alternatives and regression-test swapped (p,q). No new symbolic-coordinate parser needed. |
| 8049b8 | c.ii is a comparison stated in words with an angle. Add a specific photo prompt comparing with the minimum; avoid turning a varied explanation into exact phrase matching. |
| 8049da | "Anisa is Yes" is malformed. Canonical should be "correct"; retain intentional shorthand alternatives if desired. Add a paper prompt asking for the two outcome counts. Keep answer/template/final-answer copies consistent. |
| 804ada | The reason criterion specifically requires pi² < 10, but one accepted expression omits it. Prompt the required bound and review the incomplete exemplar; keep photo assessment. |
| 8210c8 | Store the factor collection as {1,17}, using the existing unordered, count-neutral set input, if conversion is approved. The answer is a collection of factors, not prose. Update canonical/template copies together. |
| 8211a2 | "sample data" identifies the relevant distinction; the criterion names a random sample of 12. Decide whether those extra details are required or simply contextual. Add the paper prompt; do not silently narrow accepted reasoning. |
| 8211c1 | Add separate photo prompts for the parallel-line and rectangle justifications. "They do not meet" is weak evidence for drawn segments; review that accepted exemplar against the actual gradient criterion. |
| 9e87ad | Store factors as {1,7,13,91} and use the existing count-neutral set input if approved. The present comma-list shape exposes four boxes and imposes order; neither is appropriate for listing factors. |
| 9e87e7 | c.ii requires the equal-and-parallel property and the specific vector equality. Add a paper prompt requesting both; retain photo assessment. |
| 9e8825 | "Nia is No" should be "Nia is incorrect". Keep the reason photo-assessed, asking why total distance/total time is required. Actual times are 0.5,0.5,1 min, so unweighted averaging is not justified here. |
| d16f89 | "statement ... is Yes" should use "correct". Keep the vector calculation and scalar-multiple explanation on paper; align the CAO wording/template with the grammatical verdict. |
| d1704a | Theorem name alone supplies only one of two explanation criteria. Prompt the theorem and its application to DA, AB and ACB; keep photo assessment. |
| d17067 | "claim ... is No" should be "incorrect" and can be a short typed verdict. Keep the separate two-criterion tax explanation photo-assessed. Align the canonical and dependent template/final-answer text before applying. |
| 797be2 | Symmetry criterion needs the decision above; do not claim it is proved merely by equal mean/median. The acceptance verdict is a separate configuration candidate. |
| 797bfc | The final slot contains both a collinearity conclusion and its justification. Keep it photo-assessed with an explicit prompt to state and justify the alignment; no need to split IDs or add a grading mechanism. |
| a9f53f | d.ii requires calculating BD using k, then comparing BD with AB. Prompt both. Generic same-direction prose alone should not automatically earn the calculation mark. |
| c75c59 | "Its value is 2 because 18 is extreme" links the reason to the wrong assertion. Reword the statement so the reason justifies the choice of average; prompt the outlier's effect on the mean. Preserve photo assessment. |
| c75c61 | The reason has a modal-value criterion and an interpretation criterion. Prompt both the most frequent value and why it informs preparation. Review generic accepted prose that omits the value. |
| 037c80 | Use the existing unordered set representation {-1,5} for the two preimages if approved. Clarify that these are inputs of f and outputs of its inverse; keep the same two numbers and marks. |
| 037e5d | Exact-form/rationalisation mismatch requires the approved policy choice described above; the numerical answer itself is correct. |

## Diagnostic evidence

Read-only local checker probes confirmed:

- (q,p) is one word field; canonical input passes and swapped (p,q) fails.
- "1 and 17" is currently a word field, while "1,7,13,91" is an ordered four-value list whose count is displayed.
- {1,17}, {1,7,13,91}, and {-1,5} are unordered sets; showsBoxCount is false and reordered correct values pass the existing checker.

These probes establish representation feasibility, not a release-ready correction. Before applying a conversion, test full-schema validation, prefill, exact/alternative/wrong/missing/duplicate members, UI rendering and preservation of existing criteria. No paid model calls were used for this review.

The separate missing-instruction inventory outside these 22 questions has not yet been reviewed in this follow-up.
