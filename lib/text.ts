// Text normalization for model-generated content.
//
// Some model responses double-escape newlines: the stored string contains the
// two-character sequence backslash+n instead of a real newline. Convert those
// to real newlines — but ONLY when not followed by a lowercase letter, so
// KaTeX commands that start with \n (\neq, \ne, \nabla, \nu, \notin, \nmid,
// \newline, ...) are never mangled. KaTeX command names are lowercase, while a
// paragraph break is followed by a capital, '$', a digit, another \n, or
// end-of-string — which is exactly what the observed data shows.
export function normalizeEscapedNewlines(s: string): string {
  return s.replace(/\\n(?![a-z])/g, '\n');
}
