import Link from 'next/link';
import { startSession } from './actions';
import type { LeadPanel } from '@/lib/study/lead-panel';
import type { Leverage } from '@/lib/study/leverage';
import { gradeLabel, gradePlace } from '@/lib/study/leverage';
import type { OverallPrediction } from '@/lib/grade/predict';
import type { Progress } from '@/lib/study/progress';
import type { TopicChoice } from '@/lib/study/topics';
import type { FirstQuestion } from '@/lib/study/first-question';
import { MIN_MARKS_FOR_PREDICTION } from '@/lib/mastery/config';
import { DIAGNOSTIC_MINUTES, SESSION_MINUTES } from '@/lib/session/builder';
import { DIAGNOSTIC_INTERVAL_DAYS, FREE_SESSIONS } from '@/lib/access';
import { LANDING, paymentLink } from '@/lib/landing-content';
import { Refusal } from '../refusal';

export interface DashboardProps {
  firstName: string;
  email: string;
  /** The sitting the student's access was for, for the expired-access note. */
  sitting: string | null;
  lead: LeadPanel;
  open: { id: string; answered: number; questions: number; marksLeft: number } | null;
  diagnosticOpen: boolean;
  isNewStudent: boolean;
  firstQuestion: FirstQuestion | null;
  reachable: Leverage[];
  /** Reachable topics today's session will not visit while Module 1 is the prerequisite. */
  gatedCount: number;
  leadWithReachable: boolean;
  prediction: OverallPrediction;
  progress: Progress;
  topicChoices: TopicChoice[];
  revisitMarks: number;
  revisitObjectives: number;
  /** Marks lost too recently to revisit. */
  waiting: number;
  error?: string;
  mode?: string;
}

/**
 * THE DASHBOARD AS DRAWN (ROUND_8 Task 1): one primary action with its
 * evidence beside it; the estimate a panel in the rail at 1280 and below the
 * action at 390, never the headline. One DOM for both widths: a flex column
 * ordered for the phone, a two-column grid for the desk.
 */
export function DashboardView(p: DashboardProps) {
  const { lead, prediction } = p;
  const showsEstimate = lead === 'session' || lead === 'resume';
  const showsCounters = showsEstimate && p.progress.sessionsCompleted > 0;
  const shortModule = prediction.modules.find((m) => m.marks_seen < MIN_MARKS_FOR_PREDICTION);

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_var(--rail)] lg:items-start lg:gap-10">
      <div className="contents lg:block">
        {(lead === 'first' || lead === 'diagnostic') && (
          <div className="order-1">
            <h1 className="mb-1 text-2xl font-black tracking-[-0.015em]">
              {p.firstName}&rsquo;s notebook<span className="text-red-pen">.</span>
            </h1>
            <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
              {lead === 'first' ? 'Nothing in it yet' : 'One question marked'}
            </div>
          </div>
        )}

        {lead === 'resume' && p.open ? (
          <Link href={`/study/session/${p.open.id}`} className={`${PRIMARY} order-1 block`}>
            Carry on with your session
            <small className={PRIMARY_SMALL}>
              {p.open.answered} OF {p.open.questions} DONE · {p.open.marksLeft} MARK
              {p.open.marksLeft === 1 ? '' : 'S'} LEFT
            </small>
          </Link>
        ) : lead === 'first' ? (
          <form action={startSession} className="order-1">
            <input type="hidden" name="mode" value="first" />
            <button className={PRIMARY}>
              Mark one question free
              <small className={PRIMARY_SMALL}>ONE REAL QUESTION · NOT ONE OF YOUR SESSIONS</small>
            </button>
          </form>
        ) : lead === 'diagnostic' ? (
          <form action={startSession} className="order-1">
            <input type="hidden" name="mode" value="diagnostic" />
            <button className={PRIMARY}>
              Start with a quick diagnostic
              <small className={PRIMARY_SMALL}>
                ABOUT {DIAGNOSTIC_MINUTES} MINUTES · EIGHT QUESTIONS · NOTHING SCORED
              </small>
            </button>
          </form>
        ) : (
          <form action={startSession} className="order-1">
            <button className={PRIMARY}>
              Start today&rsquo;s session
              <small className={PRIMARY_SMALL}>
                {SESSION_MINUTES} MINUTES ·{' '}
                {prediction.estimable || !shortModule
                  ? 'WEAKEST TOPICS FIRST'
                  : `${MIN_MARKS_FOR_PREDICTION - shortModule.marks_seen} MORE MARKS AND MODULE ${shortModule.module} CAN BE ESTIMATED`}
              </small>
            </button>
          </form>
        )}

        <Notices {...p} />

        {p.leadWithReachable && (
          <section className="order-2 mt-[26px] border-t-[1.5px] border-ink pt-3.5 lg:mt-7 lg:pt-4">
            <Label>Where your marks are</Label>
            <ul className="mt-2.5">
              {p.reachable.map((t) => (
                <li key={t.code} className="flex items-baseline justify-between gap-3 border-b border-paper-deep py-2.5 last:border-b-0">
                  <span className="text-[15px]">
                    <b>{t.title}</b>
                  </span>
                  <span className="shrink-0 font-mono text-sm text-green-pen">+{Math.round(t.pointsAvailable)} marks</span>
                </li>
              ))}
            </ul>
            <p className="mt-0.5 text-xs leading-normal text-dim">
              Marks your estimate could gain from that topic.
              {p.gatedCount > 0 && ' Module 1 comes first, so later modules wait — you can still practise any topic by name.'}
            </p>
          </section>
        )}

        {lead === 'first' ? (
          <div className="order-4 mt-6 border-t border-margin pt-3.5 lg:mt-[26px]">
            {p.diagnosticOpen && (
              <form action={startSession}>
                <input type="hidden" name="mode" value="diagnostic" />
                <button className={SECONDARY}>
                  Or start with the diagnostic
                  <small className={SECONDARY_SMALL}>About {DIAGNOSTIC_MINUTES} minutes · finds where to start</small>
                </button>
              </form>
            )}
          </div>
        ) : lead === 'diagnostic' ? (
          <div className="order-4 mt-[18px] border-t border-margin pt-3.5 lg:mt-[26px]">
            <form action={startSession}>
              <input type="hidden" name="mode" value="adaptive" />
              <button className={SECONDARY}>
                Or start a session now
                <small className={SECONDARY_SMALL}>About {SESSION_MINUTES} minutes at exam pace</small>
              </button>
            </form>
          </div>
        ) : (
          <Choose {...p} />
        )}
      </div>

      <div className="contents lg:flex lg:flex-col lg:gap-6">
        {lead === 'first' && (
          <div className="order-2 mt-3 lg:mt-0 lg:border-[1.5px] lg:border-ink lg:bg-white lg:p-5 lg:shadow-[var(--shadow-panel)]">
            <div className="hidden lg:block">
              <RailLabel>What happens next</RailLabel>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-2.5 gap-y-1.5 lg:mt-3.5 lg:gap-y-2.5">
              {STEPS.map((s, i) => (
                <StepRow key={s} n={i + 1} text={s} />
              ))}
            </div>
          </div>
        )}
        {lead === 'diagnostic' && p.firstQuestion && (
          <section className="order-2 mt-6 border-t-[1.5px] border-ink pt-3.5 lg:mt-0 lg:border-[1.5px] lg:bg-white lg:p-5 lg:shadow-[var(--shadow-panel)]">
            <RailLabel>Your first question</RailLabel>
            <div className="mt-2.5 flex items-baseline justify-between gap-3">
              <span className="text-sm">{p.firstQuestion.title}</span>
              <span className="shrink-0 font-mono text-sm">
                {p.firstQuestion.earned}/{p.firstQuestion.marks}
              </span>
            </div>
            <Link href={`/study/session/${p.firstQuestion.sessionId}`} className={`${LINK} mt-0.5`}>
              Read the marking again
            </Link>
          </section>
        )}
        {showsEstimate && <Estimate prediction={prediction} />}
        {showsCounters && <Counters progress={p.progress} />}
      </div>
    </div>
  );
}

const PRIMARY =
  'w-full min-h-11 bg-red-pen px-4 py-[18px] text-left text-[19px] font-black text-white shadow-[var(--shadow-card)] lg:p-5 lg:text-[21px]';
const PRIMARY_SMALL = 'mt-1.5 block font-mono text-[10.5px] font-medium tracking-[0.1em] opacity-85';
const SECONDARY = 'w-full min-h-11 border-[1.5px] border-ink p-3 text-left text-sm disabled:border-rule disabled:text-dim';
const SECONDARY_SMALL = 'mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-dim';
const LINK = 'inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.14em] underline underline-offset-[3px]';

const STEPS = ['Work it on paper, the way the exam is.', 'Photograph the page.', 'Every method mark, and the reason for each.'];

function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]">{children}</div>;
}

/** A rail card's heading, which at 1280 carries the margin-red underline. */
function RailLabel({ children, quiet }: { children: React.ReactNode; quiet?: boolean }) {
  const small = quiet ? 'text-[10px] tracking-[0.1em] text-dim lg:text-[11px] lg:font-bold lg:tracking-[0.14em] lg:text-ink' : 'text-[11px] font-bold tracking-[0.14em]';
  return <div className={`font-mono uppercase ${small} lg:block lg:pb-0.5 lg:shadow-[0_1.5px_0_var(--margin)]`}>{children}</div>;
}

function StepRow({ n, text }: { n: number; text: string }) {
  return (
    <>
      <span className="font-hand text-lg leading-none text-red-pen">{n}</span>
      <span className="text-[13px]">{text}</span>
    </>
  );
}

function Estimate({ prediction }: { prediction: OverallPrediction }) {
  if (!prediction.estimable) {
    return (
      <section className="order-3 mt-[26px] border-t-[1.5px] border-ink pt-3.5 lg:mt-0 lg:border-[1.5px] lg:bg-white lg:p-5 lg:shadow-[var(--shadow-panel)]">
        <RailLabel>Not yet estimated</RailLabel>
        <p className="mb-3 mt-2 text-[13px] leading-normal">
          A grade needs enough marks seen in every module it covers.
          <span className="lg:hidden"> This is how close each one is.</span>
        </p>
        <ul>
          {prediction.modules.map((m) => {
            const seen = Math.min(m.marks_seen, MIN_MARKS_FOR_PREDICTION);
            return (
              <li key={m.module} className="border-b border-paper-deep py-2.5 last:border-b-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm">
                    <b>Module {m.module}</b>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-dim">
                    {seen} of {MIN_MARKS_FOR_PREDICTION} marks seen
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded border border-ink bg-paper-deep">
                  <i className="block h-full bg-amber" style={{ width: `${Math.round((100 * seen) / MIN_MARKS_FOR_PREDICTION)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-2.5 text-xs leading-normal text-dim">
          No letter is shown until then. A cold account&rsquo;s arithmetic reads as a verdict, and it is not one.
        </p>
      </section>
    );
  }
  return (
    <section className="order-3 mt-[22px] flex items-baseline justify-between gap-3 border-t border-margin pt-3 lg:mt-0 lg:block lg:border-[1.5px] lg:border-ink lg:bg-white lg:p-5 lg:shadow-[var(--shadow-panel)]">
      <div>
        <RailLabel quiet>Estimate today</RailLabel>
        <div className="mt-0.5 flex items-baseline gap-2 lg:mt-3 lg:gap-2.5">
          <span className="text-xl font-black leading-[1.1] text-red-pen lg:text-[26px] lg:leading-none">
            {prediction.overall_grade ? gradeLabel(prediction.overall_grade) : '—'}
          </span>
          {prediction.overall_grade && (
            <span className="font-mono text-[10px] text-dim">{gradePlace(prediction.overall_grade)}</span>
          )}
        </div>
        <div className="hidden font-mono text-[10px] leading-relaxed text-dim lg:mt-2 lg:block">
          Paper 3 assumed at neutral carry-over. Moves with every question.
        </div>
      </div>
      <Link href="/study/progress" className={`${LINK} shrink-0 lg:mt-1`}>
        <span className="lg:hidden">Progress</span>
        <span className="hidden lg:inline">Topic by topic</span>
      </Link>
    </section>
  );
}

function Counters({ progress }: { progress: Progress }) {
  const counts = [
    { n: progress.sessionsCompleted, label: progress.sessionsCompleted === 1 ? 'session' : 'sessions' },
    { n: progress.questionsAnswered, label: progress.questionsAnswered === 1 ? 'question' : 'questions' },
    { n: progress.marksAssessed, label: 'marks assessed' },
    { n: progress.streakDays, label: progress.streakDays === 1 ? 'day in a row' : 'days in a row' },
  ];
  return (
    <section className="order-5 mt-[22px] border-t border-margin pt-3.5 lg:mt-0 lg:border-t-0 lg:pt-0">
      <div className="hidden lg:block">
        <RailLabel>Since you started</RailLabel>
      </div>
      <div className="grid grid-cols-4 gap-2 lg:mt-3.5 lg:grid-cols-2 lg:gap-x-3 lg:gap-y-4">
        {counts.map((s) => (
          <div key={s.label}>
            <div className="text-[22px] font-black lg:text-[28px] lg:leading-none">{s.n}</div>
            <div className="font-mono text-[9px] uppercase leading-[1.3] tracking-[0.08em] text-dim lg:mt-[3px] lg:text-[9.5px]">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The things a student knows about their own week that the app cannot. */
function Choose(p: DashboardProps) {
  return (
    <section className="order-4 mt-[22px] border-t border-margin pt-3.5 lg:mt-7 lg:pt-4">
      <Label>Or choose for yourself</Label>
      {p.open && (
        <p className="mt-1 text-[11px] leading-snug text-dim">
          Starting one of these begins a new session. Your answers so far are saved, and the session
          above is waiting for you when this one is finished.
        </p>
      )}
      <div className="mt-3 flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-3">
        <form action={startSession}>
          <input type="hidden" name="mode" value="revisit" />
          <button disabled={p.revisitMarks === 0} className={SECONDARY}>
            Revisit mistakes
            <small className={SECONDARY_SMALL}>
              {p.revisitMarks > 0
                ? `${p.revisitMarks} mark${p.revisitMarks === 1 ? '' : 's'} lost across ${p.revisitObjectives} objective${p.revisitObjectives === 1 ? '' : 's'}`
                : p.waiting > 0
                  ? 'Nothing far enough back yet — these are still fresh'
                  : 'Nothing to revisit yet'}
            </small>
          </button>
        </form>
        {!p.isNewStudent && p.diagnosticOpen && (
          <form action={startSession}>
            <input type="hidden" name="mode" value="diagnostic" />
            <button className={SECONDARY}>
              Take a diagnostic
              <small className={SECONDARY_SMALL}>
                {DIAGNOSTIC_MINUTES} minutes · {p.lead === 'session' ? 're-ranks' : 'ranks'} your topics
              </small>
            </button>
          </form>
        )}
        <form action={startSession} className="flex gap-2">
          <input type="hidden" name="mode" value="topic" />
          <select
            id="topic"
            name="topic"
            aria-label="Practise a topic"
            defaultValue={p.topicChoices[0]?.code}
            className="min-w-0 flex-1 border-[1.5px] border-ink bg-paper p-2.5 text-base"
          >
            {p.topicChoices.map((t) => (
              <option key={t.code} value={t.code}>
                M{t.module} · {t.title}
              </option>
            ))}
          </select>
          <button className="min-h-11 border-[1.5px] border-ink px-3.5 font-mono text-xs uppercase tracking-[0.1em]">
            <span className="lg:hidden">Go</span>
            <span className="hidden lg:inline">Practise it</span>
          </button>
        </form>
      </div>
    </section>
  );
}

/** What a refused start says, beneath the action it refused: one pattern for all seven. */
function Notices({ error, mode, sitting, email }: DashboardProps) {
  const cls = 'order-1 mt-4';
  const today = { label: 'Start today’s session', small: `${SESSION_MINUTES} minutes · weakest topics first`, form: { mode: 'adaptive' } };
  return (
    <>
      {error === 'access-expired' && (
        <Refusal
          id="sitting-passed"
          className={cls}
          label="Your sitting has passed"
          sentence={<>Access ran to {sitting ?? 'that sitting'}, and that paper is written.</>}
          remains="Your notebook stays open — every question and every mark, for as long as you want to read them."
          action={{ label: 'Get access for the next sitting', small: `${LANDING.price} · one payment · runs to your sitting`, href: paymentLink(), newTab: true }}
        />
      )}
      {error === 'diagnostic-taken' && (
        <Refusal
          id="diagnostic-taken"
          className={cls}
          label="You have already done the diagnostic"
          sentence="It ranks your topics, and it has — your sessions start where it put you."
          remains={<>Another one this term would rank the same topics from the same answers. It opens again after {DIAGNOSTIC_INTERVAL_DAYS} days, for coming back to after a term away.</>}
          action={today}
        />
      )}
      {error === 'first-taken' && (
        <Refusal
          id="first-taken"
          className={cls}
          label="You have had your first question"
          sentence="It was one question to show how marking works, and it is done."
          remains="A session gives you whole exam questions marked the same way."
          action={today}
        />
      )}
      {error === 'needs-access' && (
        <Refusal
          id="paywall"
          className={cls}
          label={`That was your ${FREE_SESSIONS} free sessions`}
          sentence={<>The free question, the diagnostic and your {FREE_SESSIONS} free sessions are used. Daily sessions, the diagnostic and examiner-style marking need full access.</>}
          remains="Everything you have done stays here — your marks, your topics, and every question you have answered."
          action={{ label: `Get access — ${LANDING.price}`, small: 'SECURE CHECKOUT · CARD OR APPLE PAY', red: true, href: paymentLink(), newTab: true }}
          quiet={{ label: 'Read your marked work', href: '/study/history' }}
        >
          <div className="mt-5 flex items-baseline gap-3">
            <div className="text-[40px] font-black leading-none text-red-pen">{LANDING.price}</div>
            <div className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-dim">
              One payment · no subscription
              <br />
              Runs to your sitting
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-dim">
            Use <span className="font-mono">{email}</span> when you pay, so we can match it to this account.
          </p>
        </Refusal>
      )}
      {error === 'no-questions' && mode === 'topic' && (
        <Refusal
          id="no-questions-topic"
          className={cls}
          label="No questions on that topic yet"
          sentence="There are no questions on that topic yet."
          remains="Try another one, or start the usual session."
          action={today}
          quiet={{ label: 'Practise a topic', href: '/study' }}
        />
      )}
      {error === 'no-questions' && mode !== 'topic' && (
        <Refusal
          id="no-questions"
          className={cls}
          label="No approved questions yet"
          sentence="No approved questions are available for your modules yet."
          remains="Check back soon. Everything you have done stays here."
          quiet={{ label: 'Read your marked work', href: '/study/history' }}
        />
      )}
      {error === 'nothing-to-revisit' && (
        <Refusal
          id="nothing-to-revisit"
          className={cls}
          label="Nothing to revisit yet"
          sentence="The marks you lost are still fresh — revisiting them today would only be repeating them."
          remains="They come back on their own, on the objectives you lost them on, in a few days."
          action={today}
        />
      )}
      {error === 'no-topic' && (
        <Refusal
          id="no-topic"
          className={cls}
          label="That topic is not one of yours"
          sentence="That topic is not one of yours."
          remains="Pick one from the list."
          action={today}
          quiet={{ label: 'Practise a topic', href: '/study' }}
        />
      )}
    </>
  );
}
