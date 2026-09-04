# R5 Task 1 gate — 4 September 2026 — BELOW

Measured on `1499ddd` (template on rubric rows, claims rendered for the
student, prompt rules their-values / their-fully / quote-the-result replaced
by one sentence). Five runs each, `scripts/eval-marker.ts` with and without
`--reasoning`. Reference figures are the last runs before R5 (`3dbc2e2` plus
the c0bf13 AK2 correction).

| eval | before R5, worst / median / best | R5, worst / median / best | CAO false | method false |
|---|---|---|---|---|
| reasoning rows (57) | 86 / 89 / 91% | 82 / 84 / 86% | 0 | 0 |
| full (185) | 89 / 90 / 91% | 83 / 86 / 88% | 0 | 1–2 |

**Agreement fell, so the gate is not met.** CAO false awards stayed at 0.

The four pages the spec names:

| page / row | before R5 | R5 |
|---|---|---|
| 797bbe R3, R4 | awarded in 4 of 5 runs | withheld in every run |
| d1705a R1 | awarded in 4 of 5 | withheld in every run |
| c0bf13 AK2 | awarded (agrees) | agrees; c0bf13 R3 now withheld in 4 of 5 |
| b1a6a2 AK5 | agrees | agrees; CK4 withheld as before |

Why: rendering touched 9 of the 185 golden rows, and none of the rows on
797bbe or d1705a. Their claims carry no slot value to render — "concludes
suitable", "states that their output is greater than the minimum",
"obtains AC = 3 × their AB" turn on a conclusion, a direction and a scalar
that are derived from the student's values, not stored as them. The deleted
rules were what carried those cases; the rendered claim cannot, on this
bank, with the template the deriver can write.

Audit of the live bank, same day (`calibration/rubric-template-audit.md`):
5771 rows, 809 templated, 4389 unchanged, 573 ambiguous (523 a literal that
is both a question constant and a value in scope, mostly small integers; 47
a literal matching two slots).

## Rules and templates coexist — `562c423`, same day

The follow-through paragraph restored under the R5 sentence (quantity,
conclusion, comparison direction, scalar; one example each), templating and
rendering kept. Five runs each.

| eval | pre-R5 | R5 alone | rules + templates | CAO false | method false |
|---|---|---|---|---|---|
| reasoning rows (57) | 86 / 89 / 91% | 82 / 84 / 86% | 84 / 89 / 91% | 0 | 0 |
| full (185) | 89 / 90 / 91% | 83 / 86 / 88% | 85 / 89 / 90% | 0 | 1–2 |

Median and best are back to the pre-R5 figures; the worst run is two to
four points under, which is inside the spread the same prompt has shown
between runs. 797bbe R3/R4 and d1705a R1 agree again in most runs; c0bf13
AK2 and b1a6a2 AK5 agree in every run.
