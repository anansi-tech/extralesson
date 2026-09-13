# Explanation exemplar repair: priority batch applied

This batch applies the existing mark-by-mark principle: an explanation exemplar must show the evidence required by the rubric rows attached to its slot. It does not add a grader, change response modes, redistribute marks, or make explanations exact-match fields. Each explanation remains assessed from the student's paper against the existing rows. Following approval, all five reviewed records were applied on 2026-09-13.

## Approved scope

| Question / slot | Existing evidence rows | Exemplar correction |
| --- | --- | --- |
| 804a29 d.image_claim | R3 | Keeps symmetry about the axis and the matching image; removes the substitution-only alternative. |
| 804a29 d.root_claim | AK4, AK5, R4 | Shows solving or factorising, both roots and two graph intercepts. |
| 804b34 c.decision | R4 | States the retained amount and compares it with the target. |
| 9e88a2 d.ii | CK3, CK4, R3 | Names the sample statistic, population parameter and estimate relationship. |
| a9f570 d.ii | R1, R2, R3 | Names the netball-only pairs, the overlap choices and the multiplication. |
| 48641b d.reason | CK3, R2 | Calculates the complement before comparing it with one third. |

The canonical explanations and declared alternatives are complete exemplars for the existing photo marker. The original abbreviated alternatives are removed because they do not establish every row attached to the same explanation slot. Students can still earn partial credit where their photographed work establishes only some rows; the rubric, not the exemplar string, determines that credit.

## Guarded application

[repair-explanation-exemplars.ts](../../scripts/review/repair-explanation-exemplars.ts) previews by default. It checks each reviewed slot has exactly the expected prior canonical answer and alternatives, validates every changed question before the first write, guards each write with the question's current update timestamp, and writes only `parts` and the derived `final_answer`. Repeated preview after application is a no-op. Attempts are never read or written.

```sh
pnpm exec tsx scripts/review/repair-explanation-exemplars.ts
pnpm exec tsx scripts/review/repair-explanation-exemplars.ts --apply
```

[explanation-exemplars.test.ts](../../tests/explanation-exemplars.test.ts) verifies the scope, unchanged marks/rubric/objectives/response modes, no typed grading or prefill for the explanation slots, complete evidence in the new canonical answers, stale-slot refusal and repeatability. It does not simulate a prose examiner or create question-specific grading logic. Post-apply preview reports five reviewed, zero changed and zero applied; 226 focused tests, TypeScript, kill-list and whitespace checks passed. No historical attempts were read or written, and no push, deployment or Vercel check was performed.

## Still separate

The remaining explanation-contract cases require their own review because their intended mark boundaries are not yet definite: 804a31, 9e87f7, 0ab933, 037df1 and c0c0ed. They are not changed in this batch.
