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

The generated `question-corpus-inventory.json` records discovery metadata, fetch status, byte size,
format signature, SHA-256, classification, eligibility, exact-duplicate relationships, and probable
copies identified by year/session/paper. A CSECHub copy is canonical when both sources list the same
exam; this prevents different scans of one paper from biasing later aggregate analysis. The artifact is
not a question bank and must never be used as a place to add extracted source content.
