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

Drafts are Zod-validated, independently re-solved by a fresh model call, and only
inserted (status `draft`, `verified: true`) when the independent solve agrees.
Approve drafts in `/admin/review`.

## Security notes

- Auth is passwordless magic-link (HMAC-SHA256, 15-minute expiry, single-use).
- **Rotating `SESSION_SECRET` logs out every user globally.** This is intentional:
  sessions are stateless HMAC cookies, so the secret is the kill switch.

## Tests

```bash
pnpm test
```
