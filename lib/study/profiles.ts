import type { Profile } from '@/lib/types';
import type { MasteryBand } from '@/lib/mastery/config';

// CK, AK and R stay — they are CXC's own labels and a candidate is better off
// meeting them here than in an exam room — but each is glossed once, in words a
// sixteen-year-old already uses. Not a definition of the syllabus term: what
// the mark was actually given for.

export const PROFILE_MEANING: Record<Profile, string> = {
  CK: 'knowing what to do',
  AK: 'doing the working',
  R: 'explaining why',
};

/**
 * Always visible beside the initials, compressed rather than hidden: a student
 * meeting CK, AK and R for the first time gets what they mean on the same
 * screen as the numbers. The fuller version sits behind the detail below it.
 */
export const PROFILE_GLOSS_SHORT =
  'CK knowing what to do · AK the working · R explaining why';

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
