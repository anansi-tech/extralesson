# ExtraLesson

AI-powered CSEC Mathematics tutoring for the Caribbean. Current spec:
[ROUND_1_5_FINAL.md](./ROUND_1_5_FINAL.md) (visuals, multi-part questions,
target matrices) on top of [ROUND_1_EXTRALESSON.md](./ROUND_1_EXTRALESSON.md).

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
| `/study` | Student app | Magic-link session |
| `/study/login` | Email → magic link | Public |
| `/admin/review` | Question review queue | Admin allowlist (`ADMIN_EMAILS`) |
| `/admin/topics` | Syllabus graph + blueprint viewer | Admin allowlist |

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

- Auth is passwordless magic-link (HMAC-SHA256, 15-minute expiry, single-use).
- **Rotating `SESSION_SECRET` logs out every user globally.** This is intentional:
  sessions are stateless HMAC cookies, so the secret is the kill switch.
- No email provider is configured this round — magic links are printed to the
  server log (`[magic-link] …`). Grab the link from there to sign in.

## Tests & verification

```bash
pnpm test                                                       # Vitest, all green
grep -riE 'whatsapp|twilio|investigation|sba' app lib scripts   # kill-list: zero hits
grep -riwE 'vision|upload' app lib scripts                      # kill-list: zero hits
grep -riE "from ['\"]stripe" app lib scripts                    # no Stripe SDK: zero hits
```

To demonstrate the pipeline's independent-solve rejection, run generation with
the `--poison` test hook and watch drafts get auto-rejected:

```bash
pnpm generate -- --topic M1-ALG1 --difficulty 1 --count 2 --kind mcq --dry-run --poison
```
