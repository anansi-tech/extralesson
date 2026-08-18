#!/usr/bin/env bash
# The Round 1 kill list, as a gate rather than a habit.
#
# CLAUDE.md requires these greps to return zero hits. Twice they were run in the
# same breath as `git commit`, so their output was read after the push rather
# than before it — once shipping the word this project spells "KaTeX", once
# shipping two more. Reading order is not a control. Failing the commit is.
#
# Usage: scripts/check-kill-list.sh [files...]
#   with no arguments, checks the whole of app/ lib/ scripts/ tests/
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 1

if [ "$#" -gt 0 ]; then
  FILES=("$@")
else
  mapfile -t FILES < <(git ls-files 'app/**' 'lib/**' 'scripts/**' 'tests/**' \
    | grep -E '\.(ts|tsx)$' || true)
fi
[ "${#FILES[@]}" -eq 0 ] && exit 0

# Word-boundary matching throughout: "division" is not "vision", and
# "uploaded" is not "upload". The banned spelling of KaTeX is included by name.
BANNED='whatsapp|twilio|\bvision\b|\bupload\b|investigation|\bsba\b|tikz|jsxgraph|minhash|latex'

fail=0
hits=$(grep -HniE "$BANNED" "${FILES[@]}" 2>/dev/null || true)
if [ -n "$hits" ]; then
  echo "kill-list violation (CLAUDE.md forbids these in app/ lib/ scripts/ tests/):"
  echo "$hits" | sed 's/^/  /'
  fail=1
fi

# Stripe is banned as a DEPENDENCY, not as a word: a payment-link href is
# explicitly exempt, so only an import counts.
stripe=$(grep -HniE "(from|require)\s*\(?\s*['\"]stripe|@stripe/" "${FILES[@]}" 2>/dev/null || true)
if [ -n "$stripe" ]; then
  echo "kill-list violation (Stripe SDK import; a payment-link href is exempt):"
  echo "$stripe" | sed 's/^/  /'
  fail=1
fi

[ "$fail" -eq 0 ] && echo "kill list clean (${#FILES[@]} files)"
exit "$fail"
