#!/usr/bin/env node
// A NAME THAT IS TAKEN IS REFUSED, NOT OVERWRITTEN.
//
// `cat > scripts/eval-prefill.ts <<'TS'` believing the name was free replaced a
// working tool with a different one, and the same had already happened to
// lib/grade/symbolic.ts. Both were caught by reading a diff afterwards, which is
// luck, not a control. The Write tool refuses to overwrite a file it has not
// read; the shell had no such door, and this is it.
//
// Refused: a truncating redirect onto a file that exists inside the repository.
// Allowed: creating a name that is free, appending with >>, and everything
// outside the checkout — /tmp, /dev/null, the scratchpad. To replace a file on
// purpose, read it and use Write or Edit, or delete it and say why.
//
// Node rather than jq, which is not installed here: a hook that cannot run is a
// hook that silently permits, and that is the failure it exists to prevent.
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { isAbsolute, relative, resolve } from 'node:path';

/** A heredoc body is data, not shell: the > inside one redirects nothing. */
function withoutHeredocs(command) {
  const lines = command.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i]);
    const opened = [...lines[i].matchAll(/<<-?\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?/g)].map((m) => m[1]);
    for (const marker of opened) {
      while (++i < lines.length && lines[i].trim() !== marker);
    }
  }
  return out.join('\n');
}

/**
 * Every path a truncating redirect would write.
 *
 * Judged per > rather than by rewriting the line, because both sides matter: a
 * > INSIDE quotes is a character and redirects nothing — the check fired on its
 * own test harness, where "cat > package.json" was an argument — while a target
 * may itself be quoted, and blanking quoted runs would have lost it. >> appends
 * and >( starts a process, so neither truncates a name.
 */
function truncated(command) {
  const text = withoutHeredocs(command);
  const quoted = new Array(text.length).fill(false);
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      quoted[i] = true;
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      quoted[i] = true;
    }
  }

  const targets = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '>' || quoted[i]) continue;
    if (text[i + 1] === '>') { i++; continue; }
    if (text[i - 1] === '>' || text[i + 1] === '(') continue;
    const named = /^\s*(['"]?)([^\s;&|<>()'"]+)\1/.exec(text.slice(i + 1));
    if (named) targets.push(named[2]);
  }
  return targets;
}

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const command = input?.tool_input?.command;
if (!command) process.exit(0);

let root;
try {
  root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
} catch {
  process.exit(0); // Not a checkout: nothing here has a name to protect.
}

for (const target of truncated(command)) {
  if (target.startsWith('/dev/') || target.startsWith('/tmp/')) continue;
  const full = isAbsolute(target) ? target : resolve(process.cwd(), target);
  const inside = relative(root, full);
  if (inside.startsWith('..') || isAbsolute(inside)) continue;
  if (!existsSync(full)) continue;
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        `${inside} already exists, and a redirect would replace it whole — which is how a new script has twice taken ` +
        `the name of a working one. Read it and use Write or Edit if you mean to change it; pick another name if you ` +
        `meant a new file; redirect to /tmp if it is scratch.`,
    },
  }));
  process.exit(0);
}
process.exit(0);
