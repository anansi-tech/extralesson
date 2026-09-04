# ROUND 5 — CLAIMS, NOT RULES

A mark-scheme row is a claim about the page. The marker's job is to decide
the claim from evidence. It should never have to guess which numbers in the
claim are the scheme's constants and which stand for the student's own value.
Today it guesses, and every wrong guess became a prompt rule. This round
makes the claim explicit and deletes the rules.

**Scope rule.** Three tasks, in order. Launch the day task 3 merges. Nothing
discovered along the way is added; it goes on the list at the bottom.

## Task 1 — Criteria reference quantities

The bank already knows the graph: each slot has a canonical `answer` and a
declared `depends_on`; each rubric row has a `slot_ref`. A row on slot S may
only depend on S and S's `depends_on` chain. That is the whole search space.

**Schema.** RubricItem gains `template: string` — the criterion with slot
references where a literal matches a canonical value in scope:

```
"Halves their interquartile range: 4 ÷ 2 = 2"
  → "Halves {b.iqr} by 2: {b.iqr} ÷ 2 = {c.i}"
```

A literal that matches no value in scope stays literal — it is a question
constant. `criterion` is untouched; it is what the author wrote.

**Migration.** A script derives `template` for every row in the live bank
and writes an audit: rows templated, rows unchanged, and every ambiguous
row — the same number in scope as a constant and as an answer, or one
literal matching two slots. Ambiguous rows keep the literal and are listed
for a human glance. This is a glance, not a judging batch.

**Rendering.** At marking time, for this student, `template` is rendered with
the student's confirmed answers for every referenced slot, falling back to
the canonical value where the student left the slot empty. The marker sees
the rendered claim and the page. Nothing else.

**Prompt.** Templates carry VALUES: a number in a criterion that is a slot's
answer is rendered as the student's own. They cannot yet carry
TRANSFORMATIONS of those values — the conclusion, the comparison direction,
the scalar that a student's numbers produce — because the deriver can only
reference what is stored, and those are computed. So one follow-through
paragraph stays in the prompt and carries the transformations: quantities,
conclusions, comparison directions and scalars, each read for the student's
own values, with one example each. The three rules that did this by cases
(their-values, their-fully, quote-the-result) are gone; the sentence "A
criterion is already written for this student's own values; decide whether
the page shows it" stands above the rules, and the quote requirement stays
as output format. When templates can express a transformation, the
paragraph shrinks by that case.

Measured on the way here (`calibration/r5-gate.md`): rendering alone, with
the rules deleted, touched 9 of 185 golden rows and lost the pages that turn
on a transformation — reasoning agreement fell from 86 / 89 / 91 to
82 / 84 / 86. The bank's own ambiguity is the other limit: 573 of 5771 rows
keep the literal, most because a small integer is both a constant and an
answer.

**Gate.** Reasoning eval and full eval, five runs each. Agreement must not
fall; CAO false awards stay 0; the golden pages that exercised rules 1/6/8
(797bbe, d1705a, c0bf13, b1a6a2) must still agree. Report the audit counts.

## Task 2 — "Not what I wrote"

The student confirms the answers but the working goes to the marker as read.
A misread line can earn a mark for text the student never wrote.

- Each line in the read view gets one control: **Not what I wrote.**
- It excludes the line from marking. Exclusion only — evidence can be
  removed, never added, so there is nothing to game.
- Append-only event: `LineRejected { transcription_id, line_index, ts }`.
  The read is not mutated. `markWorking` skips rejected lines.
- The look-back shows the line struck, with "you said this wasn't yours".
- Available before submit (pre-submit read) and after, until marking runs.

Gate: a rejected line never appears in a marker reason. Test with the cocoa
page: reject the b(i) line, CK2 must not cite it.

## Task 3 — Disputes feed the golden set

`/admin/disputes` gets **Export as golden case**. It writes a bundle in the
exact shape of `design/golden`: the image, a `set.json` entry (question,
writer `w-field`, transcript from the read, typed answers), and a
`review.json` entry with every row proposed from the marker's verdicts and
the disputed row flagged. `pnpm golden:import <bundle>` appends both files
and a line to `APPROVAL_LOG.md` as proposed.

The loader already drops `proposed` marks, so nothing enters the gate until
approved. The eval grows from the pages the product got wrong in the field.

## Kill list, this round

No second provider. No teacher surface. No dispute resolution or correction
events. No per-row marker calls. No landing-page change. No new question
types. No marker tuning against the existing golden set.

## After launch — written down so it stays out

- Dispute resolution as a correction event folded into mastery.
- Second vision/marking provider behind `lib/ai.ts`.
- Teacher digest, student-initiated.
- Authoring rule: new questions write `template` directly; `criterion`
  becomes its rendering with canonical values.
