// Which questions can be settled by computation, and what to compute.
//
// Extraction reads the question as a student would: the definitions from the
// stem, the demand from the part that asks. It is deliberately narrow — it
// recognises the shapes the papers actually use and reports everything else as
// unchecked, because a checker that guesses is worse than one that abstains.
import {
  composite,
  factorisation,
  inverse,
  satisfiesEquation,
  type Verdict,
} from './symbolic';

export interface CheckTarget {
  slotRef: string;
  family: string;
  verdict: Verdict;
}

interface QuestionLike {
  stem?: string;
  stimulus?: string;
  parts?: { label: string; prompt: string; slots?: { label: string; prompt?: string; answer: string }[] }[];
}

/** "f: x \to 2x+1", "f(x) = 2x+1", "f : x \mapsto 2x + 1". */
export function functionDefs(text: string): Map<string, string> {
  const defs = new Map<string, string>();
  // A period inside a decimal is part of the definition; a period that ends the
  // sentence is not. "g: x \to 0.9x" was being read as "g = 0", which reported
  // a failure against a question that was correct.
  const body = String.raw`((?:[^$,;\n.]|\.(?=\d))+)`;
  const arrow = new RegExp(String.raw`\b([fghpq])\s*:\s*x\s*(?:\\to|\\mapsto|\\rightarrow|->)\s*` + body, 'g');
  const call = new RegExp(String.raw`\b([fghpq])\s*\(\s*x\s*\)\s*=\s*` + body, 'g');
  for (const re of [arrow, call]) {
    for (const m of text.matchAll(re)) {
      const body = m[2].replace(/\\quad|\\ /g, ' ').trim();
      if (body && !defs.has(m[1])) defs.set(m[1], body);
    }
  }
  return defs;
}

/** The expression a "factorise"/"expand" instruction is pointing at. */
function subjectExpression(prompt: string): string | null {
  const m = prompt.match(/\$([^$]+)\$\s*$/) ?? prompt.match(/\$([^$]+)\$/);
  return m ? m[1] : null;
}

/** The equation a "solve" instruction is pointing at. */
function subjectEquation(prompt: string): string | null {
  for (const m of prompt.matchAll(/\$([^$]+)\$/g)) {
    if (m[1].includes('=')) return m[1];
  }
  return null;
}

export function checkQuestion(q: QuestionLike): CheckTarget[] {
  const out: CheckTarget[] = [];
  const context = `${q.stimulus ?? ''} ${q.stem ?? ''}`;
  const defs = functionDefs(context);

  for (const part of q.parts ?? []) {
    for (const slot of part.slots ?? []) {
      const ref = `${part.label}.${slot.label}`;
      const ask = `${part.prompt} ${slot.prompt ?? ''}`;
      const answer = slot.answer;
      if (!answer) continue;

      // A function-valued demand has a function-valued answer. "Calculate
      // f^{-1}g(2)" asks for a NUMBER, and comparing that number against the
      // inverse function reports a failure that is the checker's, not the
      // question's — which is what it did on the first run.
      // The variable itself, not a standalone word: "2x+4" has no isolated
      // letter, and testing for one rejected every valid function answer.
      const answerIsExpression = /x/.test(answer.replace(/\\[a-zA-Z]+/g, ''));

      // Composition. fg(x) means f(g(x)) — apply g first. Reversing this is the
      // failure that got through two model passes agreeing with each other.
      const comp = ask.match(/\b([fghpq])\s*([fghpq])\s*\(\s*x\s*\)/);
      if (comp && answerIsExpression && defs.has(comp[1]) && defs.has(comp[2]) && comp[1] !== comp[2]) {
        const [outer, inner] = [comp[1], comp[2]];
        out.push({
          slotRef: ref,
          family: `composite ${outer}${inner}`,
          verdict: composite(defs.get(outer)!, defs.get(inner)!, 'fg', answer),
        });
        continue;
      }

      // Inverse.
      const inv = ask.match(/\b([fghpq])\s*\^\s*\{?\s*-\s*1\s*\}?/);
      // f^{-1}g(2) or f^{-1}(5) is an evaluation, not the inverse function.
      const wantsFunction = /\^\s*\{?\s*-\s*1\s*\}?\s*\(\s*x\s*\)/.test(ask);
      if (inv && wantsFunction && answerIsExpression && defs.has(inv[1])) {
        out.push({ slotRef: ref, family: `inverse ${inv[1]}`, verdict: inverse(defs.get(inv[1])!, answer) });
        continue;
      }

      // Factorise / expand: the answer must be the same expression, rewritten.
      if (/\bfactoris|\bfactoriz|\bexpand\b/i.test(ask)) {
        const subject = subjectExpression(ask);
        if (subject) {
          out.push({
            slotRef: ref,
            family: /expand/i.test(ask) ? 'expansion' : 'factorisation',
            verdict: factorisation(subject, answer),
          });
          continue;
        }
      }

      // Solve: each root must satisfy the equation it came from.
      if (/\bsolve\b/i.test(ask)) {
        const eq = subjectEquation(ask);
        const variable = eq?.match(/\b([a-z])\b/)?.[1] ?? 'x';
        if (eq) {
          const roots = answer.split(/;|,|\bor\b/).map((r) => r.replace(/^[a-z]\s*=\s*/i, '').trim()).filter(Boolean);
          for (const [i, root] of roots.entries()) {
            out.push({
              slotRef: `${ref}${roots.length > 1 ? `[${i}]` : ''}`,
              family: 'equation root',
              verdict: satisfiesEquation(eq, variable, root),
            });
          }
          continue;
        }
      }
    }
  }
  return out;
}

/** The authoritative verdict: any deterministic failure sinks the question. */
export function symbolicVerdict(q: QuestionLike): {
  checked: number;
  failures: { slotRef: string; family: string; reason: string }[];
} {
  const targets = checkQuestion(q);
  const decided = targets.filter((t) => t.verdict.checked);
  return {
    checked: decided.length,
    failures: decided
      .filter((t) => !(t.verdict as { ok: boolean }).ok)
      .map((t) => ({ slotRef: t.slotRef, family: t.family, reason: (t.verdict as { reason: string }).reason })),
  };
}
