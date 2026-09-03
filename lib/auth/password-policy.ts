// Separate from ./password because the sign-in form is a client component and
// needs the minimum length: importing it from the hashing module pulls
// node:crypto into the browser bundle. A rule the user reads belongs on the
// client; the key derivation never does.

/**
 * Length is the only rule that reliably buys strength. Character-class rules
 * push people to Passw0rd! — memorable to a cracker, not to the student — so
 * the bar is long enough not to be guessed, short enough to type every day.
 */
export const PASSWORD_MIN = 10;

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > 200) return 'That is too long — 200 characters at most.';
  if (/^\s|\s$/.test(password)) return 'Remove the space at the start or end.';
  return null;
}
