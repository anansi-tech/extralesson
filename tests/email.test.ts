import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { accessEmail, provisionEmail, resetEmail, SENDER } from '@/lib/email';

// ROUND_9 Task 7: one layout — the lockup, one sentence, one button — for
// every email the app sends, with the plain-text alternative kept.
const BASE = 'https://extralesson.app';
const LINK = `${BASE}/study/reset?token=abc`;
const EMAILS = {
  access: accessEmail({ sitting: 'May/June 2027', baseUrl: BASE }),
  reset: resetEmail(LINK, 30),
  provision: provisionEmail(LINK, 30),
};

describe('the one email layout', () => {
  it('access granted: the sitting in the sentence, the notebook as the button', () => {
    const e = EMAILS.access;
    expect(e.subject).toBe('Your ExtraLesson access is ready');
    expect(e.text).toContain('Your access is ready, and it runs to your May/June 2027 sitting.');
    expect(e.html).toMatch(/<a href="https:\/\/extralesson\.app\/study"[^>]*>Open ExtraLesson<\/a>/);
    expect(e.text).toContain(`\n\n${BASE}/study\n\n`);
  });
  it('password reset: the link, the expiry, the way to ignore it', () => {
    const e = EMAILS.reset;
    expect(e.text).toContain('Someone asked to set a new password for your ExtraLesson account. If it was you, the link below works once and expires in 30 minutes.');
    expect(e.html).toMatch(/<a href="https:\/\/extralesson\.app\/study\/reset\?token=abc"[^>]*>Set a new password<\/a>/);
    expect(e.text).toContain("nothing has changed");
  });
  it('operator provisioning: the claim, the same layout', () => {
    const e = EMAILS.provision;
    expect(e.subject).toBe('Your ExtraLesson operator account');
    expect(e.text).toContain('Set a password to claim your operator account. The link works once and expires in 30 minutes.');
    expect(e.html).toMatch(/<a href="https:\/\/extralesson\.app\/study\/reset\?token=abc"[^>]*>Set your password<\/a>/);
  });
  it('every one: lockup, one sentence, one button, greeting and sign-off, the footer lines, the URL only in the text', () => {
    for (const [k, e] of Object.entries(EMAILS)) {
      expect(e.html, k).toContain(`<img src="${BASE}/brand/lockup-2x.png"`);
      expect((e.html.match(/<a /g) ?? []).length, `${k} buttons`).toBe(1);
      expect(e.html.replace(/(href|src)="[^"]*"/g, ''), k).not.toContain('http');
      expect(e.html, k).toContain('>Hi,</p>');
      expect(e.html, k).toContain('— ExtraLesson');
      expect(e.text.startsWith('Hi,'), k).toBe(true);
      expect(e.text, k).toContain('An Anansi Technology product · Plantation, Florida');
      expect(e.text, k).toContain('not affiliated with or endorsed by the Caribbean Examinations Council');
    }
  });
  it('is sent from RESEND_FROM, by the provisioning script and the grant', () => {
    expect(SENDER).toBeTruthy();
    expect(readFileSync(join(process.cwd(), 'lib', 'email.ts'), 'utf8')).toMatch(/from: FROM/);
    expect(readFileSync(join(process.cwd(), 'scripts', 'provision-admin.ts'), 'utf8')).toContain('provisionEmail(link');
    expect(readFileSync(join(process.cwd(), 'lib', 'grant-from-payment.ts'), 'utf8')).toMatch(/accessEmail\(\{ sitting: sittingLabel\(sitting\)/);
  });
});
