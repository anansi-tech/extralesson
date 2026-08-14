import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import targetsJson from '@/design/research/question-bank-targets.json';
import {
  BANK_TARGET_BY_KIND,
  BANK_TARGET_TOTAL,
  QuestionBankTargetsArtifactZ,
} from '@/lib/generation/question-bank-targets';

const targets = QuestionBankTargetsArtifactZ.parse(targetsJson);

describe('corpus-derived question bank targets', () => {
  it('is tied to the exact checked-in classification artifact', () => {
    const source = readFileSync('design/research/question-corpus-classification.json', 'utf8');
    expect(targets.source_classification_sha256).toBe(
      createHash('sha256').update(source).digest('hex'),
    );
    expect(targets.summary.source_papers).toBe(101);
    expect(targets.summary.source_questions).toBe(3_190);
    expect(targets.summary.eligible_style_questions).toBe(2_894);
  });

  it('allocates the full bank by official paper weights and configured kind split', () => {
    const totals = targets.topics.reduce(
      (sum, topic) => ({
        total: sum.total + topic.target_questions.total,
        mcq: sum.mcq + topic.target_questions.mcq,
        structured: sum.structured + topic.target_questions.structured,
      }),
      { total: 0, mcq: 0, structured: 0 },
    );
    expect(totals).toEqual({
      total: BANK_TARGET_TOTAL,
      mcq: BANK_TARGET_BY_KIND.mcq,
      structured: BANK_TARGET_BY_KIND.structured,
    });
    expect(targets.policy.coverage_authority).toBe('2027-official-blueprints');
  });

  it('has usable style evidence for both paper kinds in every syllabus topic', () => {
    expect(targets.topics).toHaveLength(15);
    for (const topic of targets.topics) {
      const objectivePrefix = `M${topic.module}.${topic.order}.`;
      expect(topic.observed_style.mcq.question_count).toBeGreaterThan(0);
      expect(topic.observed_style.structured.question_count).toBeGreaterThan(0);
      expect(topic.observed_style.mcq.representative_patterns.length).toBeGreaterThan(0);
      expect(topic.observed_style.structured.representative_patterns.length).toBeGreaterThan(0);
      for (const kind of ['mcq', 'structured'] as const) {
        expect(topic.observed_style[kind].distributions.objective_id.length).toBeGreaterThan(0);
        for (const pattern of topic.observed_style[kind].representative_patterns) {
          expect(pattern.objective_ids.every((id) => id.startsWith(objectivePrefix))).toBe(true);
        }
      }
    }
  });

  it('retains representative evidence for every observed visual type', () => {
    for (const topic of targets.topics) {
      for (const kind of ['mcq', 'structured'] as const) {
        const style = topic.observed_style[kind];
        const represented = new Set<string>(
          style.representative_patterns.flatMap((pattern) => pattern.visual_types),
        );
        for (const visual of style.distributions.visual_type) {
          expect(represented.has(visual.value), `${topic.topic_code} ${kind} ${visual.value}`).toBe(true);
        }
      }
    }
    expect(targets.summary.visual_question_target).toBeGreaterThan(0);
    expect(Object.values(targets.summary.visual_target_by_type).reduce((sum, count) => sum + count, 0))
      .toBe(targets.summary.visual_question_target);
    expect(targets.summary.visual_target_by_type['geometry-figure']).toBeGreaterThan(0);
    expect(targets.summary.visual_target_by_type['function-graph']).toBeGreaterThan(0);
    expect(targets.summary.visual_target_by_type['data-table']).toBeGreaterThan(0);
    expect(targets.summary.visual_target_by_type['mapping-diagram']).toBeGreaterThan(0);
  });

  it('contains abstract controls but no expressive question fields', () => {
    const serialized = JSON.stringify(targets);
    expect(serialized).not.toMatch(/source_text|question_text|prompt_text|wording/);
    expect(targets.policy.source_content_retained).toBe(false);
    expect(targets.policy.generated_questions_must_be_original).toBe(true);
  });
});
