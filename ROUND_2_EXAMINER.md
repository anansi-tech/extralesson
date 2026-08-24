# ROUND_2_EXAMINER.md

**What this round is.** A student photographs their handwritten working. We transcribe it, attribute it to the slots it belongs to, and award the CK/AK/R rows the working earns — including follow-through on their own earlier values. That is the product's central promise, and it is the thing every previous round was building the foundations for.

**Why now.** Every piece it needs already exists: one rubric row per mark (acts per mark 1.00), rows tagged CK/AK/R with `slot_ref`, criteria written in CXC's own descriptor vocabulary (`CAO`, method/process, "their"), `isFollowThrough()` recognising that wording, slots carrying `depends_on`, and `audit-remark.ts` able to replay any marking change against stored attempts. R2 adds one thing: the working, attributed.

**What it repairs.** Grader v6 awards method marks only where a question has exactly one marked slot (3 of 427), because the working box is question-level and cannot be attributed. That was the honest interim. A student who shows correct method and slips on arithmetic currently earns nothing, where an examiner pays the method marks. R2 removes the compromise rather than patching it.

**Standing rules apply unchanged.** First principles. Occam. Measure before asserting. Declared structure over detected prose. Derive, don't store. Same-commit backfill. Targets are deficits. Kill-list greps and the full suite gate every commit.

---

## 1. The principle that governs every decision below

**Determinism keeps everything it currently owns.** Final answers are marked exactly as they are today — free, instant, replayable, auditable. Judgment enters only where determinism provably cannot reach: reading handwriting, and deciding whether a written line demonstrates a criterion.

Three consequences, all binding:

1. **Photo marking may only add marks, never remove them.** If the deterministic grader awarded a row, no vision pass can take it back. A misread must cost a student nothing. This is the same asymmetric-trust rule the symbolic engine already follows: a confident "wrong" is not permitted from a fallible judge.
2. **Transcription is separated from marking, and the transcription is stored.** Two calls, two artifacts. The transcription is a claim about the image that the student can check; the marking is a judgment over the transcription. Because the transcription persists, every future marking change replays against it — the `audit-remark` pattern extended to method marks.
3. **Low confidence falls back to self-marking, never to guessing.** Illegible or empty working routes to the worked-practice treatment the student already knows.

## 2. Capture

- One photo per **question**, not per slot. That is how a student writes, and how the real paper is answered.
- Camera-first on mobile (`capture="environment"`), file upload on desktop. Must work at 390px alongside the existing submit control.
- Taken **after** the student submits their typed answers, never before — the answers are the deterministic record, and photographing first would let the reveal influence them.
- Optional per question, and **offered only where the working could still earn something**: rows the deterministic grader left unearned, excluding `CAO` rows and self-marked slots. A prompt on every question is a chore; a prompt on a question carrying three unearned method marks is an offer, and it is the honest signal as well as the cheap one — no model call is ever spent on a foregone conclusion. Measured on the attempts on record: the camera would be offered on 63% of structured attempts, carrying 126 method marks.
- A student who wants only final-answer marking is unaffected, and spends nothing.
- The student sees what we read back (§3) and may retake once. Two attempts at a photo, then it stands.

**Storage.** The image is a means, not a record: transcribe, store the transcription, delete the image on a short TTL (7 days) so a retake or a dispute is possible and nothing lingers. Never store images alongside identifiable data beyond that window. This is minor-user data; the least we hold, the better.

## 3. Transcription (call 1) — `gpt-5.6-luna`

Reading handwriting is mechanical, not judgment, so it runs on the cheap tier. Luna is $0.20/$1.20 per million tokens (a twenty-fifth of Sol) and accepts image input like every tier in the family. If the transcription eval in §6 shows it isn't accurate enough, upgrade this leg alone — not both.

Input: the image, plus the question's part and slot labels so the model knows what it is looking for.
Output, Zod-validated, no marking judgment whatsoever:

```ts
transcription {
  lines: [{ part_label: string|null, slot_label: string|null, text: string, confidence: number }],
  legible: boolean,
  notes?: string          // e.g. "second page cut off"
}
```

- Attribution comes from what the student wrote — real papers require the question number beside the answer, and students already do this. Where a line carries no label, it inherits the previous labelled line's attribution. Unattributable lines are kept with `part_label: null` and can earn nothing.
- Mathematics is transcribed to the same conventions the grader already parses (`2x + 3`, `sqrt(5)`, `24 m by 16 m`) so the existing equivalence layer reads it without a second dialect.
- **The transcription is shown to the student**, per part, before any mark is reported. "This is what we read" — if it is wrong, they can see exactly why a mark went the way it did. That single screen is the difference between a marker they trust and a black box.

## 4. Method marking (call 2) — `gpt-5.6-terra`

This is judgment against a criterion, so it stays on the capable tier. It is text-only over the stored transcription, and the criteria and mark-scheme conventions repeat verbatim on every call, so most of its input bills at the cached rate.

Runs **after** deterministic marking, and only over rows deterministic marking left unearned.

For each such rubric row, the marker receives: the criterion verbatim, its profile, the slot's own transcribed lines, the student's typed answers for that slot **and** for slots it `depends_on`, and the canonical worked solution. It returns per row: `awarded: boolean`, a one-clause reason, and `confidence`.

Four rules, encoded in the prompt and enforced in code:

1. **`CAO` rows are never awarded by this pass.** "Correct answer only" means the answer, and the deterministic grader already settled that. 24% of AK criteria say CAO; they stay deterministic.
2. **Follow-through is the point.** Where `isFollowThrough()` marks a row (criteria written with "their"), the row is earned when the method is right *given the student's own earlier value*, however wrong that value was. The marker is given those values explicitly so it is judging method, not arithmetic it has already been told is wrong.
3. **No working, no method mark.** A row cannot be awarded from an absent or unattributable line. Silence earns nothing.
4. **Confidence is recorded, not gated on.** The original design abstained below a threshold. The reading eval killed that: on 15 real photographs across five hands, lines the reader rated 0.9+ — which is nearly all of them — were exactly right only 77% of the time, so there is no threshold that separates a good read from a bad one. Gating on a number that does not predict correctness would have felt like a safeguard and been none.

   What replaces it is evidence we already hold. **The typed answer is the cross-check**: the deterministic grader knows what the student submitted for the slot, so a transcription that contradicts it is unreliable for that row and the row is withheld. Confidence is still stored on every line — it costs nothing and a later analysis may find a use for it — but nothing depends on it.

   **The backstop is §1.1: this pass may only add marks.** A misread cannot take away what determinism awarded, so the worst a bad read can do is fail to add a mark the student had earned. That is the failure we choose.

## 5. What the student sees

The existing session-summary surface, with method marks folded in: each rubric row shows earned / not earned / *could not read*, the working we transcribed beside the part it belongs to, and — where a follow-through mark was earned on a wrong value — the sentence that makes this product worth paying for: *"Your value in (b) was wrong, but the method after it was right: 3 of 4 marks."*

No new page. No new vocabulary. The verdict/score/rubric consistency invariant already asserted by `verdict-consistency.test.ts` extends to method marks.

## 6. The eval gate — nothing ships to a student before this passes

**The eval splits in two, because the two failures are independent and only one of them needs David.**

*Reading* is measured on **our own input**, not on a public benchmark. The public sets were considered and dropped: CROHME and MathWriting are single expressions reconstructed from stroke data, and HME100K is isolated expressions. None of them is multi-line working on lined paper photographed by a phone, which is the only input this feature ever sees — a benchmark that scores well on the wrong distribution would set the §4.4 threshold wrongly and give us confidence we had not earned.

The golden set covers both legs instead, because it has to be written either way. Roughly half the ~30 workings are **handwritten and photographed**, giving transcription ground truth on real input and doubling as the end-to-end set of §6; the other half are **typed**, giving fast marking coverage and letting follow-through cases be constructed deliberately. **The §4.4 confidence threshold is set from the photographed half.**

**Handwriting varies more than any single hand can show.** The founder writes like a maths teacher and the users are teenagers, so the same workings are copied out by 3–5 other people and **accuracy is reported split by writer**. A threshold calibrated on one neat hand is a threshold that fails in the field on the first student who writes like a student; the spread between writers is the number that says whether it will hold.

*Marking* is measured on **typed** working, not photographs. Feed the marker typed transcriptions — correct working, working with an early slip and correct method after it, working that shows nothing, working that reaches the right answer by a wrong route — and check its rubric decisions against David's. Decoupling this from vision means the golden set costs an evening of typing rather than a weekend of handwriting and photographing, and it lets follow-through cases be constructed deliberately rather than hoped for.

*Composition* is then confirmed on a small end-to-end set: 8–10 real photographs, the only part needing a camera.

No public dataset of rubric-marked CSEC scripts exists, and none is needed: the ground truth we require is "did this working earn AK2 **on this question**", which is specific to our bank and our rubric rows. David writing working for questions already in the bank is faster, more relevant and free. (Note in passing: CXC's own e-marking uses pre-marked "seed" scripts that examiners must score correctly before they are allowed to mark live. Our gate is the same mechanism, which is a good sign the design matches how the exam is actually run.)

**Metric: mark-level agreement, on the rows that were in contention.** Per rubric row, does the marker agree with David? Not per question, not per attempt — per mark, because a mark is the unit CXC awards.

**The denominator is 128, not 220.** David judged the rows a photograph could actually decide; the 30 questions carry 220 reachable rows in total. Every agreement figure in this round is over those 128 and must be reported as such — an unqualified "90%" would later be read as covering all 220, which it does not.

**Gate: >90% agreement, and zero false awards on `CAO` rows.** Below that, method marking stays off and the round is not done. Report agreement split by profile (CK/AK/R) and by whether the row was follow-through — a system that is 95% right on CK and 70% on follow-through has not earned the feature that matters.

**`scripts/eval-marker.ts`**, versioned like the grader: `MARKER_VERSION`, attempts stamped, every future prompt or model change re-run against the golden set and reported as a delta before it lands. Same discipline as `audit-remark.ts`, for the same reason.

## 7. Cost, stated plainly

Two model calls per photographed question — Luna at $0.20/$1.20 for reading, Terra at $2/$12 for marking, with cached input at a tenth of standard. Expected cost is **under one cent per photographed question**, so a student who photographs a hundred costs well under a dollar. Deterministic marking stays free and photos are opt-in, so a student who never photographs anything costs nothing at all.

Instrument it rather than trusting that estimate: record token usage per transcription and per marking pass, and surface cost-per-question in admin. Report the real figure once the first batch has run — if it diverges from a cent, that is a product decision to make with numbers rather than a surprise on the invoice.

## 8. Phase 3 — photographed constructions (after §6 passes)

A construction is the easier vision problem, not the harder one: the correct answer is a known set of coordinates from the template's own params, so checking a photographed graph is comparison against ground truth rather than open judgment. Scope to the plotted families (`coordinateGrid` line and curve, `travelGraph`, `cumulativeFrequency`), verify plotted points, shape and labelled intercepts against the declared params, and keep instrument constructions out. Success here raises the coverage figure above "about 90%" honestly — the first time that number moves because we assess more, not because we claim more.

## 9. Kill list (additions)

No handwriting model or OCR training · no per-stroke or video capture · no live camera guidance · no marking without a stored transcription · no vision pass that can reduce a deterministically-earned mark · no image retained beyond the TTL · no parent report in this round · no instrument constructions · no second marking dialect (transcription targets the grader's existing conventions).
Greps: `tesseract`, `ocr`, `stroke`, `handwriting-model`.

## 10. Definition of done

1. Capture works on a phone at 390px, after typed submission, with one retake; images deleted on TTL.
2. Transcription stored, Zod-validated, shown to the student per part before any mark is reported.
3. Method marking runs only over deterministically-unearned rows, never awards `CAO` rows, awards follow-through rows on the student's own values, abstains below confidence threshold, and cannot reduce any mark.
4. Grader v6's single-marked-slot restriction is lifted WHERE THERE IS EVIDENCE: photographed working carries the part it was written under, so it can be attributed to a slot and method marks are real on multi-slot questions. The restriction on the TYPED working box stays, because nothing about it changed — it still belongs to the whole question and still cannot be attributed. `audit-remark` reports the size of the hole this fills.

   **Two figures are carried forward, not tuned.** R agreement dips to 87% on n=23 — too small a sample to fit a prompt to, so it is tracked as the set grows. And withheld-when-it-should-have-awarded, 6–9 rows or about 6%, stays a reported metric in every eval run: the marker is stricter than a human examiner, and that bias must never become invisible.
5. Transcription accuracy measured on the photographed half of the golden set, across 3–5 hands and reported split by writer, and the confidence threshold set from it; marking golden set of ~30 workings hand-marked by David; `eval-marker.ts` reports mark-level agreement overall, by profile, and by follow-through; 8–10 photographs confirm the two compose; the feature is off until >90% with zero false CAO awards.
6. Cost per photographed question instrumented and visible in admin.
7. Verdict / score / rubric-chip consistency holds with method marks included; drift test covers the transcription contract across model → validator → persistence.
8. Mobile audit passes; tests green; kill-list greps clean.

## 11. Sequencing

1. Capture + transcription + show-back on Luna, marking off. Ship this alone — it is useful on its own (a student sees their working typed up beside the mark scheme) and it proves the vision leg in real use.
2. The golden set: ~30 workings, about half handwritten and photographed (3–5 hands, not one) and about half typed. The photographed half sets the confidence threshold and is the end-to-end set; the typed half carries the deliberate follow-through cases.
3. David types ~30 workings and hand-marks the rubric rows; method marking on Terra behind the gate; iterate the prompt against the eval, not against impressions.
4. Remove the single-slot restriction, re-mark audit, report.
5. Constructions.
