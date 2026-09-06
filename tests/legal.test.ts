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
    expect(buyerFacing.replace(/\s+/g, ' ')).toMatch(/student&rsquo;s email address, which need not be yours/);
    expect(buyerFacing).not.toMatch(/SAME EMAIL ADDRESS YOU USED AT CHECKOUT/i);
  });

  it('keeps the three checkable claims and the reporting refusal', () => {
    const flat = buyerFacing.replace(/\s+/g, ' ');
    expect(flat).toMatch(/access running to the sitting/i);
    expect(flat).toMatch(/own marked working/i);
    expect(flat).toMatch(/from them, not from us/i);
  });

  // THE HERO ASSUMES NOTHING ABOUT WHO OPENED THE LINK.
  //
  // It used to say "Your child's own CXC examiner" on the reasoning that a
  // parent is the most likely first reader. The pick was defensible; the
  // premise was not. A link travels, and the page is opened by students,
  // parents and teachers with no way to tell which — so a hero addressed to
  // one of them tells the other two the product is for somebody else.
  //
  // "Your own" is read correctly by all three: a student is addressed, a
  // parent understands it is for their child, a teacher thinks of their class.
  it('addresses the reader directly in the hero and the shared-link metadata', () => {
    const hero = LANDING.slice(0, LANDING.indexOf('<section id="offer">'));
    // "the way you'll sit it" is read correctly by a student, a parent and a teacher alike.
    expect(hero).toMatch(/the way you&rsquo;ll sit it/);
    for (const assumed of [/your child/i, /parent/i]) {
      expect(hero, String(assumed)).not.toMatch(assumed);
    }
    // The title a shared link carries, in all four places it is written.
    for (const file of [
      ['app', 'page.tsx'],
      ['app', 'layout.tsx'],
      ['app', 'opengraph-image.tsx'],
    ]) {
      expect(read(...file), file.join('/')).not.toMatch(/Your child/i);
    }
  });

  // A minor's data is a parent or guardian's to ask about, and saying so needs
  // the word. This is the one surface where "child" is exactly right.
  it('keeps the word where it means a guardian\'s rights over a minor', () => {
    expect(read('app', 'privacy', 'page.tsx')).toMatch(/parent or guardian/i);
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
// the sitting most students take — and a dated claim expires into a lie. There
// is no scarcity to assert either: one price, uncapped.
describe('urgency', () => {
  const LANDING = read('app', 'page.tsx');
  const CONTENT = read('lib', 'landing-content.ts');
  const visible = LANDING.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  it('states no launch date', () => {
    expect(visible).not.toMatch(/LAUNCHES/);
    expect(CONTENT).not.toMatch(/launchDate/);
  });

  it('keeps no cap, because there is no longer one to claim', () => {
    // The cap is gone entirely; what remains true is that no number is typed.
    expect(visible).not.toMatch(/\b100\b/);
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
    expect(LANDING).toMatch(/through your chosen exam sitting/i);
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
    // Said once now (ROUND_7 Task 4): every second occurrence of the phrase went.
    expect(LANDING.replace(/\s+/g, ' ')).toMatch(/every method mark, awarded or withheld, with the reason/i);
  });

  it('keeps the limits, which are what make the rest believable', () => {
    const flat = LANDING.replace(/\s+/g, ' ');
    expect(flat).toMatch(/we do not cover at all/i);
    expect(flat).toMatch(/not affiliated|CXC&rsquo;s papers are their copyright/i);
    expect(flat).toMatch(/We do not send reports/i);
  });
});

// EVERY STATISTIC ON THE PAGE NAMES ITS SOURCE, AND THE SOURCE IS CXC'S.
//
// The page once carried a benchmark nobody could source and a mean mark with
// the wrong year. The band is two tiles, each pinned here to the cxc.org
// document it came from (ROUND_7 Task 4; tiles ROUND_8 Task 5). Both were read on 2026-09-05.
describe('the landing band', () => {
  it('states the pass rate from the most recent CXC Subject Report, by year and percentage', () => {
    const { passRate } = LANDING_CONTENT;
    // cxc.org, CSEC Mathematics Subject Report May–June 2026: 23 169 of 79 917
    // candidates (36.02 per cent) gained Grades I–III.
    expect(passRate.percent).toBe(36);
    expect(passRate.caption).toMatch(/36%/);
    expect(passRate.caption).toMatch(/Subject Report, May–June 2026/);
    expect(passRate.source).toMatch(/^https:\/\/www\.cxc\.org\/.*RPT2026CSECMayJuneMathematicsSubjectReport\.pdf$/);
    expect(passRate.figure).toBe('36%');
    expect(passRate.label).toBe('of candidates passed');
    expect(passRate.sourceLabel).toBe('CXC Subject Report, May–June 2026');
  });

  it('states the Paper 2 weighting from the syllabus by its document code, with only the date the document prints', () => {
    const { weighting } = LANDING_CONTENT;
    // CXC 05/G/SYLL 16 assessment grid: Paper 02 is 15 CK, 20 AK, 15 R of 50 weighted marks.
    expect(weighting.percent).toBe(70);
    expect(weighting.caption).toMatch(/CXC 05\/G\/SYLL 16/);
    expect(weighting.caption).toMatch(/effective for examinations from May–June 2027/i);
    expect(weighting.source).toMatch(/^https:\/\/www\.cxc\.org\//);
    expect(weighting.figure).toBe('70%');
    expect(weighting.label).toBe('of Paper 2 marks are for method');
    expect(weighting.sourceLabel).toBe('CXC syllabus, from May–June 2027');
  });

  it('has dropped the bank-measured figure and the mean mark', () => {
    expect(LANDING_CONTENT).not.toHaveProperty('statWorking');
    expect(LANDING_CONTENT).not.toHaveProperty('statAvgScore');
    expect(LANDING_CONTENT).not.toHaveProperty('statBenchmark');
  });
});

// THE LEDE, PINNED (ROUND_7 Task 4).
describe('the landing lede', () => {
  const page = read('app', 'page.tsx').replace(/\s+/g, ' ');
  it('is the agreed sentence, under the agreed h1, with one free button and its label', () => {
    expect(page).toContain('<h1>Practise CSEC Maths the way you&rsquo;ll sit it.</h1>');
    expect(page).toMatch(/Work original, past-paper-style questions on paper\. Photograph your page\. See where your working earns marks &mdash; and where it loses them &mdash; so you know what to improve before exam day\./);
    expect(page).toMatch(/Mark one question free <small>No card required\.<\/small>/);
  });
  it('says CXC examiner nowhere, and in May nowhere', () => {
    for (const f of [['app', 'page.tsx'], ['app', 'layout.tsx'], ['app', 'opengraph-image.tsx'], ['app', 'welcome', 'page.tsx'], ['app', 'welcome', 'welcome-view.tsx']]) {
      expect(read(...f), f.join('/')).not.toMatch(/CXC examiner/);
      expect(read(...f), f.join('/')).not.toMatch(/\bin May\b/);
    }
  });
});

// THE PRICE AND THE CAP LIVE IN ONE PLACE.
//
// The price will change again, and there is one place to change it. A number
// typed onto a surface is what turns that into a hunt — and the cap that used to
// live here proved the point: it was stated in WORDS in the FAQ, where no search
// for the digits would have found it.
describe('price and cap are stated only through LANDING', () => {
  const strip = (src: string) => src.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '');
  const LANDING_PAGE = strip(read('app', 'page.tsx'));

  it('states the price nowhere by hand', () => {
    expect(LANDING_PAGE).not.toMatch(/\$\d+/);
    expect(LANDING_PAGE).toContain('LANDING.price');
  });

  it('states no cap anywhere, in digits or in words', () => {
    expect(LANDING_PAGE).not.toMatch(/\bhundred\b/i);
    expect(LANDING_PAGE).not.toMatch(/\b100\b/);
  });

  it('makes no scarcity claim at all — one price, no cohort, no cap', () => {
    // The $25 Founding Families tier is gone. An uncapped single price has no
    // scarcity to claim, and a claim about usage that cannot be shown does not
    // go on this page.
    expect(LANDING_PAGE).not.toMatch(/Founding Famil/);
    expect(LANDING_PAGE).not.toMatch(/FAMILIES ONLY/);
    expect(LANDING_PAGE).not.toMatch(/\bplaces\b/);
    expect(LANDING_PAGE).not.toMatch(/locked for life/);
  });

  it('keeps price and cap off every other surface', () => {
    for (const f of [
      ['app', 'welcome', 'page.tsx'],
      ['app', 'welcome', 'welcome-view.tsx'],
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

// ONE SUPPORT ADDRESS, STATED ONCE.
//
// It appears on the landing footer, /welcome and both legal pages, and it will
// change again — a support address typed onto a surface is a surface that keeps
// the old one after the change.
describe('the support address', () => {
  const strip = (src: string) => src.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '');

  it('is written down in exactly one place', () => {
    for (const f of [
      ['app', 'page.tsx'],
      ['app', 'welcome', 'page.tsx'],
      ['app', 'welcome', 'welcome-view.tsx'],
      ['app', 'legal.tsx'],
      ['app', 'terms', 'page.tsx'],
      ['app', 'privacy', 'page.tsx'],
      ['lib', 'email.ts'],
    ]) {
      // No literal address on any surface — they all read the constant.
      expect(strip(read(...f)), f.join('/')).not.toMatch(/[a-z0-9._%+-]+@anansi\.xyz/i);
    }
    expect(LANDING_CONTENT.contactEmail).toMatch(/^[a-z0-9._%+-]+@anansi\.xyz$/);
  });

  it('reaches every surface that offers help', () => {
    for (const f of [
      ['app', 'page.tsx'],
      ['app', 'welcome', 'welcome-view.tsx'],
      ['app', 'legal.tsx'],
    ]) {
      expect(read(...f), f.join('/')).toContain('LANDING.contactEmail');
    }
  });
});
