# ROUND 13 — THE OPERATOR

Every student screen has been designed. None of the five admin screens has.
They grew a feature at a time and they read like it: an Access page that
shows every account at rest, with up to three form fields per row before
anybody has decided anything; a deficits line that runs four facts into one
sentence; a Coverage page you read and then navigate by hand.

The operator is one person doing focused work. They arrive with **work** —
a payment needs deciding, a question needs approving — or with **a name**.
Never to browse. Every screen should be built for those two arrivals and
nothing else.

**Scope rule.** Five tasks, one commit each, one screen each. **No new
features.** Every screen here exists and works; this round changes what is
shown and in what order. If a task seems to need a new capability, stop and
say so rather than building it.

**The system.** The same tokens, chrome, fonts, refusal and failure
patterns as the student screens. An admin page is the notebook with more
in it. Colour by token, never a literal — `admin-system.test.ts` already
enforces this and it caught a hex on the last commit.

**Red.** Reserved for one commitment per page and for a lost mark. Admin
primaries are ink-filled. Delete an account and Reply by email are the
exceptions, because they are the one irreversible act on their page.

## Task 1 — Access

The page is the queue and a search. Everything else is a count until it is
asked for.

**Order:** the launch banner, the queue, the search, the counts, the
recently-changed list, then two disclosures at the foot.

- **Payments that need you** — `waiting` and `duplicate` only, always
  expanded, full detail. It carries the page's card shadow; nothing else
  on the page has one, so the work is the only thing that looks like work.
- **A row shows its primary action only.** `waiting` → an address field
  and Grant to this account. `duplicate` → Close (refunded).
  `refund_approved` → Finish it. Everything else is behind a quiet
  **Other actions**.
- **The reason field appears after the action is chosen**, never before —
  a field beside a button nobody has pressed is a field you read past. The
  one exception is `waiting`, where the address *is* the decision and the
  field is the primary.
- **Search** by email, as now, with the attention-only filter.
- **Counts**: with access · free allowance used · free tier · accounts.
  Each filters the list when clicked.
- **Changed in the last 7 days** — one line per account: address, sitting,
  one of three state words (`access`, `free used`, `revoked`) at a fixed
  width so the column reads straight down. Green for access, red for the
  two that need a decision eventually. Then **All N accounts** as a link.
- **A closed row has no input in it at all.**

**A row opens in place.** One at a time — opening a second closes the
first, so the page never grows under the thumb. Opening reveals below the
line and never reorders the list. The open row loses its underline and
gains an ink bar down its left, the same bar the queue uses.

An open row holds three blocks, the same three every time:

1. **Who they are** — name · entered for `<sitting>` · sessions ·
   questions. "Entered for" is the exam they registered for; it is not
   the same fact as the access below, and the two are never merged.
2. **Current access** — label-value pairs in a fixed label column, so
   values line up however long the words are: `ACCESS FOR`, `CLASS`,
   `GRANTED`, `REASON`. A note the form did not write reads `NOTE`, not
   `REASON`, and a class the note does not name reads *not named in the
   note* rather than a guess.
3. **Previous access · N** — a disclosure, closed by default, `· NONE`
   when there is none. **Open, it holds one line per prior grant: its
   sitting, its source, and its note verbatim, in the same label column
   as Current access.** No date is shown and none is inferred — a prior
   grant's date was never stored. It is not called a history: only one
   prior is kept, and an older note may carry nested history of its own,
   which is shown as it is and not unpicked.

Then the one control the grant permits, with its reason field:

- a paid grant → **Refund and revoke** (ink), with the sentence saying
  the money goes back, access ends now, their work stays, and how many
  days since payment against `REFUND_DAYS`;
- a comp → **Revoke** (outline), with "nothing was paid, so there is
  nothing to give back";
- a paid grant with no payment reference → the amber warning **above**
  the control it limits, then **Revoke** (outline). Above, not beside:
  you need to know the refund is unavailable before you decide that
  revoking alone is the right move.

**Grant access to an address** and **Delete an account** become one-line
disclosures at the foot, each with its warning beside the label ("when no
account matched a payment", "cannot be undone"). The delete panel keeps
its shortened copy and its deletion receipt.

## Task 2 — Review

- **The deficits strip moves above the card** and becomes four facts, not
  a sentence: objectives with no approved question · more below the floor
  of 2 · P1 items short · P2 on target. Each opens the search filtered to
  what it names.
- The header line stays: drafts remaining · approved · hints · P1 · P2.
- **On the card**: flags first (red bar for a warning, paper-deep for a
  note — a flag is a reason to look, never a verdict, and neither blocks
  approval), then the objective chips, then the meta line and recipe.
- **`the only evidence`** on an objective chip: rejecting this question
  leaves that objective with nothing. It is red and sits above the meta
  line because it is the one chip that changes a decision.
- Parts with their answers, the rubric with each row's hint beneath its
  criterion, final answer, worked solution, misconceptions.
- **Approve is the one red action.** Edit and Reject are outline and
  equal to each other. Keyboard letters shown at 1280, dropped at 390.

## Task 3 — Coverage

- **Every chip is a link.** A chip knows its objective; clicking it opens
  Review filtered to that objective. A report you navigate by hand is a
  report you stop reading.
- Objective coverage by topic, each chip carrying the id and its counts
  (`4a`, `1a+2d`, `✗`), with the legend directly beneath the chips it
  explains.
- P1 and P2 matrices, profile marks, archetypes, difficulty.
- The measured reading cost stays, as measured figures, never estimates.

## Task 4 — Topics

Read only, and it should say so once. Blueprints as cards, then each
module's topics as disclosures, closed by default, one line per objective.
Nothing else.

## Task 5 — Disputes

- **The list**: the marker's own questions first, in an ink-bordered card
  — a request for help is not a complaint and they should not look alike.
  Then student disputes, newest first, each showing the question, the row,
  the reason it was withheld and the read, inline.
- `NOT YET REVIEWED` in red is the only state on a row, and it is the one
  thing that decides whether you open it. `REVIEWED <date>` in green.
- **The case page** at 1280: question, figure and parts left with the
  disputed part red-barred in the parts list; criterion and decision
  right; then one panel — Reply by email (red), a note for the record,
  Mark as reviewed. Nothing here changes a mark, and the page says so.

## The banner

The before-launch banner stays, and every claim in it is **computed, not
typed**: whether the Stripe link is test mode, and `REFUND_DAYS` read from
the constant the pages read. A banner that asserts consistency and cannot
check it is worse than no banner.

## Gate

- Every admin screen renders at 390 and 1280 with no overflow, and joins
  the width harness.
- Every admin screen joins the gallery and passes its seven rules.
- No literal colour anywhere under `app/admin/`.
- A closed account row contains no form field.
- Opening a second row closes the first.
- Previous access open shows one line per prior grant, with no date, and
  the page never says "history".
- Every Coverage chip links to Review filtered to its objective.
- The banner's claims are read from the same constants the pages read.

## Kill list

No new admin features. No dashboard, no charts, no bulk actions, no
export. No second hue outside the coverage chip legend. No change to what
any action does — only to what is shown, and when.
