# Production dependency audit — 5 September 2026

`pnpm audit --prod` at `ef9bedc`: 18 advisories (6 high, 9 moderate, 3 low)
across four packages, none a direct dependency. ROUND_6 Task 3 asks for
patched versions where the dependency line supports them, and a record of the
rest with reachability and the reason.

## Patched

- **sharp** (high, GHSA-f88m-g3jw-g9cj, libvips CVEs) — `next` 15.5.23 pinned
  `^0.34.3`; 15.5.25 accepts `^0.35.4`. `next` bumped to 15.5.25 and sharp
  pinned to `^0.35.4` in `pnpm-workspace.yaml` overrides, inside next's own
  range. Resolved: sharp 0.35.4. 17 advisories remain.

## Recorded, not patched

- **undici** ×12 (3 high, 6 moderate, 3 low): every path is
  `ai` / `@ai-sdk/openai` → `@ai-sdk/provider-utils@3.0.32` → `undici@5.29.0`.
  The 3.x line of provider-utils (latest 3.0.36) declares `undici ^5.29.0`;
  the patched versions are 6.24–6.28 and only provider-utils 5.x (which needs
  `ai` 7 / `@ai-sdk/openai` 4, a major migration of the generation and
  marking pipeline) reaches them. **Reachability: none.** provider-utils
  loads undici only inside `createSafeNodeFetch`, the fetch it uses to
  download URL-referenced media; every image we send is inline bytes
  (`lib/grade/transcribe.ts`, `lib/grade/check-construction.ts`) and the
  marker sends text, so that code path never runs. The advisories are in
  undici's WebSocket client, decompression and header handling, none of
  which is exercised. Revisit when the AI SDK major is taken.
- **postcss** ×4 (2 high, 2 moderate): `next` pins `postcss@8.4.31` exactly
  on every 15.5.x; an override would step outside next's declared range.
  **Reachability: build time only, on our own CSS.** The advisories need
  attacker-controlled stylesheets or source-map comments; nothing user
  supplied reaches PostCSS. Tailwind's own postcss is already 8.5.26.
- **@ai-sdk/provider-utils** ×1 (low, GHSA-866g-f22w-33x8, uncontrolled
  resource consumption): patched in `>=3.0.98`, which does not exist on the
  3.x line (latest 3.0.36); the fix ships in the line `ai` 7 uses. Same
  migration as undici; same revisit.
