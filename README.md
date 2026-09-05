# ExtraLesson

AI-powered CSEC Mathematics tutoring for the Caribbean. Current spec:
[ROUND_6_ONE_TRUTH.md](./ROUND_6_ONE_TRUTH.md) (one score fold, scoped
payment, unique attempts and reads, the gate as a gate), on top of
[ROUND_5_CLAIMS.md](./ROUND_5_CLAIMS.md), [ROUND_4_FIRST_RUN.md](./ROUND_4_FIRST_RUN.md),
[ROUND_1_5_FINAL.md](./ROUND_1_5_FINAL.md) and [ROUND_1_EXTRALESSON.md](./ROUND_1_EXTRALESSON.md).
`CLAUDE.md` is the standing instruction file; there is no other.

Ground truth for all syllabus content is `design/syllabus-2027.pdf`
(CXC 05/G/SYLL 16, Amended Oct 2025, effective May–June 2027).

## Setup

```bash
cp .env.example .env   # fill in values
pnpm i
pnpm seed:topics
pnpm seed:blueprints
pnpm dev
```

Requires Node 20+, pnpm, and a MongoDB instance (`MONGODB_URI`).

## Routes

| Route | Purpose | Auth |
|---|---|---|
| `/` | Landing page | Public |
| `/study` | Student app | Session cookie (30 days) |
| `/study/login` | Email + password, or register | Public |
| `/study/reset` | Set a new password from a reset link | Reset token |
| `/admin/review` | Question review queue | Admin role (`pnpm admin:provision`) |
| `/admin/coverage` | Objective coverage + target matrices | Admin role |
| `/admin/topics` | Syllabus graph + blueprint viewer | Admin role |

## Question generation (recipe-driven, R1.5)

```bash
pnpm generate -- --count 10                          # recipes from the largest matrix deficit
pnpm generate -- --count 10 --topic M2-GEO1 --kind structured   # narrowed overrides
```

Generation uses OpenAI (`gpt-5.5`) via the Vercel AI SDK; set `AI_API_KEY` to an
OpenAI key. Each question is generated from a 6-field recipe computed from the
P1/P2 target matrices, then passes four gates before insertion: Zod schema →
visual verify (`lib/visuals/verify.ts`, numeric cross-checks) → independent
per-part solve (visual passed as text, never SVG) → dedup vs the approved bank.
Every rejection logs its evidence. Approve drafts in `/admin/review` —
Edit→Approve re-runs the visual and solve gates.

Visuals are parametric: the model emits `{template, params}` against the 15
SVG templates + `dataTable` in `lib/visuals/`; raw SVG is never accepted.

## Security notes

- Auth is email + password. Hashing is scrypt from `node:crypto` — a real
  password KDF already in the runtime, so this adds no dependency to the one
  surface where a supply-chain problem would be a credential problem.
- Sign-in reveals nothing about who has an account: an unknown email is offered
  registration rather than told it is unknown, and a reset request answers the
  same way whether or not the address is registered.
- **Rotating `SESSION_SECRET` logs out every user globally.** This is intentional:
  sessions are stateless HMAC cookies, so the secret is the kill switch.
- Password-reset links are sent with Resend (`RESEND_API_KEY`, `RESEND_FROM` —
  the same variables cognicare uses). With no key set the link is printed to the
  server log instead (`[reset-link] …`) so local development works; with a key
  set it is NOT logged, because a reset link in a log is a way into the account
  for anyone who can read logs.
- A provider outage is never reported to the form. An error there would mean the
  address exists, which is exactly what the neutral reply is protecting.
- Accounts created before passwords existed have no hash and cannot sign in;
  they set one through the reset flow.

## Tests & verification

```bash
pnpm test                       # Vitest, all green (the pre-commit hook runs this too)
pnpm check:kill-list            # the CLAUDE.md greps over app/ lib/ scripts/ tests/
pnpm eval:marker                # marking gate: 5 runs, exits 1 below the bar
pnpm eval:reads                 # reading gate: page loss and calibration cases
pnpm eval:pipeline              # photo -> readWorking -> markWorking, production path
pnpm admin:provision -- --email you@example.com   # make an operator (sends a set-password link)
pnpm golden:import <bundle>     # a field dispute into design/golden, proposed
pnpm golden:field-prune --yes   # delete field images older than 90 days
```

One-off repairs and backfills that have already run live in `scripts/done/`.

To demonstrate the pipeline's independent-solve rejection, run generation with
the `--poison` test hook and watch drafts get auto-rejected:

```bash
pnpm generate -- --topic M1-ALG1 --difficulty 1 --count 2 --kind mcq --dry-run --poison
```
