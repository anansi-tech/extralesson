/**
 * A diagnostic asks about one question a topic. That supports a grouping — these
 * held up, these did not — and not a finer ranking, a score, or a grade: eight
 * items is far below the marks a prediction needs.
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
 * By VERDICT, never by topic mastery, which folds every attempt ever made and
 * would stack two measurements in one list. Syllabus order inside a group,
 * since one question cannot separate two topics that both held up.
 */
/**
 * The finish reads the other way up: what struggled first, and within a
 * group the topic worth the most marks first (ROUND_9 Task 5).
 */
export function rankForFinish<T extends { module: number; order: number }>(
  topics: T[],
  verdictOf: (topic: T) => TopicVerdict | null,
  marksOf: (topic: T) => number,
): T[] {
  return [...topics].sort((a, b) => {
    const ga = GROUP[verdictOf(a) ?? 'STRUGGLED'] ?? 3;
    const gb = GROUP[verdictOf(b) ?? 'STRUGGLED'] ?? 3;
    if (ga !== gb) return gb - ga;
    const d = marksOf(b) - marksOf(a);
    return d !== 0 ? d : a.module - b.module || a.order - b.order;
  });
}

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
