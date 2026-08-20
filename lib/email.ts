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

  const { error } = await new Resend(key).emails.send({
    from: FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  if (error) throw new Error(error.message || 'email send failed');
  return { skipped: false };
}

/**
 * The reset email. Plain, short, and honest about the expiry — a student on a
 * phone reads the first line and nothing else.
 */
export function resetEmail(link: string, minutes: number): { subject: string; html: string; text: string } {
  const subject = 'Set a new ExtraLesson password';
  const text = `Open this link to set a new password: ${link}

It works once and expires in ${minutes} minutes. If you did not ask for it, you can ignore this — your password has not changed.`;
  const html = `<p>Open this link to set a new password:</p>
<p><a href="${link}">${link}</a></p>
<p>It works once and expires in ${minutes} minutes. If you did not ask for it, you can ignore this — your password has not changed.</p>`;
  return { subject, html, text };
}
