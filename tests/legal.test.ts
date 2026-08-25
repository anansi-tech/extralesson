import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IMAGE_TTL_DAYS } from '@/lib/db/transcription';

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

  it('does not promise access expires at the sitting, which nothing enforces', () => {
    // hasAccess() checks only that a sitting was granted. If an expiry is ever
    // built, this is where the wording changes with it.
    expect(TERMS).not.toMatch(/until (the|your) (stated )?sitting/i);
    expect(TERMS).not.toMatch(/expires/i);
  });
});
