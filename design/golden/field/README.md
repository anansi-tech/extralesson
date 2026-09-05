# Field images

Pages photographed by real students, imported from a dispute with
`pnpm golden:import <bundle> ` when the bundle was exported **with image**
(`/admin/disputes/<id>/export?image=1`). The default export is text: the
transcript is what the evals replay, and it names nobody. An image here is
the disputed read's own take — the page the marker saw — never a later
retake.

Everything in this directory except this file is gitignored and never
leaves the machine that imported it.

## Retention

- **Deleted with the account.** Erasing a student (`lib/delete-student.ts`)
  deletes every image here named by one of their reads (`f-<read id tail>`),
  and reports the count as `FieldImage`.
- **Deleted after 90 days.** `pnpm golden:field-prune --yes` deletes any
  image older than 90 days; without `--yes` it lists what it would delete.
  The golden entry and its transcript stay either way.
