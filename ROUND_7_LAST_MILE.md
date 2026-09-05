# ROUND 7 — THE LAST MILE

Two external walkthroughs (5 Sep, `5d5fd4a`) found what a stuck sixteen-
year-old and a tired operator would find in the first hour: a student who
doesn't know the answer can't hand in; we promise to fill boxes we don't
fill; a wrong answer gets the mark scheme's sentence instead of a
sentence to the student; the operator can't resolve a dispute from the
dispute screen; a stray keypress retires a live question. None of it is
architecture. All of it is the last mile.

**Scope rule.** Four tasks, in order. Launch the day task 4 merges. Nothing
found along the way is added. After this round the only source of
information is a student on their own phone.

**Standard.** One obvious next action, with the evidence and the way out
beside it.

## Task 1 — Feedback speaks to the student

Three sources of feedback exist: authored misconception remediation (best,
fires on a pattern match), the marker's per-row reason (explains the
decision, grounded in a quoted line), and the rubric criterion as fallback
(the assessor's sentence — wrong register). Nothing says "here is where
*you* went wrong."

- **`slip`, from the marker.** For each part with a withheld value row and a
  read, the marker returns one sentence naming the line where the working
  went wrong, e.g. "In '1200000 − 144000 = 156000' the subtraction is off
  by 900 000." Quote-verified against the read like every award; a slip
  whose quote isn't on the page is dropped. No read, no slip. Rendered as
  the first line under the part, in red pen. Eval: slips reported on the
  five pipeline pages; a slip that cites a line not on the page fails.
- **`hint`, from the bank.** Every method row gains a second-person `hint`:
  "Find where the two lines cross — that's where the retained amounts are
  equal." Generated once by script from the criterion, in batches of 200,
  written as `proposed` and approved by David the way golden batches are.
  Runtime is deterministic: a wrong answer with no misconception match and
  no slip shows the hint. The criterion text never reaches a student again;
  `"their"` → `your` rewriting is deleted with it.
- **Order on a marked part:** slip or hint or remediation (one sentence),
  then ✓/– rows with reasons, then codes. Codes are demoted below the
  sentence, never removed.
- **Top of a marked question:** one line — marks earned of assessed, N
  unassessed — and three jump links: Your marking · Question · Worked
  solution. History opens at Your marking.
- Failed marking: caption beside the score says marking did not finish and
  offers the retry; "this photo" is never blamed for a marker timeout.

## Task 2 — No dead ends

- **Hand in as is.** Submit is always enabled. With blank slots it reads
  "Hand in as is"; a confirmation line says blanks score zero, like the
  exam. The attempt records the blanks; the fold scores them withheld; the
  worked solution reveals. MCQ gets "I don't know" as a fifth option that
  scores wrong. Never a hidden path to the solution.
- **Multi-value prefill, honestly.** After a read, the copy says which boxes
  were filled and which weren't: "We filled the single answers. Enter the
  vector and ratio values below." Those fields are highlighted with a jump.
  The landing and the camera card stop promising universal prefill.
- **Nav at 320/360.** Logo and links on separate rows below 400px; document
  width equals viewport at 320, 360, 390 with long emails. Admin access page
  wraps long identifiers inside their card. Tested.
- **Line exclusion is reversible until submit.** "Not what I wrote" toggles;
  no dialog. The photo thumbnail stays, collapsible, while the page is open.
- **After the last take:** "No retakes left for this question. Check the
  answer boxes below. If we misread your working, tell us:" with the help
  address.
- **Account and help.** A compact disclosure in the student nav shows the
  signed-in email, sitting, help address, sign out. Sign out target ≥ 44px.

## Task 3 — The operator can act

- **One complete dispute case.** Student email, full question with parts
  and figure, the working for the part, the photo if within TTL (else
  "photo expired"), the criterion, the decision, the reason. "Reply by
  email" as a mailto with the case summary prefilled. `DisputeReview
  { dispute_id, reviewed_at, note }` append-only; the list shows reviewed
  state. Export stays as a secondary link. Marker-raised reviews get the
  same case view.
- **Payments needing attention.** `/admin/access` lists fulfilments in
  `failed` and stale `pending` (> 1h) with reference and next manual step,
  under "Payments needing attention"; then "Paid access"; then "Free
  allowance used". The word "waiting" goes.
- **Search.** Email search and an attention filter on access. Grant success
  names the account and sitting. Resolving an unmatched payment requires a
  reason.
- **`r` is deliberate.** Keyboard shortcuts act only when the review card
  has focus; retiring an approved question asks once.
- **Review says the truth.** "Overall totals met; N topic targets short"
  when true; each short cell opens the filtered question search. The stale
  "self-marked" flag is retired.

## Task 4 — The landing page, restructured

One telling of each idea, one CTA in the hero, proof first.

- **Hero:** h1, phone mock, lede, one button "Mark one question free" with
  its label line. Sign in is a quiet link in the nav row. No price here.
- **Band:** one line — 84% of Paper 2 marks are for working.
- **Steps:** three ruled rows, not shadowed cards, on mobile; 3-up on
  desktop. A second "Mark one question free" after step 3.
- **Founder:** the 38% lives here, once.
- **Offer:** left-aligned like the page; price; one sentence-case paragraph
  covering payer-email and refund; the all-caps labels stay labels.
- **FAQ** gains "Is it the whole paper?" (the coverage paragraph, moved).
  "Predicted grade tracking from day one" → what the gate does: "A grade
  estimate once we've seen enough of your work — 35 marks in every
  module."
- **Deleted:** MARKS/WHY/NEXT list; the stats band's 38%; every second
  occurrence of "every method mark", "on paper, by hand", "the way the
  exam works".
- **Finish:** one corner radius; one measure (`.lede`, `.honest` inherit
  the wrap); dim-text token darkened to ≥ 4.5:1 on paper; figure recall is
  a labelled dialog with Escape and focus return; a quiet "Saved" /
  "Couldn't save" beside the answers.
- Gate: `legal.test.ts` pins the new lede; visible-text counts for the
  three phrases are 1; document width at 320/360/390/1440 equals viewport.

## Kill list, this round

No tutor chat, no onboarding tour, no gamification, no parent view, no
refund automation, no CMS, no ticketing, no marker prompt changes beyond
`slip`, no multi-value prefill implementation, no new question types.

## After the pilot — written down so it stays out

- Human correction event, folded through `attemptOutcome`, and an
  attempt-level report when no row verdict exists. First.
- Multi-value prefill.
- Second vision/marking provider.
- A genuinely short authored starter question.
- Teacher digest.
