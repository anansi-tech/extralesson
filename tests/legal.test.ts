import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IMAGE_TTL_DAYS } from '@/lib/db/transcription';
import { REFUND_DAYS } from '@/lib/access';
import { SITTINGS } from '@/lib/sittings';
import { LANDING as LANDING_CONTENT } from '@/lib/landing-content';

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

// A SITTING IS NEVER TYPED INTO COPY.
//
// The page promised "full access through the January sitting" two lines from a
// note listing both sittings — and once expiry shipped that was not merely
// narrow, it was wrong: access runs to the sitting the STUDENT registered for,
// so a May/June buyer was told a duration they do not get.
describe('sittings are derived, not named', () => {
  const strip = (src: string) => src.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '');
  const LANDING = strip(read('app', 'page.tsx'));
  const CONTENT = read('lib', 'landing-content.ts');

  it('promises the sitting the buyer chooses, not a hardcoded one', () => {
    expect(LANDING).not.toMatch(/through the January sitting/i);
    expect(LANDING).toMatch(/through the sitting you choose/i);
  });

  it('builds the sitting note from the same record the paywall reads', () => {
    expect(CONTENT).toContain('SITTINGS');
    expect(CONTENT).not.toMatch(/'JANUARY[^']*MAY\/JUNE/);
    expect(LANDING_CONTENT.sittingNote).toContain('MAY/JUNE 2027');
    for (const s of Object.values(SITTINGS)) {
      expect(LANDING_CONTENT.sittingNote).toContain(s.label.toUpperCase());
    }
  });

  it('keeps January only where it names a real audience, not a duration', () => {
    // The re-sit FAQ is allowed to say January: it answers a question that
    // subgroup actually has. What is gone is the claim about how long access
    // lasts, and the run-up-length claim that was only true for them.
    expect(LANDING).toMatch(/re-sitting in January/);
    expect(LANDING).not.toMatch(/ten focused weeks/i);
  });

  it('does not sell a run-up length, which depends on the sitting', () => {
    expect(LANDING).not.toMatch(/\b(ten|eight|twelve|10|12) (focused )?weeks\b/i);
  });
});

// THE CREDENTIAL IS THE SUBJECT, NOT THE BUILDING.
//
// "Former high school teacher" was true and vague. What matters to a buyer is
// that it is the SAME subject, syllabus and exam: CSEC Mathematics. The subject
// names the level on its own — and it does so in every territory, which a year
// group does not: some say forms, others say grades.
describe('the founder credential', () => {
  const LANDING = read('app', 'page.tsx');

  it('names the subject taught', () => {
    expect(LANDING.replace(/\s+/g, ' ')).toMatch(/taught <b>CSEC Mathematics<\/b> for two years/);
    expect(LANDING).toMatch(/TAUGHT CSEC MATHEMATICS · ISLAND SCHOLAR/);
  });

  it('names no year group, which is said differently across the region', () => {
    expect(LANDING).not.toMatch(/Forms? \d/i);
    expect(LANDING).not.toMatch(/FORMS 3/);
  });

  it('claims to be an island scholar, never the island scholar', () => {
    // There were several that year. The indefinite article is the whole of the
    // difference between a credential and a claim of singularity.
    expect(LANDING).not.toMatch(/the island scholar/i);
    expect(LANDING.replace(/\s+/g, ' ')).toMatch(/an island scholar/);
  });

  it('is gone in its vague form', () => {
    expect(LANDING.replace(/\s+/g, ' ')).not.toMatch(/high[- ]school teacher/i);
  });

  it('does not claim we hand out past papers, which we do not', () => {
    // The founder taught WITH past papers; the product is original questions.
    // The FAQ says so, and the founder paragraph must not undercut it.
    const flat = LANDING.replace(/\s+/g, ' ');
    expect(flat).toMatch(/CXC&rsquo;s papers are their copyright/);
    expect(flat).not.toMatch(/the same past papers/i);
  });
});

// NO DECORATIVE CLAIMS (CLAUDE.md).
//
// "My own family in Grenada tested it first" was not true. The rule it produced
// is that no claim about people, testing, usage or results goes on a public
// page unless it can be shown — and that a claim needing a footnote gets cut
// rather than softened. This page's persuasive strength is that its limits are
// stated plainly; one invented detail makes a reader right to reread the honest
// ones as marketing.
describe('public claims are ones we can show', () => {
  const LANDING = read('app', 'page.tsx').replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '');

  it('makes no claim about who has tested or used it', () => {
    const flat = LANDING.replace(/\s+/g, ' ');
    expect(flat).not.toMatch(/tested it first/i);
    expect(flat).not.toMatch(/my own family/i);
    expect(flat).not.toMatch(/\b(hundreds|thousands) of (students|families)/i);
    expect(flat).not.toMatch(/used by \d/i);
  });

  it('claims no result it has not produced', () => {
    expect(LANDING).not.toMatch(/\bproven\b/i);
    expect(LANDING).not.toMatch(/\bguarantee[sd]?\b/i);
    // The hero said the feedback "turns a Grade IV into a Grade II". No student
    // has sat an exam after using this, so there was nothing behind it. What it
    // says now is what the product demonstrably does.
    expect(LANDING).not.toMatch(/turns a Grade/i);
    expect(LANDING.replace(/\s+/g, ' ')).toMatch(/the exact feedback an examiner would write/i);
  });

  it('keeps the limits, which are what make the rest believable', () => {
    const flat = LANDING.replace(/\s+/g, ' ');
    expect(flat).toMatch(/we do not cover at all/i);
    expect(flat).toMatch(/not affiliated|CXC&rsquo;s papers are their copyright/i);
    expect(flat).toMatch(/We do not send reports/i);
  });
});

// EVERY STATISTIC ON THE PAGE NAMES ITS SOURCE IN THE LABEL.
//
// The page carried "56% of Caribbean students miss the 5-subject benchmark",
// which nobody could source, beside a mean mark labelled with the wrong year.
// A number is a claim like any other: if it needs a footnote to defend, the
// footnote goes in the label or the number goes.
describe('landing statistics', () => {
  const stats = [
    [LANDING_CONTENT.statAvgScore, LANDING_CONTENT.statAvgScoreLabel],
    [LANDING_CONTENT.statBenchmark, LANDING_CONTENT.statBenchmarkLabel],
    [LANDING_CONTENT.statWorking, LANDING_CONTENT.statWorkingLabel],
  ] as const;

  it('states each as a percentage', () => {
    for (const [n] of stats) expect(n).toMatch(/^\d+%$/);
  });

  it('cites a source and a date in every label of an external figure', () => {
    // The third is measured from our own bank and says so; the two CXC figures
    // must name CXC and a sitting or a date.
    for (const [, label] of stats.slice(0, 2)) {
      expect(label).toMatch(/CXC/);
      expect(label).toMatch(/20\d\d/);
    }
    expect(LANDING_CONTENT.statWorkingLabel).toMatch(/our mark schemes/i);
  });

  it('does not call the mean mark a pass rate, or the pass rate a score', () => {
    expect(LANDING_CONTENT.statAvgScoreLabel).toMatch(/mean mark/i);
    expect(LANDING_CONTENT.statAvgScoreLabel).not.toMatch(/pass/i);
    expect(LANDING_CONTENT.statBenchmarkLabel).toMatch(/passed/i);
    expect(LANDING_CONTENT.statBenchmarkLabel).toMatch(/Grades I–III/);
  });

  it('has dropped the unsourceable benchmark figure', () => {
    for (const [, label] of stats) expect(label).not.toMatch(/5-subject benchmark/i);
    expect(LANDING_CONTENT.statBenchmark).not.toBe('56%');
  });
});

// THE PRICE AND THE CAP LIVE IN ONE PLACE.
//
// When the hundred places fill the page must switch to $45 in one push, and
// there is no automatic path — reading the remaining count needs the Stripe API
// call the kill list forbids. So the switch has to be a constant change rather
// than a hunt, and a number typed onto a surface is what turns it back into a
// hunt.
describe('price and cap are stated only through LANDING', () => {
  const strip = (src: string) => src.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '');
  const LANDING_PAGE = strip(read('app', 'page.tsx'));

  it('states the price nowhere by hand', () => {
    expect(LANDING_PAGE).not.toMatch(/\$\d+/);
    expect(LANDING_PAGE).toContain('LANDING.price');
  });

  it('states the cap nowhere by hand, in digits or in words', () => {
    expect(LANDING_PAGE).not.toMatch(/\bhundred\b/i);
    expect(LANDING_PAGE).not.toMatch(/\b100\b/);
    expect(LANDING_PAGE).toContain('LANDING.places');
  });

  it('names the offer through the constant, so it is one change and not four', () => {
    expect(LANDING_PAGE).not.toMatch(/Founding Famil/);
    expect(LANDING_PAGE).toMatch(/LANDING\.offer(Name|Member)/);
  });

  it('keeps price and cap off every other surface', () => {
    for (const f of [
      ['app', 'welcome', 'page.tsx'],
      ['app', 'terms', 'page.tsx'],
      ['app', 'privacy', 'page.tsx'],
      ['app', 'study', 'page.tsx'],
      ['app', 'layout.tsx'],
      ['lib', 'email.ts'],
    ]) {
      const src = strip(read(...f));
      expect(src, f.join('/')).not.toMatch(/\$\d+|Founding Famil/);
    }
  });
});
