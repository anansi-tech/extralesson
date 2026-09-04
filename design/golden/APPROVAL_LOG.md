# Golden-set grading approval log

The overall review remains `proposed` until every entry has been checked. This
file records approval in manageable batches without changing the review schema.

## Batch 1 — approved

- `82109b`: award CK1 and AK1; withhold the remaining proposed rows.
- `d16f47`: award AK1, CK2 and R1; withhold CK1, AK2, AK3 and AK4.
- `b1a6a2`: withhold CK2 and AK2. The deterministic tolerance issue noted in
  `review.json` remains separate from this human grading decision.
- `8049da`: withhold AK1, AK2, CK2, CK3 and R1.
- `037e50`: withhold R2 and R3; award CK3, AK2 and AK3. R2 was changed from
  the provisional award because the written interval includes the break-even
  endpoints.

## Batch 2 — approved

- `c0bf69`: award CK3, AK3 and AK4; withhold R2. R2 was changed because the
  student uses the pre-charge amount rather than a post-charge balance.
- `c0bf2a`: award CK1, CK3 and AK3; withhold AK1, R2 and R3. AK3 was changed
  because all four distributed products are evident despite the exponent slip.
- `821115`: approve as fully correct; no method-marker rows remain.
- `797bbe`: award CK1, CK2, AK2, CK3, AK3, AK5 and R2 as proposed.
- `8049fc`: withhold CK2 and AK3; award CK3, R2 and R3 as proposed.

## Batch 3 — approved

- `8049c8`: withhold CK1 and AK1; award CK2, AK2, CK3 and R1.
- `d0dd05`: approve as fully correct; no method-marker rows remain.
- `797cd7`: award CK3; withhold CK4, AK4 and AK5.
- `d16fdf`: withhold AK1 and AK2; award CK3 and AK4.
- `c0c0ad`: withhold CK1.

## Batch 4 — approved

- `d0dd9b`: approve as fully correct; no method-marker rows remain.
- `a9f505`: award AK1, AK2, AK3, AK4, CK4, AK5 and R2; withhold CK3.
- `9cc685`: withhold CK1; award CK2, AK2, CK3 and AK3.
- `b1a5ae`: award CK3 and AK3.
- `a9f515`: approve as fully correct; no method-marker rows remain.

## Batch 5 — approved

- `fe84af`: withhold CK3, AK4 and R1; award R2.
- `c0bf13`: withhold CK1; award R2, AK3 and AK4.
- `d1705a`: withhold CK1 and AK1; award CK2, AK2, AK3 and AK4.
- `9e894a`: approve as fully correct; no method-marker rows remain.
- `a9f537`: withhold CK1 and AK1; award CK2, AK2, AK3, R1, CK3, AK4,
  AK5 and R2.

## Batch 6 — approved

- `9e8967`: withhold CK1, AK1 and AK3; award CK2 and AK2.
- `a9f59f`: approve as fully correct; no method-marker rows remain.
- `797c98`: withhold CK2, AK2 and AK3; award CK3, AK4 and AK5.
- `48641b`: award R1, CK2 and AK3; withhold AK2, AK4 and R3.
- `037dc7`: award CK2 and CK3; withhold AK3, AK4, R2, R3 and AK5.

## Batch 7 — approved

Rows on explain and show-that slots (HUMAN_TASKS §D), proposed 4 September
2026 from the transcript in `set.json` against the criterion in the bank and
approved by David the same day. Two proposals were changed on approval:

- `b1a6a2`: award AK5 — follow-through; their IQR of 3 is halved to 1.5.
- `d1705a`: award R1 — follow-through; AC = (-6, 2) is the scalar multiple
  of their reversed AB.

Everything else stands as proposed. The flag column records where the
transcript did not settle the verdict on its own.

Correction, 4 September: `c0bf13` AK2 flipped to award — the inverse follows
correctly from the student's own determinant of −1. The row's "stated
inverse" reads as follow-through from their determinant, which is the
marker's reading and was the review's disagreement.

| page | row | proposed | reason | flagged |
|---|---|---|---|---|
| c0bf69 | CK2 | award | The service charge is identified as 2% of the student's own $450. |  |
| c0bf69 | AK2 | award | 2% of $450 is evaluated as $9. |  |
| c0bf69 | R1 | withhold | The $9 is never deducted; no line reaches $441 or any post-charge balance. |  |
| c0bf69 | R3 | withhold | The student writes "No, US$31.25 not US$30" — a mismatch, not a "less than" comparison, and their 31.25 exceeds 30. | their value exceeds 30, so the row's "less than" cannot be made honestly |
| c0bf2a | CK2 | award | 3(x^2 + 12) uses 3 times the student's own one-tray expression. |  |
| c0bf2a | AK2 | award | The 3 is distributed to give 3x^2 + 36. |  |
| c0bf2a | R1 | award | Their expression has no like terms to collect; 3x^2 + 36 is their total for 3 trays. | nothing to collect in their expression |
| 821115 | CK2 | award | "29 has exactly 2 factors, 1 and 29" is written. |  |
| 821115 | AK5 | award | $1403.60 - $127.60 = $1276 subtracts their tax from their amount paid. |  |
| 821115 | AK6 | award | $1276 - $1050 = $226 is written. |  |
| 821115 | R3 | award | The verdict "Profit" is supported by the retained amount, the cost and the $226 difference. |  |
| 797bbe | R3 | award | With their 1.5 x 10^6 the honest conclusion is "not suitable", which is what they write. | their value inverts the scheme's conclusion |
| 797bbe | R4 | award | "1.5 x 10^6 < 8.4 x 10^6" is a correct comparison of their output with the minimum. | their value makes it "less than", not "greater" |
| 8049c8 | AK3 | award | 45.45/60 = 0.76 m/s divides their speed by 60. |  |
| d0dd05 | R3 | withhold | No eighth costume is tested and 12 m is never written; the inequality x <= 7 implies it without stating it. | an examiner may accept the inequality as the same argument |
| d0dd05 | R4 | award | -3x + 36 >= 15 solved to x <= 7, then "greatest whole number = 7". |  |
| 797cd7 | R1 | award | Their first selection {1,3} is tested with 2 and with 6 against both conditions. | their selections are {1,3} and {3,4}, not the scheme's {2,3} and {3,6} |
| 797cd7 | R2 | award | Their second selection {3,4} is tested with 2 and with 6 against both conditions. | as R1 |
| 797cd7 | R3 | award | "Not possible" follows the 2 D, 1 B counts for every addition. |  |
| d16fdf | CK4 | award | 12(x - 20) >= 120 uses their break-even value of 20. |  |
| d16fdf | R1 | award | x >= 30 follows through correctly from their inequality. |  |
| d16fdf | R2 | award | "30 > 18" compares the required number with the number line's maximum. |  |
| d16fdf | R3 | award | "No" is concluded from 30 > 18. |  |
| d16f47 | CK3 | award | 1.60 m is used as the limit in "3.90 m > 1.60 m". |  |
| d16f47 | R2 | award | Their 3.90 m is compared with 1.60 m. |  |
| d16f47 | R3 | award | "Will not fit" is consistent with their comparison. |  |
| c0c0ad | CK2 | award | tan 60 = RS/QR gives RS = sqrt(3)QR — the relationship is reached, from tan rather than the triangle ratios. | all (b) working is labelled (a) on the page |
| c0c0ad | CK3 | award | 20 + QR is used as the denominator for tan 30, though PR = 20 + QR is not written as a statement. | implicit; and labelled (a) |
| c0c0ad | R1 | award | tan 30 = RS/(20 + QR) is formed. | labelled (a) |
| c0c0ad | AK2 | withhold | sqrt(3)QR is substituted but tan 30 is never evaluated; no 1/sqrt(3) appears. | labelled (a) |
| c0c0ad | R2 | award | "QR = 10, so RS = 10sqrt(3) m" establishes the result, with the solving steps omitted. | jump from the equation to QR = 10; labelled (a) |
| b1a6a2 | CK3 | award | SIQR = 3/2 halves their interquartile range. |  |
| b1a6a2 | AK5 | award (changed on approval) | The row asks for 4 / 2 = 2; the student calculates 3/2 = 1.5 from their IQR. | follow-through would award 1.5; the row is written without "their" |
| b1a6a2 | CK4 | award | Driver A is chosen on both smaller measures, which is the recognition; it is not stated in words. | implicit |
| b1a6a2 | R1 | award | "SIQR = 1.5 < 3" compares their value with 3 minutes. |  |
| b1a6a2 | R2 | award | "SD = 2.45 < 2.98" is written. |  |
| b1a6a2 | R3 | award | "Select Driver A" follows both comparisons. |  |
| 8049da | R2 | withhold | Part (d) holds only "2"; no outcomes are identified. |  |
| 8049da | R3 | withhold | No outcome containing P is identified. |  |
| c0bf13 | CK2 | award | adj A = [1 -1; -2 3] is formed. |  |
| c0bf13 | R1 | withhold | Their -1 is used in the formula but its being non-zero is never used to say the inverse exists. | implicit at best |
| c0bf13 | CK3 | award | A^-1 = 1/det × adj is written with their determinant. |  |
| c0bf13 | AK2 | award (corrected 4 Sep) | Their -1 is substituted, but the result is [-1 1; 2 -3], not the stated inverse the row names. | the act is done; the target is not reached |
| c0bf13 | R3 | award | With their -40 and -50 the honest conclusion is "No, not positive whole numbers", which is written. | their values invert the scheme's conclusion |
| d1705a | CK3 | award | AC = OC - OA is written. |  |
| d1705a | R1 | award (changed on approval) | Their AC = (-6, 2) is 1 × their AB, not 3 ×; the arithmetic is right for their reversed AB. | the multiple is 1 because AB was reversed in (a) |
| d1705a | R2 | award | "AC = AB, so A, B and C lie on a straight line" concludes collinearity from a scalar multiple. |  |
| 9e894a | R4 | award | AB : BC = 2 : 3 is found, then "B is not the midpoint of AC". |  |
| a9f537 | R3 | award | "No ... not congruent" is written. |  |
| a9f537 | R4 | award | "scale factor 2 doubles the lengths, so not congruent" gives the justification; "similar" is not said. | "similar" absent |
| a9f59f | R1 | award | "corresponding angles equal; corresponding sides in ratio 2:1" is written. |  |
| a9f59f | R2 | award | "Not congruent: corresponding side lengths not equal" is written. |  |
| 797c98 | R2 | award | "preserve lengths" is given as the reason. |  |
| 797c98 | R3 | award | "and angles" is given in the same line. |  |
| 48641b | CK3 | withhold | Part (d) holds only "1/3 = ?"; no complement is recognised. |  |
| 48641b | R2 | withhold | No percentage is determined. |  |
| 037dc7 | R4 | withhold | Only the equation n^2 - 8n + 24 = 12 is written; nothing is solved, rejected or selected. |  |

Approved: 47 awards, 10 withholds after the correction; 19 had been flagged.

## Final approval

All 30 entries were approved across the six batches. `review.json` was marked
`approved` by David at `2026-08-23T20:39:39Z`.

## Field cases — proposed

Exported from /admin/disputes by `pnpm golden:import`. Proposed until a person approves them; the loader skips them meanwhile.

- `f-20c7f7`: from a field dispute on R4, exported 2026-09-04; every row proposed, R4 disputed.

## Batch 8 — approved

- `f-20c7f7`, the cocoa page (the same page as `calibration/reads/cocoa-b1.jpg`),
  approved by David, 4 September: award CK1, AK1, CK2, AK2, AK3, R1, R2, R3,
  and CK3, AK4, AK5 as a valid alternative route — 2% of the total reaches
  24 000 without the intermediate 1 080 000. Withhold R4, the disputed row:
  24000 is not standard form. A valid alternative method earns the rows for
  the step it replaces; the marker paragraph now says so.
