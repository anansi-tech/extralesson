// Makes an operator: the account if missing, and a set-password link carrying
// the admin role, granted when the link is claimed. The address must be in
// ADMIN_EMAILS. Run: pnpm admin:provision -- --email you@example.com
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { provisionAdmin } from '@/lib/auth/provision';
import { resetEmail, sendEmail } from '@/lib/email';
import { externalBaseUrl } from '@/lib/base-url';
import { RESET_TTL_MS } from '@/lib/auth/token';

async function main() {
  const at = process.argv.indexOf('--email');
  const email = at >= 0 ? process.argv[at + 1] : undefined;
  if (!email) throw new Error('usage: pnpm admin:provision -- --email you@example.com');
  await dbConnect();
  const { secret, created } = await provisionAdmin(email);
  const link = `${externalBaseUrl()}/study/reset?token=${secret}`;
  const { skipped, id } = await sendEmail({ to: email.toLowerCase(), ...resetEmail(link, RESET_TTL_MS / 60000) });
  console.log(`${created ? 'created' : 'existing'} account ${email.toLowerCase()}; admin on claiming the link`);
  if (id) console.log(`link sent, message ${id}`);
  // Without a provider the link has to reach a person somehow; with one it must not be printed.
  if (skipped) console.log(`no email provider configured — open this yourself: ${link}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
