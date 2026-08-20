import { Resend } from 'resend';

// Single source of truth for outbound email — the same shape as cognicare's
// lib/email.js, and the same environment variable names, so moving between the
// two repos does not mean learning two conventions.
//
// Extralesson sends exactly one kind of email: a password-reset link. Signing
// in does not need email at all, which is the point of having replaced the
// magic link, so this is a rare path rather than one on every session.

const FROM = process.env.RESEND_FROM ?? 'ExtraLesson <onboarding@resend.dev>';

export interface SendResult {
  /** True when no provider is configured, so the caller can fall back. */
  skipped: boolean;
  /**
   * The provider's id for this message, when there is one.
   *
   * It was discarded, which left no way to connect "I never got the email" to
   * a record of what happened to it — and that is the whole of the diagnosis:
   * accepted-and-filed and never-accepted are different problems with different
   * fixes, and only the provider knows which happened.
   */
  id?: string;
}

/**
 * Send, or report honestly that we could not.
 *
 * With no key configured this does NOT pretend to succeed. The caller prints
 * the link to the server log instead, which is how this worked before a
 * provider existed and is what keeps local development possible — but the
 * distinction is returned rather than swallowed, because "sent" and "logged
 * where only an operator can see it" are different facts about a student's
 * ability to get back into their account.
 */
export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { skipped: true };

  const { data, error } = await new Resend(key).emails.send({
    from: FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  if (error) throw new Error(error.message || 'email send failed');
  return { skipped: false, id: data?.id };
}

/**
 * The reset email.
 *
 * Written to read as correspondence, because a classifier reads it before a
 * person does. The previous version delivered to Outlook and vanished at Gmail
 * while Resend reported it delivered, on a domain that authenticates correctly
 * and delivers for another product — so the body was what was being judged.
 *
 * What changed, and why each part matters:
 *
 *   The link's text is a phrase, never the URL. An anchor whose visible text is
 *   a 242-character URL is the shape of a phishing mail, and it was printed
 *   twice — once as the href, once as the text.
 *
 *   The full URL appears only in the plain-text part, alone on its line with
 *   blank lines around it. Running a token into the next sentence leaves mail
 *   clients to guess where the link ends, and they guess wrong.
 *
 *   There is a greeting and a sign-off with a name. A message that is only an
 *   instruction and a token has nothing in it that a person wrote.
 */
export function resetEmail(link: string, minutes: number): { subject: string; html: string; text: string } {
  const subject = 'Set a new ExtraLesson password';
  const text = `Hi,

Someone asked to set a new password for your ExtraLesson account. If it was you, open this link:

${link}

The link works once and expires in ${minutes} minutes.

If it wasn't you, you can ignore this email — nothing has changed and your current password still works.

— ExtraLesson
CSEC Mathematics practice`;
  const html = `<p>Hi,</p>
<p>Someone asked to set a new password for your ExtraLesson account. If it was you:</p>
<p><a href="${link}">Set a new password</a></p>
<p>The link works once and expires in ${minutes} minutes.</p>
<p>If it wasn't you, you can ignore this email — nothing has changed and your current password still works.</p>
<p>— ExtraLesson<br>CSEC Mathematics practice</p>`;
  return { subject, html, text };
}
