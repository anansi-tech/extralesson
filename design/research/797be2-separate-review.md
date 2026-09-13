# 797be2: separate content and marking review

Review only, 2026-09-13. No proposed mutation is included in the wording batches.

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
