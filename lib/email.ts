import { Resend } from 'resend';

// Same shape and environment variable names as cognicare's lib/email.js, so
// moving between the two repos does not mean learning two conventions.
// ExtraLesson sends exactly one kind of email: a password-reset link.

const FROM = process.env.RESEND_FROM ?? 'ExtraLesson <onboarding@resend.dev>';
/** The sender a reset-sent screen names, so a student knows what to look for in spam. */
export const SENDER = FROM;

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

export interface Email {
  subject: string;
  html: string;
  text: string;
}

const FOOTER_LINES = ['An Anansi Technology product · Miami, Florida', 'ExtraLesson is not affiliated with or endorsed by the Caribbean Examinations Council'];

/**
 * ONE LAYOUT FOR EVERY EMAIL (ROUND_9 Task 7; Auth and Welcome.dc.html §08):
 * the lockup, one sentence, one button, the plain-text alternative kept. A
 * 600px table on the paper colour — email clients cannot be trusted with the
 * rules. A classifier judges this body before a person reads it, so: the
 * link's visible text is a phrase and never the URL, the full URL appears
 * only in the plain-text part alone on its line, and there is a greeting
 * and a sign-off.
 */
export function emailLayout(args: {
  subject: string;
  sentence: string;
  button: { label: string; url: string };
  /** One line under the button, where a sentence is not enough. */
  note?: string;
  /** Where the lockup is served from; the image is fetched by the reader's client. */
  baseUrl: string;
}): Email {
  const { subject, sentence, button, note, baseUrl } = args;
  const text = `Hi,

${sentence}

${button.url}

${note ? `${note}\n\n` : ''}— ExtraLesson
CSEC Mathematics practice

${FOOTER_LINES.join('\n')}`;
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8e6e1;padding:32px 16px;font-family:Fraunces,Georgia,serif;color:#1e2430;line-height:1.55">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fbf7ee;border:1.5px solid #1e2430">
<tr><td style="padding:32px">
<img src="${baseUrl}/brand/lockup-2x.png" width="150" height="39" alt="ExtraLesson" style="display:block;width:150px;height:auto">
<p style="margin:28px 0 0;font-size:16px">Hi,</p>
<p style="margin:12px 0 0;font-size:18px;line-height:1.5">${sentence}</p>
<p style="margin:24px 0 0"><a href="${button.url}" style="display:inline-block;background:#c1121f;color:#ffffff;font-weight:900;font-size:17px;padding:16px 28px;text-decoration:none">${button.label}</a></p>
${note ? `<p style="margin:24px 0 0;font-size:14px;color:#3a4152">${note}</p>` : ''}
<p style="margin:24px 0 0;font-size:14px">— ExtraLesson<br>CSEC Mathematics practice</p>
<p style="margin:28px 0 0;border-top:1px solid #e4b8b4;padding-top:14px;font-family:'IBM Plex Mono',Menlo,monospace;font-size:10.5px;color:#6e7687;line-height:1.9">${FOOTER_LINES.join('<br>')}</p>
</td></tr></table>
</td></tr></table>`;
  return { subject, html, text };
}

/** After a payment has found its account: the access, and where to open it. */
export function accessEmail(args: { sitting: string; baseUrl: string }): Email {
  return emailLayout({
    subject: 'Your ExtraLesson access is ready',
    sentence: `Your access is ready, and it runs to your ${args.sitting} sitting.`,
    button: { label: 'Open ExtraLesson', url: `${args.baseUrl}/study` },
    baseUrl: args.baseUrl,
  });
}

export function resetEmail(link: string, minutes: number, baseUrl = link.slice(0, link.indexOf('/study/'))): Email {
  return emailLayout({
    subject: 'Set a new ExtraLesson password',
    sentence: `Someone asked to set a new password for your ExtraLesson account. If it was you, the link below works once and expires in ${minutes} minutes.`,
    button: { label: 'Set a new password', url: link },
    note: "If it wasn't you, you can ignore this email — nothing has changed and your current password still works.",
    baseUrl,
  });
}

/** An operator's set-password link, which carries the role until it is claimed. */
export function provisionEmail(link: string, minutes: number, baseUrl = link.slice(0, link.indexOf('/study/'))): Email {
  return emailLayout({
    subject: 'Your ExtraLesson operator account',
    sentence: `Set a password to claim your operator account. The link works once and expires in ${minutes} minutes.`,
    button: { label: 'Set your password', url: link },
    baseUrl,
  });
}
