# Structured photo prefill — branch review

## Implemented

- One existing photo-reading call receives question wording, public visual/table data and field descriptors derived from the existing answer shapes. Canonical values, accepted answers, rubric and worked solution are excluded.
- Verbatim lines remain separate from suggested entries. Suggestions identify their supporting lines; coordinates, vectors and matrices return ordered entries, not strings that need splitting again.
- The deterministic gate rejects unknown/duplicate references, missing evidence, wrong box counts, empty components, illegible reads and prose/units in plain numeric fields. Variable-length sets/lists do not reveal the canonical count.
- Retakes fill empty fields only, including refusing to replace a partially entered grid. Client-side checking uses the latest form; server draft writes avoid overwriting a concurrent save.
- Old stored reads still load. Their missing structured entries are not guessed or retroactively applied. Stored question content is unchanged. The later d0dccb review added the narrow word-blank grading safeguard documented below.
- Admin review now warns about explanation subparts lacking their own instructions and cloze blanks stored as non-answer modes.

## Evidence and limitations

Verification: full suite passed (197 files, 2,609 tests). After the last variable-length-field and manual-entry regression additions, the targeted suites passed (35 tests). Type checking and whitespace checks passed.

Eight paid, read-only replays (two per saved test photo) after the numeric/blank prompt clarification: 22 expected slot suggestions matched, zero mismatched suggestions, two missing suggestions. Both misses were d0dc87(a)(i); the reader omitted it rather than returning malformed components. d0dc8f, d0dc7f and 220c3b matched the curated expectations on both runs. A further diagnostic replay of d0dc87 again omitted (a)(i).

These expectations were derived from the saved transcriptions; they are not an independently human-labelled image benchmark. This small, iterated development sample is not an accuracy claim or a release-quality holdout. In particular, matrix ordering has deterministic tests but needs real handwritten matrix holdout photos. Subsequent handling of variable-length fields has deterministic tests; it was not covered by these four photos.

Source-line references establish traceability, not proof that a value was read correctly. Wrong handwritten answers remain wrong. Neither the prompt nor validation can eliminate recognition errors or prevent every plausible incorrect suggestion. Students must check entries.

Reproduce with `pnpm exec tsx scripts/eval-prefill.ts /private/cases.json 2`. Each case has `transcriptionId` and `expected`, mapping a slot reference to acceptable arrays of box values. The runner only reads MongoDB; it calls the reader but creates no takes, attempts, grades or drafts. Photos must still exist within retention. Output separates wrong fills from misses and includes raw suggestions for diagnosis. Keep the case file and output private.

## Separate content review — not applied to the live bank

### d0dccb: reviewed correction prepared

`scripts/done/repair-d0dccb-cloze.ts` previews three response-mode changes in part (c), validates the resulting draft and refuses to overwrite concurrent content changes. The sentence, canonical answers, accepted alternatives, rubric and mark allocation stay unchanged. `--apply` updates only those three fields; no past attempts or photo marks are rewritten.

The completed sentence makes the submitted `7` the frequency of the modal number, `more` the comparison with one-third and `should` the resulting decision. These entries supply the four criteria already attached to those slots. Missing/incorrect entries still earn no typed marks for their slots; the existing photo-method path remains available for unearned criteria.

Regression testing caught a release dependency: the generic prose matcher accepted `should not` against `should`. The branch now uses exact canonical/declared-alternative matching for word answers inside cloze statements, with case, whitespace and trailing sentence punctuation normalised. Numeric comparison and ordinary prose matching are unchanged. This is a narrow grading-code change added after the original prefill work.

**Deploy this safeguard before applying the shared-bank repair.** The repair has been previewed, not applied. Targeted tests cover positive, negative, missing and accepted-alternative answers and per-blank indicators.

The initial approved-bank audit found 45 questions with an unprompted explanation in a multi-slot non-cloze part, and 84 with an explanation-mode cloze blank. These classes can overlap. A warning is not a decision to change a response mode.

The 84-question response-contract review is now documented in [the per-question correction inventory](cloze-bank-review-2026-09-13.md): 30 short-answer candidate questions, 31 photo-explanation presentation corrections, 21 specific holds and 2 mixed cases, covering 95 affected slots. These are recommendations, not applied repairs or independent mathematical validation of every question. The separate 45-question flag remains outside that review.

Following approval, `scripts/done/repair-reviewed-cloze.ts` prepares 31 questions / 35 slots, including the d0dccb modes and contextual `will` alternative. One additional candidate, d0dd1a, is excluded because its existing quartile-format rubric fails current schema validation. The combined script supersedes the standalone d0dccb repair for release; preview succeeded without writes. Deploy the safeguard first, then apply as documented in the inventory. Explanation rewrites and remaining holds are not included.

For d0dc8f:

- (b)(i) should explicitly ask for the length BD.
- (b)(ii) should explicitly ask for the reason for (b)(i), written on paper.
- (d)(ii) needs a reviewed choice: a typed verdict blank or an explicitly instructed photo-assessed explanation. Its present visible blank/non-typed mode is inconsistent.

No bulk conversion, live bank edit or stricter blocking validation has been applied. After the intended response contract is approved, correct affected content and add hard validation against that contract. Existing approval gates remain unchanged; the only grading-code change is the word-blank safeguard above.

## Before release

### d0dd9b handwritten vector validation

The fresh test filled all eight component entries on its first read, but exposed a notation-contract bug: suggestions `2/sqrt29` and `5/sqrt29` failed typed equivalence while photo marking awarded the three remaining marks, producing full marks beside a red cross. Correct box placement alone was not enough.

The reader prompt now explicitly requires function parentheses and exact component syntax. At the prefill boundary, numeric radical shorthand in maths fields is normalised (`sqrt29` → `sqrt(29)`), independent of question ID or answer key. Symbolic/compound argument scope is not guessed; word fields, verbatim reads and existing typed values are untouched. Regression tests replay the saved suggestion through prefill and exact-form marking, cover matrix components and other radicands, and ensure wrong values stay wrong. Six targeted suites / 185 tests, type checking and whitespace checks passed. No additional model calls or historical data edits were made. The completed test's old red cross is not retroactively changed by this prefill fix.

1. Review the branch and test fresh/empty fields; existing entries intentionally survive retakes, including old bad prefills.
2. Human-label a small holdout of real matrix, vector, mixed-cloze, missing-answer and wrong-answer photos. Measure wrong fills and misses independently without tuning on that holdout.
3. Approve the content fixes and then introduce their blocking validation. The new admin warnings identify the cases but do not repair them.

The fresh post-fix d0dd9b test passed on its first upload: all eight entries were filled, and all 12 marks (including exact form) were awarded by the typed checker without photo-method rescue. Release was approved after this verification. Apply the bank correction only after confirming the release commit is live; the preparation/preview statements above describe the pre-release state.
