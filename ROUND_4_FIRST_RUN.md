# ROUND 4 — FIRST RUN

Round 3 made the product sellable. Round 4 makes the first five minutes show
what it is. The examiner is the product and today it is the last thing a new
student meets: register, twelve minutes of multiple choice, a session, type an
answer, submit — and only then a camera button. Three changes fix that.

**Scope rule.** Four tasks, in order. The day task 3 merges is launch day.
Anything else discovered along the way goes on the R5 list at the bottom of
this file. It does not get built.

**Code rule, new in this round and permanent.** Code is the explanation. Short
functions, plain names, one idea per line. A comment says *why*, never *what*
or *what used to be*. If the code can't say it, change the code first. History
lives in git and the ROUND docs. A comment over five lines is a paragraph
looking for a home. This goes in CLAUDE.md under Working style.

## Task 0 — Comments: why, not what

`lib/` is 22% comment lines, `app/` 12%. Most of it is history. Sweep both,
comments only, zero code changes.

- Keep: a *why* the code cannot express, or an invariant that guards a
  decision (append-only, vision only adds marks, no reveal before submit, the
  security notes). Cut each to ≤5 lines, stated as a rule.
- Replace reasoning already recorded in a ROUND doc with a pointer:
  `// see ROUND_2 §8a`.
- Delete narration of prior versions. `lib/grade/version.ts` is exempt — that
  file *is* the history.
- Add the code rule above to CLAUDE.md.

Gate: `pnpm test` green, `git diff --stat` shows no non-comment line changed.
One commit.

## Task 1 — Photo-first answering

Students work on paper. Today they work, type the answers, submit, then
photograph the same page. Double entry on a phone. Flip it: photograph first,
we read it, the read prefills the answer boxes, the student confirms, submits.

**Flow**

```
paper → photo → read (vision) → prefilled answers → student confirms → submit
                                                          ↓
                          deterministic marks + method marks over the stored read
```

**Invariants, unchanged**

- The confirmed text is the record. A model output becomes the answer only
  after the student says so.
- No reveal before submit.
- Vision only adds marks. Deterministic marking is untouched.
- Image TTL is 7 days. `MAX_TAKES` = 2 now bounds *reads*, pre- or post-submit.
- **The image goes to a model at read time only, never at submit.**
  Transcription and, on construct questions, the drawing check both run at
  read time and are stored. Submit runs the marking model over stored text.

**Schema** (same-commit backfill, as always)

- `Transcription`: `attempt_id` becomes optional; add `session_id`,
  `question_index`. Unique index moves to `{session_id, question_index, take}`.
  Add `answers: [{slot_ref, text}]` — the reader's final answer per slot.
  Add `construction: {complete, missing, legible}` — stored drawing check.
  Add `expires_at` on a read with no attempt, set to the draft's TTL and unset
  when `markWorking` links it: a read nobody submits expires with the draft.
- `CapturedImage`: same two keys added, `attempt_id` optional.
- Backfill: every existing row has an attempt; derive `session_id` and
  `question_index` from it.

**Reader** — `lib/grade/transcribe.ts`

Schema gains `answers`. Prompt gains one instruction: for each marked slot,
the final answer as written, in the conventions the grader already parses.
Nothing else changes.

**Server** — `app/study/session/[id]/`

Split `captureWorking` into two:

- `readWorking({sessionId, questionIndex, image})` — pre-submit. Ownership
  check, take limit, scale check, transcribe, construction check if the
  question has one, store Transcription + CapturedImage with no attempt yet,
  write `answers` into the `SessionDraft` for that question. Returns the read
  and the prefill.
- `markWorking(attemptId)` — post-submit, called from the submit action after
  the attempt exists. Links the read to the attempt (`attempt_id` set once),
  runs `markMethod` over stored lines, writes `method_marks`. Construct rows
  are decided from the stored `construction`, no image. Returns what
  `captureWorking` returned.

The existing post-submit "Photograph your working" stays for a student who
typed instead — it calls `readWorking` then `markWorking` back to back. Two
entry points, one path.

**Client** — `question-card.tsx`, `working-photo.tsx`

The camera button moves above the answer boxes, visible from the start on a
structured question. After a read: boxes prefilled, editable, with the
transcription shown beneath. "Take it again" re-reads and re-prefills (take
2, then it stands). Submit as today. Prefill single-box slots only;
multi-value slots stay typed.

Gate: existing eval harness numbers unchanged (same reader conventions, same
marker). Tests for: prefill lands in draft; submit links the read; a second
read replaces the prefill; a read with no submit expires with the draft.

## Task 2 — "Mark one question now"

A new student's first action is one structured question with method marks,
photo-first. The diagnostic stays and moves to second.

- `SessionMode` gains `'first'`. Builder: top-ranked structured candidate with
  earnable method rows, limit one. Pure, tested.
- Gate: one per student, ever. Counts like the diagnostic — free, not against
  `FREE_SESSIONS`.
- `/study`: when the student has no `'first'` session, the lead panel is this.
  Diagnostic below it. After that, the dashboard is as today.
- Session summary for `'first'` says one thing: marks earned, and that the
  diagnostic is next.

## Task 3 — "I think this earned the mark"

The pilot class was promised in exchange for wrong-marking reports. There is
no button. This is the button.

- `MarkDispute`, append-only: `student_id, attempt_id, transcription_id, code,
  ts`. Never resolved in place.
- One tap on any `–` row in `working-read.tsx`. Once per row. Copy: "I think
  this earned the mark." After: "Noted — we'll look."
- `/admin/disputes`: newest first, each with the read, the row, the reason,
  the question. Read-only. Resolution is a human and an email in v1.

Gate: a dispute never changes an attempt, a transcription, or mastery. Test it.

Landing page rewritten to describe photo-first and the free first question;
kill-list exception, decided 3 Sep.

## Kill list, this round

No teacher role, class, or roster. No provider fallback. No dispute
resolution or correction events. No landing-page change. No new question
types. Nothing on this list ships in R4.

## R5 list — written down so it stays out

- Dispute resolution: a correction event folded into mastery.
- Second vision/marking provider behind `lib/ai.ts`.
- Teacher digest, student-initiated.
- Multi-value slot prefill.
