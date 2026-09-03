// Some model responses double-escape newlines. Convert those to real newlines
// only when NOT followed by a lowercase letter, so KaTeX commands starting with
// a backslash-n (\neq, \nabla, \nu, ...) are never mangled: command names are
// lowercase, while a paragraph break is followed by a capital, '$', a digit or
// end-of-string.
export function normalizeEscapedNewlines(s: string): string {
  return s.replace(/\\n(?![a-z])/g, '\n');
}
