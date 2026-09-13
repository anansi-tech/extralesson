# Response consistency follow-up

Branch: `fix/question-response-consistency`. Preparation only; no live writes or deployment.

## Prepared: 32 questions / 33 explanation prompts

The E/M explanation candidates from the 84-question inventory have individually written prompts in `scripts/done/explanation-prompts-2026-09-13.json`. The apply script excludes 037e5d because its existing schema fails validation (see below). The mixed questions retain the answer-mode changes already deployed.

The existing statement and slot identities remain intact. Instead of rendering an explanation as a disabled-looking input, the card shows `[reason N below]` and places its specific instruction underneath, with an instruction to write on paper using the existing part/slot label. Existing records without a specific prompt get a generic completion instruction until reviewed. Numeric/word answer inputs, exact cloze matching, photo assessment, criteria and marks are unchanged. Admin warnings still identify unprompted explanation gaps; correctly prompted explanations no longer receive that warning.

This uses the existing slot `prompt` field: no new schema or matching mechanism. A small display change is necessary because the old cloze renderer ignored that field. This intentionally adjusts the earlier proposal to rewrite whole parts: removing the statement would change the word-blank matching contract and sentence context.

Preview:

```sh
pnpm exec tsx scripts/done/repair-explanation-prompts.ts
```

After visual approval and deployment of the display change:

```sh
pnpm exec tsx scripts/done/repair-explanation-prompts.ts --apply --display-deployed
```

The flag acknowledges deployment, not an automatic check. All candidate questions pass full schema validation before any write. Reviewed parts, rubric, stimulus and figure are checked against the inventory, and each write uses a concurrent-edit guard. A repeat run is a no-op. A concurrent edit during application can leave earlier records applied; the script stops and reports that condition. Historical attempts are never updated.

## d0dd1a: rounding decision approved; correction prepared

The stored interpolation gives Q1 = 18.9444..., Q3 = 28.25, IQR = 9.3055...; the published 18.9, 28.3 and 9.3 are consistent with rounding at the end. This is not an arithmetic error.

The schema problem is real: lower and upper quartiles each declare `dp:1` but neither has a form-mark row. One R3 mark, attached only to the IQR slot, says it rewards formatting all three values. The current checker evaluates form per slot, so that row cannot enforce all three. Marking AK3/AK4 as form rows would turn their entire calculation marks into formatting marks and is not a safe repair.

Recommended content-only decision for approval: keep 12 total marks and the existing profile split; make R3 explicitly reward the IQR's one-decimal-place form only, remove the unpaid answer_format declarations from the two quartile slots, and update R3's criterion/template/hint consistently. The printed instruction can still request all estimates to one decimal place; missing that form on the quartiles alone would not cost the IQR form mark. This narrows the written criterion and therefore needs explicit approval. The false/incorrect verdict can then become an answer blank.

Also fix the misleading 9.4 misconception explanation when approved: subtracting the rounded quartiles, 28.3 - 18.9, gives 9.4. The existing explanation diagnoses class limits instead and does not cover that likely cause. This is a proposed feedback correction, not applied here.

The user subsequently approved the rounding adjustment. `scripts/done/repair-d0dd1a.ts` now prepares that correction, the answer-mode verdict and the matching premature-rounding feedback. Preview passes the full schema; five regression tests verify 12/12 for canonical entries, only R3 withheld for IQR `9.30`, no formatting deduction for quartiles `18.90`/`28.30`, wrong/blank verdict rejection, and repeatability/stale-content refusal. No question-specific grading code was added. Run without flags to preview; `--apply` updates the reviewed content only. It has not been applied to the original bank question during this preparation.

## Additional hold: 037e5d

The flagpole question's c.i declares exact form without any matching form-mark row. Excluded from the 32-question prompt patch rather than bundling an unrelated marking decision into a wording correction.

## Remaining scope

The other H cases, the separate non-cloze missing-instruction inventory, and prevention rules for future generation remain open. This batch does not claim the whole bank is now consistent. Do not introduce a blocking validator before deciding the remaining response contracts.
