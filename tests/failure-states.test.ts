import { describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FAILURES, visibleText } from './helpers/failure-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study' }));

// ROUND_9 Task 7: when something breaks, the refusal pattern on the amber
// bar — what did not happen, what is still safe, the one thing to do next.
// Never a code the student cannot use; the Next defaults render nowhere.
const text = Object.fromEntries(Object.entries(FAILURES).map(([k, f]) => [k, visibleText(f())]));
const NOTHING = 'Nothing has been marked and nothing has been counted. Your working on paper is still the working. ';

describe('when something breaks', () => {
  it('could not read the page: nothing counted, take it again, the photo advice', () => {
    expect(text['read-failed']).toBe(
      'Couldn’t read the page The photograph came through, but the writing on it could not be made out. ' + NOTHING + 'Take it again Flat page, good light, the whole answer in frame. Or type the answers instead',
    );
    expect(text['read-too-large']).toBe('Couldn’t read the page That photo is too large. Try again in better light. ' + NOTHING + 'Take it again Flat page, good light, the whole answer in frame. Or type the answers instead');
    expect(FAILURES['read-failed']()).toContain('href="#question"');
  });
  it('rate-limited, with the real window', () => {
    expect(text['read-limited']).toBe('Too many at once Too many photographs at once. You can try again in 1 minute. ' + NOTHING + 'Take it again Available in 1 minute');
  });
  it('not found and the error boundary, on the door', () => {
    expect(text['not-found']).toBe('This page doesn’t exist The link may be old, or a character may be missing from it. Your notebook is where it always is, with everything in it. Go to your notebook Get help');
    expect(FAILURES['not-found']()).toMatch(/href="mailto:[^"]+@anansi\.xyz"/);
    expect(text.broken).toBe('Something went wrong on our side Not your phone and not your connection. Every mark you have earned is saved. Nothing you did is affected. Try again Go to your notebook');
    expect(FAILURES.broken()).not.toMatch(/boom|abc123|digest/);
  });
  it('amber, never red, never a cross, never sorry, never a code', () => {
    for (const [k, h] of Object.entries(FAILURES)) {
      const html = h();
      expect(html, k).toContain('border-amber');
      expect(html, k).not.toMatch(/bg-red-pen|border-red-pen|✗|sorry/i);
    }
    for (const f of ['not-found.tsx', 'error.tsx', 'global-error.tsx']) expect(existsSync(join(process.cwd(), 'app', f)), f).toBe(true);
    const src = readFileSync(join(process.cwd(), 'app', 'error.tsx'), 'utf8');
    expect(src).not.toMatch(/\{error\.(message|digest)\}/);
    const photo = readFileSync(join(process.cwd(), 'app', 'study', 'session', '[id]', 'working-photo.tsx'), 'utf8');
    expect(photo).not.toMatch(/border-red-pen/);
    expect(photo).toMatch(/state === 'failed' && <CaptureFailure message=\{error/);
    expect(photo).toMatch(/state === 'illegible' && <CaptureFailure message="illegible"/);
  });
});
