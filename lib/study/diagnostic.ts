/**
 * READING A DIAGNOSTIC.
 *
 * A diagnostic asks about one question a topic. That supports a grouping —
 * these held up, these did not — and it does not support a ranking finer than
 * that, a score, or a grade. Eight items is far below the marks a prediction
 * needs, and a grade here would be the invented confidence taken out of the
 * landing page.
 */
export type TopicVerdict = 'HELD UP' | 'MIXED' | 'STRUGGLED';

/** Where a verdict sits when the topics are put in order. */
const GROUP: Record<TopicVerdict, number> = { 'HELD UP': 0, MIXED: 1, STRUGGLED: 2 };

export interface SeenTopic {
  right: number;
  asked: number;
}

/** What the session saw of each topic, keyed by objective prefix. */
export function topicsSeen(
  attempts: { question_id: unknown; correct: boolean }[],
  topicOfQuestion: Map<string, string>,
): Map<string, SeenTopic> {
  const seen = new Map<string, SeenTopic>();
  for (const a of attempts) {
    const prefix = topicOfQuestion.get(String(a.question_id));
    if (!prefix) continue;
    const row = seen.get(prefix) ?? { right: 0, asked: 0 };
    row.asked++;
    if (a.correct) row.right++;
    seen.set(prefix, row);
  }
  return seen;
}

export function verdictFor(seen: SeenTopic | undefined): TopicVerdict | null {
  if (!seen || seen.asked === 0) return null;
  if (seen.right === seen.asked) return 'HELD UP';
  return seen.right === 0 ? 'STRUGGLED' : 'MIXED';
}

/**
 * Topics in the order the diagnostic actually supports.
 *
 * By VERDICT, never by overall topic mastery. Mastery folds every attempt the
 * student has ever made, so ordering by it and labelling with this session's
 * evidence stacked two different measurements in one list — the topic printed
 * top read STRUGGLED while the one below it read HELD UP, because the top one
 * carried marks from earlier work the diagnostic never touched.
 *
 * Inside a group the syllabus order is kept. One question cannot separate two
 * topics that both held up, and sorting them by a difference that small would
 * be presenting noise as a finding.
 */
export function rankByVerdict<T extends { module: number; order: number }>(
  topics: T[],
  verdictOf: (topic: T) => TopicVerdict | null,
): T[] {
  return [...topics].sort((a, b) => {
    const ga = GROUP[verdictOf(a) ?? 'STRUGGLED'] ?? 3;
    const gb = GROUP[verdictOf(b) ?? 'STRUGGLED'] ?? 3;
    return ga !== gb ? ga - gb : a.module - b.module || a.order - b.order;
  });
}
