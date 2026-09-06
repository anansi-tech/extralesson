import { LegalPage } from '../legal';
import { REFUND_DAYS } from '@/lib/access';

export const metadata = { title: 'Refunds — ExtraLesson' };

/** Short, and the same window the offer and the terms read from one constant. */
export default function RefundsPage() {
  return (
    <LegalPage title="Refunds" updated="6 September 2026">
      <p>
        If ExtraLesson is not what you expected, email us within {REFUND_DAYS} days of paying and
        we will refund you &mdash; no questions, no forms.
      </p>
      <p>
        Refunds after that are up to us, and we would rather sort out whatever went wrong. Tell us
        when the marking is wrong and it gets fixed.
      </p>
    </LegalPage>
  );
}
