# Question-corpus research artifacts

This directory contains non-expressive metadata used to measure the coverage of the two archives
selected by the founder. The project follows the **unlicensed, metadata-only route**:

- source files are streamed into SHA-256 hashes and are never retained;
- no question wording, options, answers, marking material, diagrams, or OCR output is stored;
- exact duplicate files are excluded from later pattern analysis;
- Paper 3, mock/sample material, solutions, reference files, and unverified files are excluded;
- bundles remain excluded until they can be deduplicated at page level without retaining content.

Regenerate the inventory from the live public listings:

```bash
pnpm inventory:corpus
```

Resume the metadata-only classifier (completed papers are skipped):

```bash
pnpm classify:corpus -- --mode classify
```

The generated `question-corpus-inventory.json` records discovery metadata, fetch status, byte size,
format signature, SHA-256, classification, eligibility, exact-duplicate relationships, and probable
copies identified by year/session/paper. A CSECHub copy is canonical when both sources list the same
exam; this prevents different scans of one paper from biasing later aggregate analysis. The artifact is
not a question bank and must never be used as a place to add extracted source content.

Build the generation-target catalog from the checked-in classifications without making any network or
model calls:

```bash
pnpm build:bank-targets
```

`question-bank-targets.json` separates two sources of truth. The 2027 syllabus blueprints determine
the 400-question bank's topic and paper-kind coverage. The archive contributes only abstract style
distributions such as difficulty, archetype, command verb, context, part count, profile, and visual
type, including the objective combinations with which those controls co-occur. Only classifications at
or above 0.75 confidence, with a current objective and no critical review
flag, influence those style distributions. Representative joint patterns preserve combinations that
actually co-occurred, including at least one pattern for every observed visual type where available.
The catalog contains no question wording or source assets, and it is not permission to reconstruct a
source question; every generated question must remain original.

The 400-question figure is a launch minimum, not a ceiling. Preview an exactly apportioned larger bank
without network or model calls:

```bash
pnpm plan:bank -- --total 800
```

The scaled plan preserves the 60/40 structured-to-MCQ mix, reapportions topics from the official
paper weights, and scales visual coverage from the checked-in style targets. Generation and review can
therefore proceed in batches without changing the underlying catalog.
