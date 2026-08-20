// What a password must be, with no crypto attached.
//
// Separate from ./password because the sign-in form is a client component and
// needs the minimum length to show it: importing it from the hashing module
// pulled node:crypto into the browser bundle and failed the build. A rule the
// user reads belongs on the client; the key derivation never does.

/**
 * What we require of a password, and nothing more.
 *
 * Length is the only rule that reliably buys strength. Character-class rules
 * push people to Passw0rd! — memorable to a cracker, not to the student — and
 * this is a maths practice account, so the honest bar is "long enough not to be
 * guessed, short enough to type on a phone every day".
 */
export const PASSWORD_MIN = 10;

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > 200) return 'That is too long — 200 characters at most.';
  if (/^\s|\s$/.test(password)) return 'Remove the space at the start or end.';
  return null;
}
