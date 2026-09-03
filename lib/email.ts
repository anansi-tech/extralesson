import { Resend } from 'resend';

// Same shape and environment variable names as cognicare's lib/email.js, so
// moving between the two repos does not mean learning two conventions.
// ExtraLesson sends exactly one kind of email: a password-reset link.

const FROM = process.env.RESEND_FROM ?? 'ExtraLesson <onboarding@resend.dev>';

export interface SendResult {
  /** True when no provider is configured, so the caller can fall back. */
  skipped: boolean;
  /**
   * The provider's id, kept because accepted-and-filed and never-accepted are
   * different problems with different fixes, and only the provider knows which
   * happened to a message a student says never arrived.
   */
  id?: string;
}

/**
 * With no key configured this does NOT pretend to succeed. "Sent" and "logged
 * where only an operator can see it" are different facts about a student's
 * ability to get back into their account, so the caller is told which happened.
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
 * A classifier judges this body before a person reads it, so: the link's
 * visible text is a phrase and never the URL, the full URL appears only in the
 * plain-text part alone on its line, and there is a greeting and a sign-off.
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
