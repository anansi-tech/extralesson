import { describe, expect, it } from 'vitest';
import {
  buildClassificationArtifact,
  buildCorpusClassificationPrompt,
  ClassifiedPaperZ,
  hasCompletePaperOneSequence,
  ModelPaperClassificationZ,
  type ExtractedPdfSignals,
} from '@/lib/generation/corpus-classification';

describe('corpus classification boundary', () => {
  it('accepts metadata-only question classifications', () => {
    expect(ModelPaperClassificationZ.safeParse({
      questions: [{
        question_number: 1,
        objective_ids: ['M2.4.3'],
        archetype: 'multi-step-application',
        command_verbs: ['determine'],
        context_category: 'measurement',
        part_count: 2,
        marks: 5,
        inferred_profile: 'AK',
        difficulty: 2,
        visual_types: ['geometry-figure'],
        confidence: 0.9,
        review_flags: [],
      }],
      review_flags: [],
    }).success).toBe(true);
  });

  it('rejects expressive source fields and duplicate question numbers', () => {
    const question = {
      question_number: 1,
      objective_ids: ['M1.5.1'],
      archetype: 'direct-procedure',
      command_verbs: ['solve'],
      context_category: 'none',
      part_count: 1,
      marks: 2,
      inferred_profile: 'AK',
      difficulty: 1,
      visual_types: [],
      confidence: 0.8,
      review_flags: [],
    };
    expect(ModelPaperClassificationZ.safeParse({
      questions: [{ ...question, source_text: 'forbidden' }],
      review_flags: [],
    }).success).toBe(false);
    expect(ModelPaperClassificationZ.safeParse({
      questions: [question, question],
      review_flags: [],
    }).success).toBe(false);
  });

  it('allows an interrogative item with no explicit command verb', () => {
    const result = ModelPaperClassificationZ.safeParse({
      questions: [{
        question_number: 1,
        objective_ids: ['M1.5.1'],
        archetype: 'concept-recognition',
        command_verbs: [],
        context_category: 'none',
        part_count: 1,
        marks: 1,
        inferred_profile: 'CK',
        difficulty: 1,
        visual_types: [],
        confidence: 0.8,
        review_flags: [],
      }],
      review_flags: [],
    });
    expect(result.success).toBe(true);
  });

  it('normalizes a short command phrase to lowercase', () => {
    const result = ModelPaperClassificationZ.parse({
      questions: [{
        question_number: 1,
        objective_ids: ['M1.5.1'],
        archetype: 'direct-procedure',
        command_verbs: ['Write Down'],
        context_category: 'none',
        part_count: 1,
        marks: 1,
        inferred_profile: 'AK',
        difficulty: 1,
        visual_types: [],
        confidence: 0.8,
        review_flags: [],
      }],
      review_flags: [],
    });
    expect(result.questions[0].command_verbs).toEqual(['write down']);
  });

  it('requires the complete 1-to-60 sequence for Paper 1', () => {
    const base = {
      objective_ids: ['M1.5.1'],
      archetype: 'direct-procedure' as const,
      command_verbs: ['solve'],
      context_category: 'none' as const,
      part_count: 1,
      marks: 1,
      inferred_profile: 'AK' as const,
      difficulty: 1 as const,
      visual_types: [],
      confidence: 0.8,
      review_flags: [],
    };
    const complete = ModelPaperClassificationZ.parse({
      questions: Array.from({ length: 60 }, (_, index) => ({
        ...base,
        question_number: index + 1,
      })),
      review_flags: [],
    });
    expect(hasCompletePaperOneSequence(complete)).toBe(true);
    expect(hasCompletePaperOneSequence({ ...complete, questions: complete.questions.slice(1) })).toBe(false);
  });

  it('builds a prompt that demands abstract output only', () => {
    const signals: ExtractedPdfSignals = {
      page_count: 1,
      text: '[PAGE 1]\nTransient source text',
      text_items: 3,
      text_chars: 21,
      native_text_chars: 21,
      ocr_text_chars: 0,
      embedded_images: 0,
      pages: [{
        page: 1,
        text_source: 'native',
        text_items: 3,
        text_chars: 21,
        native_text_chars: 21,
        ocr_text_chars: 0,
        embedded_images: 0,
      }],
    };
    const prompt = buildCorpusClassificationPrompt({
      paper: 2,
      year: 2024,
      session: 'may-june',
      objectiveCatalog: [{
        id: 'M2.4.3',
        topic_code: 'M2-GEO1',
        topic_title: 'Geometry and Trigonometry 1',
        text: 'Apply geometric properties.',
      }],
      signals,
    });
    expect(prompt).toContain('Return metadata only');
    expect(prompt).toContain('Never quote, reproduce, summarize, or paraphrase');
    expect(prompt).toContain('M2.4.3 | M2-GEO1');
  });

  it('builds an aggregate catalog without expressive source fields', () => {
    const paper = ClassifiedPaperZ.parse({
      corpus_entry_id: 'source:paper.pdf',
      exam_key: '2024-may-june-P2',
      paper: 2,
      year: 2024,
      session: 'may-june',
      page_count: 12,
      native_text_chars: 4_000,
      ocr_text_chars: 800,
      embedded_images: 3,
      extraction: 'native-with-ocr',
      classifier: { model: 'test-model', version: 'v1' },
      classification: {
        questions: [{
          question_number: 1,
          objective_ids: ['M2.4.3'],
          archetype: 'multi-step-application',
          command_verbs: ['determine'],
          context_category: 'measurement',
          part_count: 2,
          marks: 5,
          inferred_profile: 'AK',
          difficulty: 2,
          visual_types: ['geometry-figure'],
          confidence: 0.9,
          review_flags: [],
        }],
        review_flags: [],
      },
    });
    const artifact = buildClassificationArtifact({
      inventoryHash: 'a'.repeat(64),
      eligiblePapers: 101,
      papers: [paper],
      generatedAt: '2026-08-14T00:00:00.000Z',
    });
    expect(artifact.summary).toMatchObject({
      classified_papers: 1,
      pending_papers: 100,
      classified_questions: 1,
    });
    expect(artifact.aggregates.by_objective).toEqual({ 'M2.4.3': 1 });
    expect(artifact.aggregates.by_visual_type).toEqual({ 'geometry-figure': 1 });
    expect(JSON.stringify(artifact)).not.toContain('source_text');
  });
});
