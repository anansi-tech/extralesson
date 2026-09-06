import { Door } from './door';
import { Refusal } from './refusal';
import { LANDING } from '@/lib/landing-content';

export const metadata = { title: 'This page doesn’t exist — ExtraLesson' };

/** The refusal pattern, on the door (ROUND_9 Task 7; Refusals.dc.html §09). Never a code. */
export default function NotFound() {
  return (
    <Door signedIn={false}>
      <Refusal
        id="not-found"
        amber
        bare
        label="This page doesn’t exist"
        sentence="The link may be old, or a character may be missing from it."
        remains="Your notebook is where it always is, with everything in it."
        action={{ label: 'Go to your notebook', href: '/study' }}
        quiet={{ label: 'Get help', href: `mailto:${LANDING.contactEmail}` }}
      />
    </Door>
  );
}
