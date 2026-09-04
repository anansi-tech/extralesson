# The marking golden set

Thirty simulated workings for questions already in the bank: 15 to be
handwritten and photographed, 15 typed. See `ROUND_2_EXAMINER.md` §6 and
`HUMAN_TASKS.md` for the completed collection record.

- **Photographed half** — transcription ground truth on real input, and the
  end-to-end set. Copied out by 3–5 different people, so the confidence
  threshold is not calibrated on one neat hand.
- **Typed half** — fast marking coverage, and where follow-through cases are
  constructed deliberately: an early value wrong, correct method after it.

The artifacts are deliberately separate:

- `set.json` — simulated working and exact transcription truth.
- `review.json` — separately typed final answers plus the human-approved rubric
  decisions.
- `APPROVAL_LOG.md` — the six human approval batches and their decisions.
- `HUMAN_TASKS.md` — the original writing/photo assignments and completion
  record.

Put photographs in this directory using the filename already declared in
`set.json`:

```json
[
  {
    "id": "g01",
    "question_id": "6a8674d3b944c6fb77c0c05d",
    "writer": "w1",
    "mode": "photo",
    "image": "g01.jpg",
    "transcript": [
      { "part_label": "a", "text": "Area = 24 x 16" },
      { "part_label": "a", "text": "= 384 m^2" }
    ]
  }
]
```

- `writer` is an anonymous stable label — `w1`, `w2`, `w3`. Accuracy is reported split
  by it, because the spread between hands is what says whether the threshold
  holds in the field.
- `transcript` is what is ACTUALLY written, line by line, in the conventions the
  grader parses (`2x + 3`, `sqrt(5)`, `24 m by 16 m`). Photographed entries only.
- `mode: "typed"` entries need no `image`, and their `transcript` is the working
  itself.
- The typed answer boxes are not inferred from the working. They live in
  `review.json`, because production receives those answers separately and uses
  them to remove rows already settled by deterministic marking.

Human approval was completed by David on 2026-08-23. The current project has no
golden-set commands because the temporary evaluator code was reverted; these
private artifacts are the prepared input for the later Round 2 implementation.
