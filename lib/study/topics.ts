import { Topic } from '@/lib/db';
import type { ModuleNumber } from '@/lib/types';

/**
 * A topic IS an objective prefix — every objective in M1-ALG1 begins 'M1.5.' —
 * so choosing a topic and filtering the question pool are the same operation,
 * and neither has to guess from a title.
 */
export interface TopicChoice {
  code: string;
  title: string;
  module: ModuleNumber;
  /** Objective prefixes this topic covers, e.g. ['M1.5.']. */
  prefixes: string[];
}

function prefixOf(objectiveId: string): string {
  return objectiveId.slice(0, objectiveId.lastIndexOf('.') + 1);
}

export async function loadTopicChoices(modules: ModuleNumber[]): Promise<TopicChoice[]> {
  const topics = await Topic.find({ module: { $in: modules } })
    .sort({ module: 1, order: 1 })
    .lean<{ code: string; title: string; module: ModuleNumber; objectives: { id: string }[] }[]>();

  return topics.map((t) => ({
    code: t.code,
    title: t.title,
    module: t.module,
    prefixes: [...new Set(t.objectives.map((o) => prefixOf(o.id)))],
  }));
}
