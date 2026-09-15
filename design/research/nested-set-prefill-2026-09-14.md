# Nested-set photo prefill correction

## Confirmed failure

For 797ba6 c.i, the photo and verbatim transcription listed the six correct two-element subsets. The reader suggested six whole braced subsets, but the form/checker expected twelve flat components. Prefill accepted the mismatched representation; submission regrouped whole subsets using the key's group count, adding three empty subsets. All four c.i marks were withheld, including photo-method review because the submitted text contradicted the working. This was an application representation bug, not a handwriting error.

## Shared correction

- Send the reader and form a uniform member size/bracket kind, never the key's number of members or values.
- Render subset members with braces, one component per box, growing a new member after completion. Existing ordered-pair compatibility remains.
- Normalise complete written groups into flat components; reject mixed, incomplete, nested or wrong-size group suggestions. Preserve group boundaries and wrong values; do not infer missing members.
- Normalise legacy whole-group entries at submission too. Preserve interior gaps rather than shifting components between groups.
- Compose the groups actually submitted instead of manufacturing the key's expected number of groups. Incomplete or extra answers still do not earn full typed credit.

No question-ID special cases, additional model calls, bank changes or historical-attempt rewrites. The existing 8/12 attempt remains unchanged. The repeated-label scripts in the working tree are a separate approved content repair.

## Verification and limits

Read-only bank checks reproduced correct prefill/composition/equivalence for all four approved nested-set fields: 797ba6 c.i, 797cd7 b.i/c.i and a9f570 c.i. These checks use stored canonical structures, not new OCR evaluations.

Regression tests replay the saved suggestion format and cover malformed groups, missing/extra groups, wrong values, group ordering, symbolic subsets, larger uniform groups, hidden group count and printed braces. The isolated-database photo-first test runs read → prefill → submit → stored attempt, including legacy whole-group values, and awards all four target marks without photo-method rescue. The reader in that integration test is mocked; no claim of new live-reader accuracy is made.

The full unit run passed 188 files / 2700 tests; additional tests for the other bank structures were added afterward and verified in the focused rerun. TypeScript passed. No production deployment or commit/push is included in this repair.
