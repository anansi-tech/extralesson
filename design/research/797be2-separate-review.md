# 797be2: separate content and marking review

Approved repair applied, 2026-09-13. This repair remains separate from the approved and applied 66-question wording batch.

Question: `6a854012e7fc40f429797be2`. Histogram boundaries: 20, 30, 40, 50, 60, 70 kg. Equal-width-bin frequencies: **4, 7, 12, 9, 8**; total 40. These are the stored figure parameters, not a visual estimate.

## Symmetry decision

The midpoint-weighted mean is `(25×4 + 35×7 + 45×12 + 55×9 + 65×8)/40 = 47.5`. The interpolated median is `40 + (20−11)/12×10 = 47.5`.

Part c.iii accepts “approximately symmetrical”, “approximately symmetric”, “symmetrical” and “symmetric”. R1, its template and hint require comparing the student's mean and median to conclude approximate symmetry. The worked solution makes that inference explicitly. Equality of mean and median does not establish symmetry; the histogram's opposite frequency pairs, 4 versus 8 and 7 versus 9, are not mirror images. “Approximately” has no stated tolerance or judgement standard.

Options:

1. Keep a distribution-description question and approve a rubric that assesses a defensible description using the actual histogram, with revised exemplars and worked solution. Decide explicitly whether approximate symmetry is one acceptable judgement.
2. Replace the symmetry assertion with a conclusion only about the estimated mean and median being equal. This narrows the mathematical task and changes R1's meaning, so it also requires approval.

Recommendation: option 1 if distribution interpretation is the intended learning objective. Keep photo assessment and the existing one-mark allocation unless separately approved. Do not silently enforce symmetry or invent a distribution-specific checker.

## Independent format decision

Full-schema validation currently fails at **d.i.answer_format**: `dp:1` is declared without a matching form-mark row. CK4 identifies quartile positions; AK4 interpolates; AK5 calculates IQR and semi-IQR. All three rows are attached to d.i and none is a form row. d.ii's R2 separately rewards one-decimal-place semi-IQR form.

Options: approve removal of the unpaid d.i format declaration while retaining the printed rounding request, or explicitly reallocate/define a form mark. Do not reclassify a calculation mark by inference.

Recommendation: remove only the unpaid d.i declaration after approval, keeping all current marks and R2 for semi-IQR formatting. This changes which forms can lose credit and is outside wording cleanup.

## Independent acceptance verdict

The printed rule is median ± semi-IQR. The stored values give `47.5 ± 9.6`, or approximately `[37.9, 57.1]`; 58 kg lies outside. This conclusion is independent of symmetry. d.iii's R3 nevertheless says to use “their” median and semi-IQR. A fixed typed “not acceptable” could withhold credit for a correctly reasoned decision from different earlier values.

Recommendation: retain photo assessment unless the user approves the intended follow-through/accepted-answer contract. Review any future typed conversion independently of symmetry, after resolving the schema defect. No change to this record is prepared for application.


## Concrete proposal for approval

The proposed question is constructed by [preview-797be2-proposal.ts](../../scripts/review/preview-797be2-proposal.ts) from the current [reviewed source](../../scripts/review/797be2-reviewed.json). Preview:

```sh
pnpm exec tsx scripts/review/preview-797be2-proposal.ts
```

This script compares the current authored fields with the review, validates the proposed full schema and prints the proposed parts and rubric rows. It defaults to a read-only preview. Its `--apply` path is guarded by the reviewed authored fields and writes only the approved content fields. No grading code or new input type is introduced.

### A. Replace the unsupported symmetry inference with a supported graphical description

Student instruction for c.iii:

> Describe a feature of the shape of the distribution and justify your description using the histogram.

Part (c) statement:

> The median class is {}. The estimated median mass is {} kg. A description of the distribution, supported by the histogram, is: {}.

Proposed R1 criterion and feedback template, still **one R mark**:

> Describes a feature of the distribution correctly and supports it with bar heights or frequencies from the histogram. Accept a single peak in the 40–50 kg class with frequency 12, or lack of exact symmetry supported by unequal corresponding bars. A qualified judgement of approximate symmetry is acceptable when supported by the central peak and decreasing frequencies towards both ends, with unequal corresponding bars acknowledged. Equal estimated mean and median alone, or an unsupported shape label, is insufficient.

Proposed hint:

> Inspect the bar heights. Describe a peak or compare bars on opposite sides of the central class, and use the frequencies to support your description.

Canonical explanation:

> not exactly symmetrical: corresponding bars have unequal frequencies, 4 and 8 at the ends and 7 and 9 beside the central class

Declared alternative exemplars:

- single-peaked, with the highest frequency of 12 in the 40–50 kg class
- approximately symmetrical in overall shape, with a central peak and frequencies decreasing towards both ends, although corresponding frequencies 4 and 8, and 7 and 9, are unequal

These are examples for the existing photo marker, not exact-match phrases. A correct supported feature earns the existing one mark; an unsupported label earns none. No new fractional credit or multi-mark split is proposed. In particular, accepting the single-peak description broadens the existing symmetry task and must be approved explicitly. Approximate symmetry remains a qualified visual judgement, not an equality test or a numerical tolerance invented for this question.

The worked solution replaces its invalid inference with an explanation of the unequal bar pairs and the valid single-peak description, including the qualification above. The derived final-answer string changes to match the new canonical explanation. All numerical solutions remain unchanged.

Syllabus basis: [CXC Mathematics syllabus](../syllabus-2027.pdf), printed page 44 / PDF page 48, Module 3 objective **1.8**, covers analysis of statistical diagrams, including trends and patterns. The proposal adds `M3.1.8` to the question and retags only c.iii from `M3.1.4` (central tendency) to `M3.1.8`. Its dependencies on b.i/c.ii are removed because its evidence now comes from the printed histogram, not from the student's mean and median. These are part of the approval proposal; no objective or dependency is changed in the bank.

### B. Remove the unpaid IQR form declaration

Delete only `d.i.answer_format: "dp:1"`. Retain the printed one-decimal-place instruction, d.ii's `dp:1`, and its existing R2 form mark. Do not reclassify AK4 or AK5 as form marks.

The existing deterministic checker then gives `19.20` the same IQR credit as `19.2`. A semi-IQR of `9.60` still loses only R2. Blank or incorrect numerical values do not earn their numerical rows. This changes the formal credit contract and needs approval even though all 12 marks and the profile totals of 4 CK, 5 AK and 3 R marks remain unchanged.

### C. Keep the verdict on paper; expose the remaining follow-through decision

Prepared instruction for d.iii:

> Use your estimated median and semi-interquartile range to form the acceptable mass interval. Compare 58 kg with that interval and justify your decision.

The executable proposal keeps d.iii's canonical answer, alternatives, dependencies and R3 unchanged. It does not promise that the current photo marker will award the opposite verdict from different earlier estimates: the existing R3 criterion and hint both hard-code rejection despite saying to use the student's values.

**Separate optional clarification, recommended for approval if full follow-through is intended:** replace R3's criterion and template with:

> Uses their estimated median and semi-interquartile range to form the acceptable interval and makes the correct acceptance decision for 58 kg relative to that interval.

Replace its hint with:

> Form an interval from your estimated median minus your semi-interquartile range to your estimated median plus your semi-interquartile range. Compare 58 kg with your limits and decide whether it is accepted.

This approved clarification makes a justified “acceptable” earn R3 when the student's earlier median is 50 and semi-IQR is 10. It still rejects a conclusion inconsistent with the student's own interval. The mathematical rule in the stimulus, all earlier numerical criteria and the one-mark value of R3 remain unchanged. No question-specific grader is needed.

## Regression evidence and limits

[797be2-response-cases.json](797be2-response-cases.json) contains ten review cases: seven shape responses, two ordinary verdict responses and one explicitly unresolved follow-through case. The shape cases distinguish supported descriptions, a qualified approximate description, the invalid mean-equals-median inference, bare labels, invented frequencies and blank work. The expected photo-marker awards are proposed review expectations, not results from model calls.

[797be2-proposal.test.ts](../../tests/797be2-proposal.test.ts) checks the grouped calculations independently from the figure parameters, full-schema validation, the 12-mark/profile allocation, unchanged numerical answers and non-R1 rows, IQR/semi-IQR formatting credit, wrong/blank numerical entries, preservation of photo assessment and prefill behavior, renderable wording, stale-content refusal and repeatability. It deliberately does not implement or mock a special-case prose grader.

The pre-repair source fixture fails its known unpaid-format validation; the applied question passes. The guarded application updated the one reviewed question, and the post-apply preview reported `changed: false`. Historical attempts were not read or changed.

Focused checks: five proposal tests plus the existing question-cleanup suites passed (214 tests); TypeScript, kill-list and whitespace checks passed. The final current-bank preview reports the applied repair with `changed: false`. No push, deployment or Vercel check was performed.
