import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';

const objectiveTopicEntries = [...module1Topics, ...module2Topics, ...module3Topics]
  .flatMap((topic) => topic.objectives.map((objective) => [objective.id, topic.code] as const));
const topicByObjective = new Map(objectiveTopicEntries);

if (topicByObjective.size !== objectiveTopicEntries.length) {
  throw new Error('Seeded syllabus contains a duplicate objective id');
}

export function topicCodeForObjective(objectiveId: string): string {
  const topicCode = topicByObjective.get(objectiveId);
  if (!topicCode) throw new Error(`No seeded topic mapping for ${objectiveId}`);
  return topicCode;
}
