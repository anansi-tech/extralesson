import { describe, expect, it, vi } from 'vitest';
import { WELCOME, renderWelcome, visibleText } from './helpers/welcome-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {} }), usePathname: () => '/welcome' }));

// ROUND_9 Task 1: the four welcome states say what the design and the spec
// say — the address masked except to the signed-in owner, no claim that we
// emailed anyone, and the confirming fallback for anything that cannot move.
const text = Object.fromEntries(Object.entries(WELCOME).map(([k, p]) => [k, visibleText(renderWelcome(p))])) as Record<keyof typeof WELCOME, string>;
const HELP = 'Access usually appears within a minute. If it has not after a few minutes, email extralesson@anansi.xyz with the address you paid with and we will sort it out by hand.';

describe('welcome, four states', () => {
  it('A · confirming, then settled after the minute', () => {
    expect(text.confirming).toBe(
      'Confirming your payment One moment . Your card has been charged. We are matching the payment to an account. This page will move on by itself. If it is still here in a minute, your receipt is already in your email — nothing is lost. ' + HELP,
    );
    expect(text.settled).toBe(
      'Confirming your payment One moment . Your card has been charged. We are matching the payment to an account. Your receipt is already in your email — nothing is lost. ' + HELP,
    );
    expect(renderWelcome(WELCOME.confirming)).not.toMatch(/animate|spinner/);
  });

  it('B · signed in as the payer: the address in full, the notebook’s own lead', () => {
    expect(text.payer).toBe(
      'Sign out ✓ You’re in . Full access on kiara@example.com , running to May/June 2027 . Mark one question free ONE REAL QUESTION · NOT ONE OF YOUR SESSIONS Or start with the diagnostic',
    );
    expect(visibleText(renderWelcome({ ...WELCOME.payer, lead: 'session' }))).toContain('Start today’s session 15 MINUTES · WEAKEST TOPICS FIRST');
    expect(visibleText(renderWelcome({ ...WELCOME.payer, lead: 'diagnostic' }))).toContain('Start with a quick diagnostic ABOUT 12 MINUTES');
    expect(renderWelcome({ ...WELCOME.payer, lead: 'resume' })).toMatch(/href="\/study"[^>]*>Carry on with your session/);
  });

  it('C · not yet registered: the address masked, the create door locked to it', () => {
    expect(text.unregistered).toBe(
      '✓ Payment received . The access is waiting on k···@example.com . Create the account on that address and it is applied. Create the account Nothing expires while you do this. The payment stays attached to that address. ' + HELP,
    );
    const html = renderWelcome(WELCOME.unregistered);
    expect(html).toContain('href="/study/login?new=1&amp;paid=cs_test_1"');
    expect(html).not.toContain('kiara@example.com');
  });

  it('D · bought for someone else: masked, no claim of an email sent, no pronouns for the student', () => {
    expect(text.other).toBe(
      'Sign out ✓ Thank you . Access is on k···@example.com , running to May/June 2027 . Whoever sits the exam creates their account with that address, or signs in if they have one. Create an account Sign in ' +
        'How you will know it is working: the student will show you. We do not send reports. The student can open their own marked working — every question, every mark, and the reason for each one — at any time. You will hear how it is going from the student, not from us. ' +
        'Not satisfied? Email extralesson@anansi.xyz within 14 days of paying and we will refund you.',
    );
    expect(text.other).not.toMatch(/\b(her|him|she|he)\b|emailed|Send .* again/);
    expect(visibleText(renderWelcome({ ...WELCOME.other, state: { state: 'other', email: 'x@y.gd', sitting: null } }))).toContain('Access is on x···@y.gd . Whoever');
  });

  it('the create door takes the paid address, locked, from the session and never from the URL', () => {
    const page = readFileSync(join(process.cwd(), 'app', 'study', 'login', 'page.tsx'), 'utf8');
    expect(page).toMatch(/lockedEmail = paid \? await paidAddress\(paid\) : null/);
    expect(page).toMatch(/state\.state === 'unregistered' \? state\.email : null/);
    const form = readFileSync(join(process.cwd(), 'app', 'study', 'login', 'login-form.tsx'), 'utf8');
    expect(form).toMatch(/readOnly=\{!!lockedEmail\}/);
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
