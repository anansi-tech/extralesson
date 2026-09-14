# Response consistency closure

This closes the approved configuration-cleanup scope from the held-question and response-consistency follow-ups. It records only content/configuration work already reviewed against the existing CXC/CSEC-style criteria. No new marking mechanism, special-case grader, response-mode conversion, mark redistribution, or attempt rewrite was introduced.

## Applied work

| Scope | Result |
| --- | --- |
| Prompt/instruction cleanup | Applied to 66 questions, including all 21 held questions, 037e5d d.iii, and 45 questions from the separate missing-explanation-instruction inventory. |
| 797be2 | Applied as a separate review: the unsupported symmetry inference was replaced by evidence-based histogram language, and the existing follow-through decision rule was clarified. |
| Priority explanation exemplars | Applied to five questions in `repair-explanation-exemplars.ts`. |
| Final explanation exemplars | Applied to the remaining 14 reviewed questions in `repair-final-explanation-exemplars.ts`. Fifteen photo-assessed explanation slots now have full-credit examples that demonstrate every attached criterion. |

The final repair changes only `parts` and the derived `final_answer`. Both exemplar scripts now check the full reviewed authored context against the committed fixtures (allowing the approved wording cleanup), as well as the prior canonical answer and alternatives. They validate every question before writes, use `updated_at` as a concurrent-edit guard, and are repeatable. They do not read or write historical attempts.

Review follow-up: `037df1` now explicitly uses $x=60$ to compare Mango juice's $120°$ with Sorrel's $90°$, Coconut water's $90°$ and Mauby's $60°$, in both its canonical explanation and alternative. Its prior applied exemplar is retained as an exact reviewed migration source. No rubric, mark allocation or response mode changes. `tests/exemplar-review-guard.test.ts` covers changed context/rubric/status/mode/dependencies/prompts/final answers, approved wording, timestamps, repeatability and the one-record exemplar upgrade.

Following user approval, the follow-up applied exactly one bank record (`037df1`); the post-apply preview reported 14 reviewed and zero changes remaining. Both exemplar batches passed the strengthened context guard. Verification: 285 focused tests and TypeScript passed; no historical attempts were read or written. The follow-up is not yet committed or pushed.

```sh
pnpm exec tsx scripts/review/repair-final-explanation-exemplars.ts
pnpm exec tsx scripts/review/repair-final-explanation-exemplars.ts --apply
```

The 2026-09-13 application wrote 14 reviewed records. The immediate post-apply preview reported 14 reviewed, zero changed and zero applied.

## Intentional paper-assessment decisions

Five former conversion candidates remain photo-assessed: d9c35e, 8210c8, 9e87ad, 037c80 and d17067. Each would require a deliberate input-contract change (symbolic coordinate, unordered set, inverse preimage set, or a separated verdict/reason contract). Retaining the current paper route preserves its existing acceptance and partial-credit boundary. Their explanation instructions have already been supplied by the 66-question prompt cleanup.

The d.ii rectangle explanation in 8211c1 was re-reviewed in this final batch and already gave complete evidence, so it needed no exemplar change.

## Verification

[final-explanation-exemplars.test.ts](../../tests/final-explanation-exemplars.test.ts) covers scope, schema validation, unchanged marks/rubric/objectives/response modes, stale-content refusal, no typed marking or prefill, complete evidence and repeatability. The focused test passed 30 tests before application. Full repository verification remains required by the commit gate. No deployment, push, or Vercel check is part of this closure.
