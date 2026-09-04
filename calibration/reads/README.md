# Reading calibration cases

Committed, unlike `design/golden/` — no CXC content, and each case is a page
we wrote to pin ONE reader behaviour. `pnpm tsx scripts/eval-reads.ts [runs]`
reads every golden photograph for page loss and every case here for its
required lines, `runs` times (default 3). A case passes a run when every
`required` line appears in the read, attributed to its part, and no
`forbidden` string does.

Each `<id>.json` names its `<id>.jpg`:

```json
{
  "id": "cocoa-b1",
  "question_id": "…",
  "required": [{ "part_label": "b", "text": "1200000 - 144000 = 156000" }],
  "forbidden": ["1056000"],
  "pins": "why this page exists"
}
```
