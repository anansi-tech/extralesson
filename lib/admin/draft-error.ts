import type { ZodError, ZodIssue } from 'zod';

/**
 * WHY A SAVE WAS REFUSED, IN WORDS THAT NAME THE FIELD.
 *
 * QuestionDraftZ is a union of the two question shapes, and Zod reports a
 * failure inside either branch as one `invalid_union` issue at the ROOT, with
 * the message "Invalid input" and an empty path. The editor showed
 * `path || 'question'`, so an emptied slot answer, a rubric row missing its
 * code, a part label out of sequence and an unknown archetype all arrived as
 * "question: Invalid input" — a refusal with no way to know what is wrong,
 * which is the same defect as a save that fails silently.
 *
 * So the union is walked: the branch that disagrees about `kind` is the wrong
 * shape and its complaints are noise, and what is left is the real fault.
 */
const KIND_MISMATCH = (i: ZodIssue) => i.path.length === 1 && i.path[0] === 'kind';

function leaves(error: { issues: ZodIssue[] }): ZodIssue[] {
  return error.issues.flatMap((issue) => {
    const branches = (issue as { unionErrors?: { issues: ZodIssue[] }[] }).unionErrors;
    if (issue.code !== 'invalid_union' || !branches?.length) return [issue];
    // The branch for THIS question's kind is the one that does not object to it.
    const fitting = branches.filter((b) => !b.issues.some(KIND_MISMATCH));
    return (fitting.length ? fitting : branches).flatMap(leaves);
  });
}

/** "parts.0.slots.0.answer: String must contain at least 1 character(s)" */
export function explainDraftError(error: ZodError, limit = 3): string {
  const seen = new Set<string>();
  const said: string[] = [];
  for (const issue of leaves(error)) {
    const line = `${issue.path.join('.') || 'question'}: ${issue.message}`;
    if (seen.has(line)) continue;
    seen.add(line);
    said.push(line);
  }
  if (said.length === 0) return 'question: the draft did not validate, and Zod said nothing about why';
  const shown = said.slice(0, limit).join(' · ');
  return said.length > limit ? `${shown} · and ${said.length - limit} more` : shown;
}
