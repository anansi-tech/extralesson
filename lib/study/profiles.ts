import type { Profile } from '@/lib/types';
import type { MasteryBand } from '@/lib/mastery/config';

// CK, AK and R stay — they are CXC's own labels, they appear on real mark
// schemes, and a candidate is better off meeting them here than for the first
// time in an exam room. What was missing is that nobody ever said what they
// mean. They were printed as three bare initials over three numbers, on the
// page a student sees straight after their first session.
//
// So: keep the label, gloss it once, in words a sixteen-year-old and the aunt
// paying for this already use. Not a definition of the syllabus term — what the
// mark was actually given for.

export const PROFILE_MEANING: Record<Profile, string> = {
  CK: 'knowing what to do',
  AK: 'doing the working',
  R: 'explaining why',
};

/** Said once wherever the initials first appear on a surface. */
export const PROFILE_GLOSS =
  'CXC gives marks three ways: CK for knowing what to do, AK for doing the working, and R for explaining why.';

/**
 * A mastery band in the words a student reads. Shared, because two pages print
 * it and a band that says STRONG on one screen and "Strong" on another reads as
 * two different measurements.
 */
export const BAND_LABEL: Record<MasteryBand, string> = {
  STRONG: 'STRONG',
  BUILDING: 'BUILDING',
  WEAK: 'WEAK',
  NOT_STARTED: 'NOT STARTED',
};
