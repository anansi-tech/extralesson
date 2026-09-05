# ROUND 8 — THE NOTEBOOK

Claude Design produced one system and every student screen in it. The
reference is `design/ui/*.dc.html` — five files, each a set of states at
390 and 1280. This round moves pixels, not behaviour: no new capability,
no changed rule, the test suite unchanged in what it asserts. The gate for
every task is the design file for that screen.

**Scope rule.** Six tasks, in order. Launch sequence begins the day task 5
merges. Admin screens keep their current layout; they are next round.

**Reference files**
- `design/ui/ExtraLesson System Sheet.dc.html` — tokens, type, spacing,
  buttons, inputs, marks, the red-pen line
- `design/ui/ExtraLesson Dashboard.dc.html` — four states, both widths
- `design/ui/ExtraLesson Question Card.dc.html` — four capture states
- `design/ui/ExtraLesson Marked Question.dc.html` — marked, queried with a
  struck line, marking failed
- `design/ui/ExtraLesson History Progress Stakes.dc.html` — history,
  progress, the stakes tiles at both widths

Where a design file and this document disagree, this document wins; where
this document is silent, the design file is the spec.

## Task 0 — Tokens, fonts, chrome

- `app/globals.css` carries every variable on the system sheet, named as
  the sheet names them. Existing values stay; the sheet's additions land
  (`--font-hand`, `--shadow-card/-key/-panel/-on-ink`, `--rail`, `--col`,
  `--rule-*`, `--target`, the type and spacing scales). Any old variable
  the sheet renames is renamed once, everywhere.
- Caveat is self-hosted with the other fonts; no third-party font request
  from a student's phone.
- One `StudyChrome` layout: the white nav bar above the paper — lockup,
  Notebook · History · Progress, sitting, **Help** (mailto), Sign out —
  two rows at 390, one at 1280. Every student page renders inside it.
  Document width equals viewport at 320, 360, 390, 1280.
- The paper: ruled lines and the margin rule at the sheet's geometry
  (`--rule-offset-sm/-lg`, `--rule-gap`), content aligned to the rule.

## Task 1 — Dashboard

Four states exactly as drawn: new student, first question done, returning,
no estimate yet. "Kiara's notebook." heading with the student's first name.
The estimate is a panel in the rail at 1280 and below the action at 390,
never the headline. Revisit and diagnostic are equal secondary actions.
Counters as drawn. No prose under the primary button beyond its label line.

## Task 2 — Question card

Four capture states as drawn: unanswered, reading, read with boxes filled,
blanks left. Camera above the boxes. "From your page — check it" on a
prefilled box; "hard to read" on a low-confidence read line; "Marked from
your photograph — nothing to type" on a paper-only part; "Take it again ·
1 retake left"; the blanks line under "Hand in as is". At 1280 the figure
stays beside the parts.

## Task 3 — Marked question

Fixed order top to bottom, as drawn: outcome line with three jump links ·
the red-pen sentence in the hand font · rows with reasons · what we read ·
worked solution · codes last · Next question. Three states: marked; queried
with a struck line and "Put it back"; marking failed with the read kept and
"Try marking again". "Query this mark" and its queried line as drawn.

## Task 4 — History and Progress

History: newest first, date, stem, score with "· N not assessed" where
true, each opening at Your marking; "Revisit the N marks you lost" at the
foot. Progress: per-module estimate panel and topic rows with
Strong/Building/Weak; "Practise <weakest topic>" at the foot with its
marks. Both in the chrome.

## Task 5 — Stakes tiles

Two tiles at both widths, as drawn, with these figures and nothing else:

- **36%** · of candidates passed · CXC Subject Report, May–June 2026
- **70%** · of Paper 2 marks are for method · CXC syllabus, from May–June 2027

Sources link in a new tab. The legal test pins both figures to their
cxc.org URLs as it does today.

## Gate, every task

`pnpm test` green with no assertion weakened; the width test at
320/360/390/1280 on the screen touched; a visible-text test for the copy
the design specifies on that screen; a screenshot of each state at 390
attached to the commit message for David to compare against the design.

## Kill list

No admin layout. No new copy beyond the design files. No behaviour change.
No animation. No component library.

## Next round

Admin on the same chrome. Then the launch sequence.
