# Round 1.9 — Construct-then-interrogate

Supersedes R1.8 Part 6's deferral of "construction/drawing response types", for
the four families below only. Instrument constructions — ruler-and-compasses
bisectors, perpendiculars, triangle construction — remain out of scope.

## What it is

The shape the real Paper 2 uses for its graph questions. The question opens by
asking the candidate to draw something on graph paper, and the parts that follow
interrogate what they drew: state the roots, the y-intercept, the minimum, the
axis of symmetry; draw a second line on the same axes and hence solve the pair.

Standalone drawing practice is not what is being added. A construction that no
later part interrogates is rejected by the validator.

## Measured share

15% of Paper 2 questions set a construct part in one of the four families —
8 of the 55 questions in the five May/June papers that carry a usable text layer
(2016–2019, 2021; the other ten reference papers are image-only). Counting every
construct demand regardless of family gives 11 of 55 (20%); the difference is a
histogram and a Venn diagram, which the papers set as draw-then-read and we set
as read-only.

`CONSTRUCT_SHARE` is a deficit `nextRecipe` consumes, gated on the template the
representation deficit already chose. A target the recipe does not consume is a
wish, and the prompt forbids construct slots outright unless the recipe asks.

## Families

| Family | Template | Interrogated by |
|---|---|---|
| Linear / quadratic graph | `coordinateGrid` | roots, intercepts, turning point, axis of symmetry, graphical simultaneous solution |
| Travel graph | `travelGraph` | speed from a segment, distance at a time, total journey |
| Ogive | `cumulativeFrequency` | median, quartiles, interquartile range, counts below a value |
| Pattern figure | `patternFigure` | the next figure's counts, the nth term |

## Mechanics

1. `response_mode: 'construct'` at slot level, treated exactly as `explain` is —
   the construct slot alone leaves the graded pool, the rest of the question
   stays auto-marked, and mastery counts the marks we mark. All three schema
   boundaries already carried the enum value; only the ban was removed.
2. On completion the correct construction is rendered from the template and
   shown with a self-check list of the acts an examiner credits — points
   plotted, smooth curve, intercepts labelled, correct scale. The acts are
   per-family constants, not per-question model output.
3. Answers to the interrogation parts derive from the equation or the data and
   are verified symbolically as usual. Nothing is ever read off a drawing.
4. The figure is the ANSWER to part (a): it is not in the page the student
   answers on, and travels back with the marking, as the answers do. The
   construct slot shows its instruction and "do this on graph paper".
5. Coverage sentence updated; the printed figure is unchanged at about 90%,
   because a partial objective is still an assessable one and `displayFigure`
   already rounds down.

## R2 note — not for now

A photographed construction is more machine-checkable than free working, not
less: the ground truth is a set of coordinates we already hold, so agreement is
a geometric comparison rather than a reading of prose. Construct slots are
therefore R2's natural second assessment target, after working-marking.
