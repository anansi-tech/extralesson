import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AUTH, renderAuth, visibleText } from './helpers/auth-states';

// ROUND_9 Task 3: the auth screens on the door say what the page and the form
// say — passwords, not magic links; errors above the field they concern; the
// rate-limited window read from the limit table; the reset-sent screen naming
// the sender.
const text = Object.fromEntries(Object.keys(AUTH).map((k) => [k, visibleText(renderAuth(k))]));

const SIGN_IN = 'Sign in . Your email and a password. We keep you signed in for 30 days, so on your own phone this is usually the last time you type it. ';
const CREATE_FIELDS = 'Choose a password At least 10 characters. Length is what makes a password hard to guess — a short phrase you will remember beats a short word with symbols in it. Your name Which sitting are you entered for May/June 2027 January 2027 re-sit Create account I already have an account — sign in By creating an account you agree to our terms and privacy page .';

describe('the auth screens', () => {
  it('sign in: email and password, the two quiet routes', () => {
    expect(text['sign-in']).toBe(SIGN_IN + 'Your email address Your password Sign in New here? Create an account Forgot your password?');
    expect(renderAuth('sign-in')).toMatch(/href="\/study\/login\?reset=1"[^>]*>Forgot your password\?/);
  });
  it('create account from the free button: the question named above the form', () => {
    expect(text.create).toBe(
      'Create your account . Your first question is waiting: one Paper 2 question, marked the way an examiner marks it, free. Make an account and it is the first thing you see. Your email address ' + CREATE_FIELDS,
    );
  });
  it('create account from the welcome page: the paid address masked above, locked in the field', () => {
    expect(text['create-locked']).toBe(
      'Create your account . The access is waiting on k···@example.com . Create the account on that address and it is applied. Your email address kiara@example.com ' + CREATE_FIELDS,
    );
    expect(renderAuth('create-locked')).toMatch(/<input[^>]*readOnly=""[^>]*name="email" value="kiara@example.com"\/>/);
  });
  it('error: one plain sentence above the field it concerns', () => {
    expect(text.error).toBe(SIGN_IN + 'Your email address That email and password do not match. kiara@exampl.com Your password Sign in New here? Create an account Forgot your password?');
    const html = renderAuth('error');
    expect(html.indexOf('That email and password do not match.')).toBeLessThan(html.indexOf('name="email"'));
  });
  it('rate-limited: the real window from the limit table, the button waiting', () => {
    expect(text['rate-limited']).toBe(SIGN_IN + 'Too many attempts. You can ask again in 1 minute. Your email address kiara@example.com Your password Sign in Available in 1 minute New here? Create an account Forgot your password?');
    expect(text['reset-limited']).toBe('Forgot your password ? Too many attempts. You can ask again in 3 minutes. Your email address kiara@example.com Send me a link Available in 3 minutes Back to sign in');
    expect(renderAuth('rate-limited')).toMatch(/<button type="submit" disabled=""/);
  });
  it('reset: email, then check your email with the sender named', () => {
    expect(text.reset).toBe('Forgot your password ? Your email address Send me a link Back to sign in');
    expect(text['reset-sent']).toBe(
      '✓ Check your email . If there is an account for that email, a link to set a new password is on its way. It works once and expires in 30 minutes. Nothing in your inbox after a minute or two? Look in spam. The sender is ExtraLesson <hello@extralesson.app>. Back to sign in',
    );
    const page = readFileSync(join(process.cwd(), 'app', 'study', 'login', 'page.tsx'), 'utf8');
    expect(page).toMatch(/sender=\{SENDER\} resetMinutes=\{RESET_TTL_MS \/ 60000\}/);
  });
  it('new password: one field, the error above it', () => {
    expect(text['new-password']).toBe('Set a new password . New password At least 10 characters. Save and sign in');
    expect(text['new-password-error']).toBe('Set a new password . New password That link has expired. Ask for a new one. At least 10 characters. Save and sign in');
  });
  it('builds no magic link', () => {
    for (const k of Object.keys(AUTH)) expect(text[k]).not.toMatch(/Email me a link|no password to remember/);
  });
});
