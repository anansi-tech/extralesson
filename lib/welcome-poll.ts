/**
 * THE POLL'S NUMBERS, AND NOTHING ELSE. These live apart from lib/welcome.ts
 * because the confirming note is a client component and imports them: that file
 * also imports the database, and one import of a constant carried every Mongoose
 * model into the browser bundle, where `models` is undefined. The page rendered
 * correctly and then died three seconds later on the first poll, reading
 * `Topic` off undefined.
 *
 * Anything a client component needs belongs in a module like this one — no
 * database, nothing that reaches one. tests/client-boundary.test.ts walks the
 * import graph and refuses the next one.
 */

/** The confirming page asks again every three seconds, for a minute. */
export const POLL_EVERY_MS = 3000;
export const POLL_FOR_MS = 60_000;

export function pollDue(startedAt: number, now: number): boolean {
  return now - startedAt < POLL_FOR_MS;
}
