import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IMAGE_TTL_DAYS } from '@/lib/db/transcription';
import { REFUND_DAYS } from '@/lib/access';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const PRIVACY = read('app', 'privacy', 'page.tsx');
const TERMS = read('app', 'terms', 'page.tsx');

// A PAGE THAT STATES FACTS ABOUT THE SYSTEM MUST READ THEM FROM THE SYSTEM.
//
// The failure mode is not a lie, it is drift: a number typed into a policy is
// true the day it is written and quietly false the day the constant changes.
describe('the privacy page states what the code does', () => {
  it('reads the image retention period from the schema rather than typing it', () => {
    expect(PRIVACY).toContain('IMAGE_TTL_DAYS');
    expect(PRIVACY.replace(/\s+/g, ' ')).not.toMatch(/deleted (automatically )?after 7 days/i);
    expect(IMAGE_TTL_DAYS).toBe(7);
  });

  it('names every third party that receives anything', () => {
    // lib/ai.ts and lib/email.ts are the only two outbound destinations.
    for (const party of ['OpenAI', 'Resend', 'Stripe', 'Vercel', 'MongoDB Atlas']) {
      expect(PRIVACY, party).toContain(party);
    }
  });

  it('says photographs are sent to be read, not only that we do not train on them', () => {
    // "We do not train models" is true and would be misleading alone: the
    // photograph does leave the building to be read.
    expect(PRIVACY.replace(/\s+/g, ' ')).toMatch(/sent to our AI provider/i);
  });

  it('does not claim a deletion feature that does not exist', () => {
    expect(PRIVACY.replace(/\s+/g, ' ')).toMatch(/no button for this yet/i);
  });
});

describe('the terms state what the product does', () => {
  it('reads the free tier and the coverage figures from the same source the app does', () => {
    expect(TERMS).toContain('FREE_SESSIONS');
    expect(TERMS).toContain('landingCoverage');
    expect(TERMS).not.toMatch(/about 90%/);
  });

  it('says plainly that we are not CXC', () => {
    expect(TERMS.replace(/\s+/g, ' ')).toMatch(/not affiliated with, endorsed by, or connected to/i);
  });

  it('describes marking as it behaves: conservative, and correctable', () => {
    expect(TERMS.replace(/\s+/g, ' ')).toMatch(/withholds the mark rather than awarding it/i);
  });

  it('promises the expiry the code now enforces, and reads the grace from it', () => {
    // This used to assert the OPPOSITE: hasAccess() checked only that a sitting
    // had been granted, so terms saying access ran out would have been a claim
    // the product did not keep. The behaviour came first, then the sentence.
    expect(TERMS.replace(/\s+/g, ' ')).toMatch(/until that sitting is over/i);
    expect(TERMS).toContain('GRACE_DAYS');
    expect(TERMS).not.toMatch(/plus 30 days/i);
  });
});

// THE LANDING PAGE MUST NOT SELL WHAT THE PRODUCT DOES NOT DO.
//
// It advertised a weekly parent report in three places, including a line in the
// features list beside the price. The only email this app can send is a
// password reset, and parent reports are on the kill list — so the page was
// promising a feature that was not merely unbuilt but banned. Honest coverage
// claims are the thing the rest of that page rests on.
describe('the landing page promises only what exists', () => {
  const LANDING = read('app', 'page.tsx');

  it('does not advertise a weekly or Sunday report', () => {
    expect(LANDING).not.toMatch(/sunday/i);
    expect(LANDING).not.toMatch(/weekly .{0,20}report/i);
    expect(LANDING).not.toMatch(/parent report/i);
    expect(LANDING).not.toMatch(/report card/i);
  });

  it('still states the coverage limits, which are the claims that are true', () => {
    expect(LANDING).toContain('coverage.displayPercent');
    expect(LANDING).toMatch(/Paper 032/);
  });
});

// WHO EACH SURFACE IS ADDRESSED TO (ROUND_2_EXAMINER §8e).
//
// Not a style rule. The offer asks for money and an email address, so a wrong
// guess about the reader produced a real defect there: the caption used to say
// to sign up with the address used at checkout, which is wrong whenever the
// payer and the student are different people — and they usually are. The hero
// asks only for attention, where the same assumption costs a moment.
describe('buyer-facing surfaces address whoever is paying', () => {
  const LANDING = read('app', 'page.tsx');
  // From the offer through the end of the FAQ: everything that asks the reader
  // to act on who they are.
  // Comments stripped: the rules are about what a reader sees, and a comment
  // explaining WHY the copy avoids assuming a sponsor is not the copy doing it.
  const buyerFacing = LANDING.slice(LANDING.indexOf('<section id="offer">')).replace(
    /\{\/\*[\s\S]*?\*\/\}/g,
    '',
  );

  it('assumes no relationship to the student in the offer or the FAQ', () => {
    for (const assumed of [/your child/i, /my child/i, /questions parents ask/i, /parent/i]) {
      expect(buyerFacing, String(assumed)).not.toMatch(assumed);
    }
  });

  it('assumes no geography either — the offer stopped addressing relatives abroad', () => {
    for (const assumed of [/abroad/i, /brooklyn/i, /toronto/i, /back home/i, /sponsor a/i]) {
      expect(buyerFacing, String(assumed)).not.toMatch(assumed);
    }
  });

  it('tells the buyer the checkout email is the STUDENT\'s, not theirs', () => {
    // The defect this replaced: "sign up with the same email you used at
    // checkout" put the account under the payer when they differ.
    expect(buyerFacing.replace(/\s+/g, ' ')).toMatch(/STUDENT&rsquo;S EMAIL ADDRESS, WHICH NEED NOT BE YOURS/);
    expect(buyerFacing).not.toMatch(/SAME EMAIL ADDRESS YOU USED AT CHECKOUT/i);
  });

  it('keeps the three checkable claims and the reporting refusal', () => {
    const flat = buyerFacing.replace(/\s+/g, ' ');
    expect(flat).toMatch(/access running to the sitting/i);
    expect(flat).toMatch(/own marked working/i);
    expect(flat).toMatch(/from them, not from us/i);
  });

  it('leaves the hero and the shared-link metadata alone, on purpose', () => {
    const hero = LANDING.slice(0, LANDING.indexOf('<section id="offer">'));
    expect(hero).toMatch(/Your child/);
  });
});

// THE OFFER AND THE TERMS MUST STATE THE SAME REFUND WINDOW.
//
// They did not: the page said "full refund at launch" while the terms said 14
// days from paying — a promise and its own small print disagreeing in public.
// Both read the constant now, so the only way to change one is to change both.
describe('refund window', () => {
  // Comments stripped: a comment recording what the copy USED to say is not the
  // copy saying it. Third time this has bitten — the rules are about what a
  // reader sees.
  const strip = (src: string) => src.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '');
  const LANDING = strip(read('app', 'page.tsx'));
  const TERMS_SRC = strip(read('app', 'terms', 'page.tsx'));

  it('is read from one constant by both pages', () => {
    expect(LANDING).toContain('REFUND_DAYS');
    expect(TERMS_SRC).toContain('REFUND_DAYS');
    expect(REFUND_DAYS).toBeGreaterThan(0);
  });

  it('is never typed as a literal beside the word refund', () => {
    for (const src of [LANDING, TERMS_SRC]) {
      expect(src.replace(/\s+/g, ' ')).not.toMatch(/\b14 days\b/);
    }
  });

  it('no longer promises a refund tied to launching', () => {
    expect(LANDING).not.toMatch(/refund at launch/i);
  });
});

// NO DATE-BASED URGENCY.
//
// "Launches November 1" anchored the page to the January re-sit, which is not
// the sitting most students take — and a dated claim expires into a lie. The
// scarcity that is real is the Founding Families cap, which is enforced where
// the money is taken rather than asserted in copy.
describe('urgency', () => {
  const LANDING = read('app', 'page.tsx');
  const CONTENT = read('lib', 'landing-content.ts');
  const visible = LANDING.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  it('states no launch date', () => {
    expect(visible).not.toMatch(/LAUNCHES/);
    expect(CONTENT).not.toMatch(/launchDate/);
  });

  it('keeps the cap, which is the scarcity that is real', () => {
    expect(visible).toContain('LANDING.places');
  });
});
