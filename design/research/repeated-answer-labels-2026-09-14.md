# Repeated parent instructions beside answer fields

## Completion

The user approved all remaining 12 labels. `scripts/review/repair-answer-labels.ts` applied exactly those 12 prompt fields on 2026-09-14, preserving prior approved explanation/exemplar repairs. All 13 inventoried fields (including the earlier 797ba6 correction) are now labelled. The table below preserves the initial audit and proposed wording.

Post-apply preview: 12 reviewed, zero pending changes. A fresh scan of 474 approved/draft structured questions found zero remaining fields using this exact visible parent-instruction fallback. This does not claim to detect other kinds of duplicated wording or future generated questions.

The batch validates all records before writing, compares full reviewed authored content, and writes only the target prompt plus the system update timestamp. No renderer, answer, response-mode, rubric, mark allocation or historical-attempt changes. Tests cover unchanged content and grading for correct/wrong/blank submissions, exact write paths, stale-content refusal, repeatability and non-repeated parent instructions. All 39 label tests and TypeScript passed. Scripts/tests/report are not yet committed or pushed.

Read-only scan of 474 approved/draft structured questions on 2026-09-14 found 13 fields in 13 approved questions; no draft matches. Retired questions were excluded.

Selection mirrors the current card's visible fallback: no part statement, more than one slot, answer mode (including default), no truthy slot prompt, positional slot label, and no visual-derived cell name from `slotCellNames`. This is a targeted fallback inventory, not a general audit of duplicate wording or every label's clarity.

| Question | Slot | Approved short label | Status at initial audit |
| --- | --- | --- | --- |
| 6a853d31e7fc40f429797ba6 | d.i | Number of accepted inspection pairs | Applied |
| 6a83d1c6c24c2d59f4d9c40e | c.i | Coordinates of the new x-intercept | Not changed |
| 6a83e24ef8a49010ad804aa6 | c.i | Property illustrated | Not changed |
| 6a852665bd8b8cbd670ab933 | c.ii | Additional suitable beans needed (standard form) | Not changed |
| 6a85508bc99a188733a9f51d | d.i | Could the stated area result from measurement error alone? | Not changed |
| 6a8554abc99a188733a9f570 | d.i | Is the coach's claim correct? | Not changed |
| 6a83b9cd11edd390f46a52bb | d.i | Does the sample support the claim? | Not changed |
| 6a841cd45222177bc0d16fe7 | d.i | Minimum number of complete 2 m lengths | Not changed |
| 6a8522946d7444309a004444 | c.i | Figure number | Not changed |
| 6a85272ebd8b8cbd670ab945 | c.i | Other time at the same height | Not changed |
| 6a8529eeed771942b6d0dc8f | b.i | Length BD | Not changed |
| 6a8407a00676ebb26b9e8854 | c.i | Angle TAB | Not changed |
| 6a8410e70676ebb26b9e8942 | b.i | Angle TAB | Not changed |

The earlier missing-explanation cleanup added instructions to explanation slots, not these answer slots. The renderer repeats the parent instruction when an answer slot lacks its own prompt and descriptive/cell label. No renderer change was needed: the repairs supply the existing `slot.prompt` field, preserving shared context, slot IDs, answers, modes and rubric.

`scripts/review/repair-797ba6-label.ts` prepares only the approved d.i label. It checks the full reviewed authored record (including the earlier approved d.ii prompt), validates the schema, and uses a compare-and-set filter before writing one prompt path. The historical wording-cleanup snapshot remains unchanged; its old batch preview will correctly flag this later correction as a changed record. Tests verify repeatability, unchanged non-target content, stale-content refusal, and one rendering of the parent instruction with a distinct answer label.

Applied one prompt on 2026-09-14. The exact-content filter uses the native collection to avoid Mongoose recasting nested parts; the update also maintains `updated_at`. The initial Mongoose-cast filter matched no record and wrote nothing. Verification: 206 focused tests and TypeScript passed. No other candidate, answer, rubric, or historical attempt was changed.
