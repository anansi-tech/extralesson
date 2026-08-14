# ExtraLesson

AI-powered CSEC Mathematics tutoring for the Caribbean. Round 1: content system,
practice loop, and landing page. Spec: [ROUND_1_EXTRALESSON.md](./ROUND_1_EXTRALESSON.md).

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

## Question generation

```bash
pnpm generate -- --topic M1-ALG1 --difficulty 2 --count 10 --kind structured
```

Generation uses OpenAI (`gpt-5.5`) via the Vercel AI SDK; set `AI_API_KEY` to an
OpenAI key. The checked-in corpus target catalog selects abstract, topic-specific
question recipes, including visual frequency and format. Visuals are stored as
strict data and rendered by first-party components; generated SVG or HTML is not
accepted. Drafts are Zod-validated, independently re-solved by a fresh model call
with the same visual data, and only inserted (status `draft`, `verified: true`)
when the independent solve agrees. Approve drafts in `/admin/review`.

After deploying this schema change to a database containing existing questions,
run the idempotent backfill once:

```bash
pnpm backfill:question-generation
```

The 400-question bank is a launch minimum. Preview a larger, proportionally
equivalent plan locally with `pnpm plan:bank -- --total 800`.

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
