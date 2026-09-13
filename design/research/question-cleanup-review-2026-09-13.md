# Question configuration cleanup: approved wording applied

Baseline: main `4b76f8c`. The previously approved corrections, including d0dd1a and 037e5d AK4, were already applied and were not replayed. Following explicit user authorization, the 66-record wording-only batch was applied on 2026-09-13. No historical-attempt reads or writes, paid model calls, commits, pushes, deployment or Vercel checks were performed.

## Approval and application status

The user separately approved bank application, conditional on preserving CXC CSEC alignment and the recorded first-principles decisions. All marking decisions remain held. The guarded run applied all 66 records; a subsequent read-only preview validated every current record against the approved content and reported zero remaining changes.

The guarded application command is now prepared in [repair-approved-question-cleanup.ts](../../scripts/review/repair-approved-question-cleanup.ts). Its default invocation is read-only:

```sh
pnpm exec tsx scripts/review/repair-approved-question-cleanup.ts
```

The explicitly authorized application used the same command with `--apply`. It validates every record before the first write, guards all reviewed authored fields (including absent fields), writes only specific prompt/statement paths, and skips already-applied records. A concurrent edit stops application and reports how many earlier writes completed; this is not a multi-record transaction. Attempts are never accessed. This bank application did not include a push or deployment.

Final validation: **243 tests passed across four focused suites** (application guards, wording preview, existing explanation display and the approved 037e5d correction). Prior TypeScript and kill-list checks passed; whitespace checks passed after recording application. Commit/push gates remain unchanged.

```json
{"mode":"apply","reviewed":66,"changed":66,"applied":66}
{"mode":"preview","reviewed":66,"changed":0,"applied":0}
```

The final alignment review used the recorded decisions in both follow-up documents and the local [CXC syllabus](../syllabus-2027.pdf), printed pages 4–5 (PDF pages 8–9), which define Conceptual Knowledge, Algorithmic Knowledge and Reasoning. The wording makes existing mathematical communication, comparison and justification tasks explicit while retaining all objective IDs, CK/AK/R allocations, accepted mathematical answers, formats and follow-through criteria. It adds no syllabus topics, input types, validators or special-case grading. This verifies the alignment of the wording change; it does not certify the unresolved original-bank content ambiguities as correct.

Only the approved prompt/statement paths were written. Mongoose also maintains the question's system `updated_at` timestamp. No attempt record was read or changed. The entire 797be2 record remains outside the application.

## Approved wording

- **Held batch:** 21 records, 24 explanation prompts and six statement rewrites. This covers 20 of the remaining 21 held questions plus 037e5d's pending d.iii prompt. The entire remaining record, 797be2, stays separate.
- **Missing-instruction batch:** 45 separate records, 47 prompts. Every currently flagged non-cloze, multi-slot explanation gap was reviewed. d16f74(d) is a single-slot part with its own printed instruction and is deliberately excluded; d16f74(b.reason) is included.
- Only slot `prompt` and part `statement` fields change. Slot IDs, order, response modes, canonical answers, accepted alternatives, formats, dependencies, rubric criteria/templates/hints, marks, worked solutions and final answers remain identical. No grading or input implementation changes.
- All explanation slots remain assessed from paper. The coordinate and factor-list candidates receive explicit paper instructions while their possible typed conversions remain held.
- Malformed verdicts are corrected by asking a Yes/No question in the surrounding statement, preserving existing answers and their accepted alternatives. This avoids changing “Yes” to a newly accepted “correct” or changing a CAO criterion. c75c59 now attaches the reason to the choice of average. 037c80 explicitly distinguishes inputs of the original function from outputs of the inverse relation.
- 037e5d uses the exact previously reviewed prompt: “Justify the triangle classification using its sides and angles.” Its fixture contains the applied AK4 correction.

The executable inventories are [held-question-cleanup.json](../../scripts/review/held-question-cleanup.json) and [missing-question-cleanup.json](../../scripts/review/missing-question-cleanup.json). Each contains the projected authored source fields needed for schema validation and review comparison, plus explicit wording edits. They exclude generation metadata, account data and attempts. Their snapshots are review fixtures, not replacement bank documents.

Preview either batch or both:

```sh
pnpm exec tsx scripts/review/preview-question-cleanup.ts --held
pnpm exec tsx scripts/review/preview-question-cleanup.ts --missing
pnpm exec tsx scripts/review/preview-question-cleanup.ts
```

The command has **no write path** and rejects `--apply`. It checks current authored content against the review, validates the full proposed question schema, reports changed records and continues collecting failures. A stale question must be re-reviewed. A repeat against the prepared content is a no-op. The separate guarded script described above now implements validation before writes, concurrent-edit guards (including absent authored fields), and updates limited to the approved wording paths; its authorized bank-write invocation has now completed successfully. Never replace whole question documents or update attempts. Existing commit and push hooks are unchanged; no bypass is proposed. Push remains gated because it can deploy.

## Decisions held; safe wording continues independently

| Item | Evidence and options | Recommendation |
| --- | --- | --- |
| d9c35e d.ii | `(q,p)` is a symbolic word field. A typed conversion would require deciding which spacing/parenthesis variants count; swapped `(p,q)` must fail. Retain paper, or approve the exact acceptance contract before conversion. | Retain paper now; decide alternatives before testing a one-box conversion. |
| 8210c8 a.iii; 9e87ad c.factors | The answers are factor collections. Existing unordered set inputs avoid order and box-count clues, but change the response contract. 8210c8's template also uses the student's earlier total. Retain paper, or approve unordered membership and follow-through expectations. | Retain paper now; if approved, test full schema, shape, rendering, prefill, order, existing alternatives, missing/extra/duplicate members and grading before any conversion. |
| 037c80 c.ii | The rubric says to explain the inverse's two outputs using the student's roots. A fixed `{-1,5}` check could replace that follow-through explanation with an exact answer. | Keep the clarified statement and paper prompt; decide whether only canonical roots or correct follow-through roots deserve credit before considering a set input. |
| d17067 d.ii | R1 concludes the claim is incorrect using “their” profit. A typed fixed verdict could lose follow-through. | Keep the paper verdict with grammatical Yes/No context; approve the desired follow-through contract before conversion. |
| d9c254 b.ii/c.iii; 9e87e7 c.ii; d1704a c.ii; a9f53f d.ii; c75c61 d.reason | Short property/theorem/direction/most-frequent exemplars omit one or more attached application, calculation or value criteria. Options: retain current criteria and clarify that exemplars are incomplete, or approve changes to what each row rewards. | Preserve all current rows and alternatives; prompts request the existing work. Approve any exemplar removal/expansion or credit change separately. Do not award all attached marks for a short typed phrase. |
| 804ada d.reason | R3 explicitly requires the bound `pi² < 10`; one accepted expression supplies only `90/pi² > 9`. | Keep the prompt asking for a bound, retain paper and current exemplars; decide whether the inequality alone earns R3 before changing acceptance guidance. |
| 8211a2 b.reason | CK3 names a random sample of 12 balls; accepted “sample data” omits randomness and size. Options: treat those as context, or require their explicit inclusion. | Treat sample-versus-population as the intended distinction, subject to approval. The prepared neutral data-source prompt imposes no new requirement about randomness or size. |
| 8211c1 c.ii | “They do not meet” is accepted, but R2 asks for horizontal lines or equal gradients; finite drawn segments alone do not establish parallel lines. | Approve a complete gradient/direction exemplar rather than silently removing the weak one. Current paper assessment and acceptance guidance remain untouched. |
| c75c59 d.reason | Canonical “18 is an extreme value” omits R3's effect on the mean, although another alternative mentions that effect. | Correct the sentence link and prompt now; review whether naming the outlier alone earns R3 separately. |

No choice in this table is applied by the preview. [797be2 has its own decision sheet](797be2-separate-review.md).

## Separate missing-instruction inventory: additional marking ambiguities

The prompts below supply instructions for the existing paper slots; they do not resolve the following acceptance/rubric tensions.

| Item | Evidence | Options and recommendation |
| --- | --- | --- |
| 804a29 d.image_claim / d.root_claim | The substitution-only image alternative omits R3's symmetry method. Short root alternatives omit solving work and the separate graph-intercept justification in AK4/R4. | Retain paper and ask for the existing work. Decide whether these are abbreviated exemplars or full-credit alternatives before altering them; recommend complete exemplars consistent with the current rows. |
| 804a31 d.reason; 9e87f7 d.reason | Accepted totals/ranges can omit the calculation work identified in the attached rows. | Keep the prompts requesting calculation and comparison. Clarify exemplar credit separately; preserve partial credit for the existing rows. |
| 804b34 c.decision; 0ab933 c.i | A bare “No” is canonical/accepted while attached criteria require a comparison (and, for 0ab933, a separate conclusion). | Retain paper; request the comparison already required. Recommend a complete exemplar, subject to approval, rather than converting a bare verdict to automatic full credit. |
| 9e88a2 d.ii | Three rows distinguish sample statistic, population parameter and estimation; some accepted wording leaves one of these implicit. | Retain the three-row explanation. Decide how explicit each term must be before modifying exemplars or acceptance. |
| a9f570 d.ii | Canonical `3 × 2 = 6` omits the actual pair/player identification named in R1/R2. | Keep the explicit pair/player/count prompt; review the abbreviated exemplar separately. Do not automate three marks from the product alone. |
| 037df1 d.reason | “Largest sector” may omit R2's use of the student's x to compare all sectors. | Keep the prompt requiring the existing comparison and mode interpretation; approve any exemplar changes separately. |
| c0c0ed b.mirror_line | Answer alternatives name the axis only; R1 describes identifying it from equal distances of corresponding points. It is unclear whether written justification is compulsory. | Neutral prompt asks to identify the line from corresponding vertices. Keep paper; decide whether the line alone is sufficient before a typed conversion or stricter instruction. |
| 48641b d.reason | Canonical comparison omits the complement calculation named in CK3/R2; an accepted `30% < 1/3` also mixes presentation conventions. | Keep the prompt requesting complement calculation and the decision justification. Review completeness/notation separately without silently dropping alternatives. |

All other inventory entries have straightforward instructions reflecting the current part and attached criteria. This is a response-configuration review, not an independent re-solve or diagram verification of every question. No new prevention validator or special-case grader is introduced.

## Validation

The focused regression suite checks full-schema validation, unchanged response modes and non-wording content, stable grading and prefill for canonical/wrong/empty entries, unchanged review sources, stale-content refusal, repeatability, explanation warning clearance and rendered instructions without typed explanation fields. The existing explanation-display and 037e5d correction suites are included. Results: **238 tests passed across three focused suites**; TypeScript, kill-list and whitespace checks passed. Current-bank previews validate all 66 candidates. A separate minimal-field enumeration confirmed exactly 45 questions / 47 non-cloze missing-instruction slots, with no unreviewed or extra planned slots (including null, empty and whitespace-only prompts). The preview rejects `--apply` before connecting to the bank. Static render checks are not a browser visual sign-off; rendering the unchanged d0dc72 content emits an existing Unicode en-dash warning.

## Exact proposed instructions

The following tables are generated from the reviewed JSON edits. The six statement replacements are listed after the prompt inventories.

### Held batch

| Question / slot | Existing rubric rows | Proposed instruction |
| --- | --- | --- |
| d9c254 b.ii | CK2, R1 | State the properties of equal vectors and compare your results for $\vec{AB}$ and $\vec{DC}$. |
| d9c254 c.iii | CK3, R2, R3 | State the condition for a parallelogram and use your vector results to compare both pairs of opposite sides. Give your conclusion about $ABCD$. |
| d9c322 c.ii | R2, R3 | Explain whether your number of bags is a whole number, and verify it by substitution into your equation. Interpret the resulting charge in dollars. |
| d9c35e d.ii | R3 | State the coordinates of the corresponding point on the inverse graph. |
| 8049b8 c.ii | CK3 | Compare your angle of elevation at $P$ with the minimum safety angle of $25^\circ$. |
| 8049da d.ii | R2, R3 | Use your changed-rule reward outcomes to count those containing card $2$ and those containing spinner result $P$. Compare the counts. |
| 804ada d.reason | R3 | Justify your comparison of the exact pendulum length with the cord length, using a bound for $\pi^2$. |
| 8210c8 a.iii | R1 | List all the positive factors of your Figure 4 total to justify its classification. |
| 8211a2 b.reason | CK3 | Explain what data were used to calculate the range and why that supports your classification. |
| 8211c1 c.ii | R2 | Justify the relationship between $OA$ and $BC$ using their directions or gradients. |
| 8211c1 d.ii | R3 | Justify your classification of $OABC$ using its opposite sides and adjacent sides. |
| 9e87ad c.factors | R2 | List all the positive factors of the twelfth code to justify its classification. |
| 9e87e7 c.ii | CK3, R2 | State the relevant property of a parallelogram and use your vectors to compare $\overrightarrow{AB}$ and $\overrightarrow{CD}$. |
| 9e8825 d.reason | R3 | Explain how to calculate the average speed for the whole journey and why adding the three speeds and dividing by three is not justified here. |
| d16f89 c.iii | R2, R3 | Calculate $\overrightarrow{DA}$ using your position vectors, then compare it with your $\overrightarrow{AB}$ and $\overrightarrow{BC}$ using scalar multiples and direction. |
| d1704a c.ii | CK3, R3 | State the circle theorem and explain how it applies to tangent $DA$, chord $AB$ and $\angle ACB$. |
| d17067 d.ii | R1 | State whether the manager is correct, using your calculated profit. |
| d17067 d.iii | R2, R3 | Explain how the claimed profit of $\$49.50$ arose and how sales tax should be treated when calculating profit. |
| 797bfc d.conclusion | R3 | State whether the three markers are collinear and justify your conclusion using the determinant and the displacement vectors. |
| a9f53f d.ii | AK5, R2 | Use your value of $k$ to calculate $\vec{BD}$, then compare it with $\vec{AB}$ to justify the bearing. |
| c75c59 d.reason | R3 | Explain why the extreme value affects the choice of average, including its effect on the mean. |
| c75c61 d.reason | AK4, R3 | State the most frequently required number of trays and explain why this informs how many trays to prepare. |
| 037c80 c.ii | R2 | Use your roots to give the inputs of $f$ with output $0$, and explain what these become in the inverse relation. |
| 037e5d d.iii | R4 | Justify the triangle classification using its sides and angles. |

### Separate missing-instruction batch

| Question / slot | Existing rubric rows | Proposed instruction |
| --- | --- | --- |
| 6a51ef d.reason | R4 | Calculate the amount retained under Plan B for 8 trays and compare it with $\$20$. |
| 6a52bb d.ii | R3 | Compare your sample mean with 8 hours to justify whether the sample supports the claim. |
| d9c276 d.reason | R3 | Compare your angle of elevation with the requirement that it be less than $20^\circ$. |
| d9c2c9 c.reason | R2 | Compare your rod length with the acceptance limit of $6$ m. |
| d9c388 d.reason | R4 | State whether the beacon lies on ray $AB$ and justify your answer by relating its displacement from $A$ to $\overrightarrow{AB}$. |
| d9c3c1 d.reason | R2, R3 | Compare your experimental and theoretical probabilities to justify your decision about the calibration. |
| d9c3db d.reason | R3 | Compare your probability from (c) with $\frac{1}{3}$ and justify the decision about using the moisture test. |
| d9c40e c.ii | R2 | Interpret your new x-intercept in terms of the number of bags sold and the net amount after the additional transport charge. |
| 804a29 d.image_claim | R3 | Assess the image claim using symmetry of your graph and your image of $3$. |
| 804a29 d.root_claim | AK4, AK5, R4 | Solve your equation $gf(x)=0$, and use the graph intercepts to justify your decision about the one-root claim. |
| 804a31 d.reason | AK4, R2 | Calculate the number of unused vouchers using your number of booklets and customers receiving vouchers. Compare it with your number who bought neither item. |
| 804a74 c.reason | CK3, AK3 | State the magnitude required for a unit vector and calculate the magnitude of the given vector to support your answer. |
| 804aa6 c.ii | R1 | Explain why the stated property applies to the number of crates of each type of bar. |
| 804b34 c.decision | R4 | State whether Kemar retains at least $\$1\,210$, comparing this target with your retained amount. |
| 8210f0 d.reason | R1, R2, R3 | Compare your median and range with both clinic limits and explain whether the required conditions are satisfied. |
| 9e87f7 d.reason | CK3, R2, R3 | Show how to find the range for each year from its greatest and least attendance, then use the ranges to support your choice. |
| 9e8854 c.ii | R3 | Give the tangent-radius justification used in finding $\angle TAB$. |
| 9e88a2 d.i | R2 | State whether the manager's statement is justified. |
| 9e88a2 d.ii | CK3, CK4, R3 | Identify the sample statistic and the population parameter, and explain what the sample tells you about the mean for all 180 customers. |
| 9e88ce d.reason | R3 | Compare your angle $QPR$ with $90^\circ$ to justify its classification. |
| 9e8942 b.ii | R1 | State the tangent-chord theorem used in finding $\angle TAB$. |
| d16f5f d.reason | R1 | State the property of the tangents from $T$ that justifies the equal angles. |
| d16f74 b.reason | R1 | Give the frequency that justifies your choice of modal interval. |
| d16fe7 d.ii | R3 | Explain why two complete lengths of edging are insufficient, comparing their total length with the required length. |
| 004444 c.ii | R2, R3 | State the other algebraic solution and explain why it cannot be a figure number. |
| 0ab933 c.i | R2, R3 | Compare your percentage of suitable beans with the 90% requirement and state whether the harvest is accepted. |
| 0ab945 c.ii | R3 | Justify the other time using the axis of symmetry of the height graph. |
| d0dc72 d.reason | CK4, R2 | Compare your estimated mean and semi-interquartile range with both stated acceptance limits. |
| d0dc8f b.ii | R1 | Explain how reflection in $AD$ determines the position of $D$ on $BC$. |
| d0dd05 d.reason | R3, R4 | Calculate how much fabric would remain for one more costume than your proposed maximum. Compare with the 15 m requirement to justify the greatest whole number. |
| d0ddb0 d.reason | R3, R4 | Interpret your determinant in terms of scalar multiples of the route vectors, and use this to justify whether the routes are parallel. |
| 797b9e c.reason | R3, R4 | Use the frequencies and your mean to explain whether your chosen whole number satisfies both conditions. |
| 797ba6 d.ii | R4 | Identify the accepted pairs and justify them by testing divisibility of their products by your number of commuters who used both routes. |
| 797c8b d.reason | R3 | Compare $170\text{ m}^2$ with your allowable area interval to justify whether the claim is reasonable. |
| 797c98 d.reason | R2, R3 | Explain how the translation and rotation affect side lengths and angle sizes to justify the relationship between the triangles. |
| a9f51d d.ii | R3 | Compare $3760\text{ m}^2$ with your minimum possible area to justify your decision. |
| a9f556 d.reason | R3 | Determine whether $120^\circ$ is a whole-number multiple of your smallest angle of rotation, and use this to justify your decision. |
| a9f570 d.ii | R1, R2, R3 | Use your two-member subsets for the netball-only pair, identify the possible players who play both sports, and combine the choices to justify the team count. |
| a9f5a7 d.reason | R2, R3 | Use your value of $k$ to calculate $\vec{AD}$ and compare it with $\vec{AB}$. Explain what the scalar multiplier tells you about the positions of $A$, $B$ and $D$. |
| a9f5bc d.reason | R3, R4 | Use your roots to identify when the balance is negative, and explain what this means for the water supply over the stated period. |
| c0c045 c.reason | R1 | Use the frequencies or sector sizes to justify the modal method of travel. |
| 037df1 d.reason | R2, R3 | Use your sector angle to compare the chosen drink with every other sector, and explain how frequency determines the mode. |
| 037e89 d.reason | R3 | Link your chosen preparation plan to the greatest daily earnings. |
| c0c0ed b.mirror_line | R1 | Identify the mirror line from the positions of corresponding vertices. |
| 9cc68d d.reason | R4 | Compare the ordinate of your plan with the corresponding ordinate on the curved guide to justify your decision. |
| 48641b d.reason | CK3, R2 | Use the complement of your percentage taking at most 30 minutes to calculate the percentage taking more than 30 minutes, and justify the decision about the claim. |
| e5141b a.reason | CK1, AK1, AK2 | Give and compare the standard deviations for the two days, and explain how standard deviation relates to consistency. |

### Statement replacements

All slot order and identities are retained; `{}` denotes an existing slot.

**8049da (d)**

Anisa says that, under the changed rule, a reward recipient is twice as likely to have drawn card $2$ as to have spun $P$. Is Anisa correct? {}. This is because {}.

**9e8825 (d)**

Nia says that the average speed for the complete journey is found by adding the three speeds and dividing by $3$. Is Nia correct? {}. Average speed is found by {}.

**d16f89 (c)**

The position vector $\overrightarrow{OD}$ is {}. Is Devon correct that $D$, $A$, $B$ and $C$ lie on one straight route? {}, because {}.

**d17067 (d)**

The actual profit on one fruit basket is {}. Is the manager correct that the profit is $\$49.50$? {}, because {}.

**c75c59 (d)**

The most appropriate average is {}, and its value is {}. This choice of average is appropriate because {}.

**037c80 (c)**

For the original domain, the inverse relation $f^{-1}$ is a function: {}. The inputs of $f$ with output $0$, which become outputs of $f^{-1}$ for input $0$, are {}. On the right-hand branch, a suitable restricted domain for $f$ is {}.
