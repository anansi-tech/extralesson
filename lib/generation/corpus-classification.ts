import { z } from 'zod';
import { OBJECTIVE_ID_RE } from '@/lib/validation/question';

export const CORPUS_CLASSIFIER_VERSION = 'v1';

export const AbstractArchetypeZ = z.enum([
  'concept-recognition',
  'direct-procedure',
  'multi-step-application',
  'interpretation',
  'comparison',
  'justification',
  'reverse-reasoning',
]);

export const VisualArchetypeZ = z.enum([
  'geometry-figure',
  'measurement-figure',
  'coordinate-grid',
  'function-graph',
  'statistical-chart',
  'data-table',
  'number-line',
  'set-diagram',
  'transformation-grid',
  'vector-diagram',
  'bearing-diagram',
  'matrix-diagram',
  'mapping-diagram',
  'other',
]);

export const ClassificationReviewFlagZ = z.enum([
  'objective-ambiguous',
  'numbering-ambiguous',
  'marks-unreadable',
  'visual-type-inferred',
  'source-text-sparse',
  'legacy-only-content',
  'other',
]);

export const ModelQuestionClassificationZ = z.object({
  question_number: z.number().int().min(1).max(100),
  objective_ids: z.array(z.string().regex(OBJECTIVE_ID_RE)).max(12),
  archetype: AbstractArchetypeZ,
  command_verbs: z.array(
    z.string().regex(/^[A-Za-z][A-Za-z -]{1,39}$/).transform((value) => value.toLowerCase()),
  ).max(12),
  context_category: z.string().regex(/^[a-z][a-z-]{1,24}$/),
  part_count: z.number().int().min(1).max(20),
  marks: z.number().int().min(1).max(40).nullable(),
  inferred_profile: z.enum(['CK', 'AK', 'R']),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  visual_types: z.array(VisualArchetypeZ).max(8),
  confidence: z.number().min(0).max(1),
  review_flags: z.array(ClassificationReviewFlagZ),
}).strict();

export const ModelPaperClassificationZ = z.object({
  questions: z.array(ModelQuestionClassificationZ).min(1).max(100),
  review_flags: z.array(ClassificationReviewFlagZ),
}).strict().refine(
  (paper) => new Set(paper.questions.map((question) => question.question_number)).size === paper.questions.length,
  { message: 'question numbers must be unique', path: ['questions'] },
);

export type ModelPaperClassification = z.infer<typeof ModelPaperClassificationZ>;

export function hasCompletePaperOneSequence(classification: ModelPaperClassification): boolean {
  if (classification.questions.length !== 60) return false;
  const numbers = new Set(classification.questions.map((question) => question.question_number));
  return Array.from({ length: 60 }, (_, index) => index + 1).every((number) => numbers.has(number));
}

export function flagUnknownObjectives(
  classification: ModelPaperClassification,
  knownObjectiveIds: ReadonlySet<string>,
): number {
  let removed = 0;
  for (const question of classification.questions) {
    const valid = question.objective_ids.filter((id) => knownObjectiveIds.has(id));
    const removedFromQuestion = question.objective_ids.length - valid.length;
    if (removedFromQuestion === 0) continue;
    question.objective_ids = valid;
    removed += removedFromQuestion;
    question.confidence = Math.min(question.confidence, 0.6);
    if (!question.review_flags.includes('objective-ambiguous')) {
      question.review_flags.push('objective-ambiguous');
    }
  }
  return removed;
}

export function repairKnownClassificationAliases(text: string): string | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null || !('questions' in raw) || !Array.isArray(raw.questions)) {
    return null;
  }

  let changed = false;
  for (const question of raw.questions) {
    if (typeof question !== 'object' || question === null) continue;
    const replacement = question.archetype === 'translation'
      ? 'interpretation'
      : question.archetype === 'construction'
        ? 'direct-procedure'
        : question.archetype === 'application' ? 'multi-step-application' : null;
    if (!replacement) continue;
    question.archetype = replacement;
    if (typeof question.confidence === 'number') question.confidence = Math.min(question.confidence, 0.6);
    if (Array.isArray(question.review_flags) && !question.review_flags.includes('other')) {
      question.review_flags.push('other');
    }
    changed = true;
  }
  return changed ? JSON.stringify(raw) : null;
}

export interface PdfPageSignal {
  page: number;
  text_source: 'native' | 'ocr' | 'native-and-ocr' | 'none';
  text_items: number;
  text_chars: number;
  native_text_chars: number;
  ocr_text_chars: number;
  embedded_images: number;
}

export interface ExtractedPdfSignals {
  page_count: number;
  text: string;
  text_items: number;
  text_chars: number;
  native_text_chars: number;
  ocr_text_chars: number;
  embedded_images: number;
  pages: PdfPageSignal[];
}

export type PageOcr = (png: Uint8Array, page: number) => Promise<string>;

const countTextItems = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export async function extractPdfSignals(
  data: Uint8Array,
  options: { ocrPage?: PageOcr; minimumNativeCharsPerPage?: number } = {},
): Promise<ExtractedPdfSignals> {
  const mupdf = await import('mupdf');
  const document = mupdf.Document.openDocument(data, 'application/pdf');
  const pages: PdfPageSignal[] = [];
  const textPages: string[] = [];
  const minimumNativeChars = options.minimumNativeCharsPerPage ?? 80;

  try {
    for (let pageIndex = 0; pageIndex < document.countPages(); pageIndex++) {
      const pageNumber = pageIndex + 1;
      const page = document.loadPage(pageIndex);
      let nativeText = '';
      let ocrText = '';
      let embeddedImages = 0;
      try {
        const structuredText = page.toStructuredText('preserve-whitespace,preserve-images');
        try {
          nativeText = structuredText.asText().trim();
          const structured = JSON.parse(structuredText.asJSON(1)) as {
            blocks?: Array<{ type?: string }>;
          };
          embeddedImages = structured.blocks?.filter((block) => block.type === 'image').length ?? 0;
        } finally {
          structuredText.destroy();
        }

        if (options.ocrPage && nativeText.length < minimumNativeChars) {
          const pixmap = page.toPixmap(
            mupdf.Matrix.scale(1.5, 1.5),
            mupdf.ColorSpace.DeviceRGB,
            false,
            true,
          );
          try {
            ocrText = (await options.ocrPage(pixmap.asPNG(), pageNumber)).trim();
          } finally {
            pixmap.destroy();
          }
        }
      } finally {
        page.destroy();
      }

      const pageText = [nativeText, ocrText].filter(Boolean).join('\n');
      pages.push({
        page: pageNumber,
        text_source: nativeText && ocrText ? 'native-and-ocr' : nativeText ? 'native' : ocrText ? 'ocr' : 'none',
        text_items: countTextItems(pageText),
        text_chars: pageText.length,
        native_text_chars: nativeText.length,
        ocr_text_chars: ocrText.length,
        embedded_images: embeddedImages,
      });
      textPages.push(`[PAGE ${pageNumber}]\n${pageText}`);
    }
  } finally {
    document.destroy();
  }

  return {
    page_count: pages.length,
    text: textPages.join('\n\n'),
    text_items: pages.reduce((sum, page) => sum + page.text_items, 0),
    text_chars: pages.reduce((sum, page) => sum + page.text_chars, 0),
    native_text_chars: pages.reduce((sum, page) => sum + page.native_text_chars, 0),
    ocr_text_chars: pages.reduce((sum, page) => sum + page.ocr_text_chars, 0),
    embedded_images: pages.reduce((sum, page) => sum + page.embedded_images, 0),
    pages,
  };
}

export const ClassifiedPaperZ = z.object({
  corpus_entry_id: z.string().min(1),
  exam_key: z.string().min(1),
  paper: z.union([z.literal(1), z.literal(2)]),
  year: z.number().int().min(1900).max(2100),
  session: z.enum(['january', 'may-june']),
  page_count: z.number().int().positive(),
  native_text_chars: z.number().int().nonnegative(),
  ocr_text_chars: z.number().int().nonnegative(),
  embedded_images: z.number().int().nonnegative(),
  extraction: z.enum(['native', 'native-with-ocr', 'ocr-only', 'insufficient']),
  classifier: z.object({
    model: z.string().min(1),
    version: z.literal(CORPUS_CLASSIFIER_VERSION),
  }).strict(),
  usage: z.object({
    input_tokens: z.number().int().nonnegative(),
    cached_input_tokens: z.number().int().nonnegative(),
    output_tokens: z.number().int().nonnegative(),
    reasoning_tokens: z.number().int().nonnegative(),
  }).strict().optional(),
  classification: ModelPaperClassificationZ,
}).strict();

export const CorpusClassificationArtifactZ = z.object({
  schema_version: z.literal(1),
  generated_at: z.string().datetime(),
  mode: z.literal('unlicensed-metadata-only'),
  source_inventory_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  policy: z.object({
    raw_files_retained: z.literal(false),
    rendered_pages_retained: z.literal(false),
    extracted_question_content_retained: z.literal(false),
  }).strict(),
  extraction_tools: z.object({
    renderer: z.literal('mupdf@1.28.0'),
    ocr: z.literal('tesseract.js@7.0.0'),
    raster_scale: z.literal(1.5),
    minimum_native_chars_per_page: z.literal(80),
    low_contrast_retry: z.literal('grayscale-normalize-threshold-150-or-180'),
  }).strict(),
  summary: z.object({
    eligible_papers: z.number().int().nonnegative(),
    classified_papers: z.number().int().nonnegative(),
    pending_papers: z.number().int().nonnegative(),
    classified_questions: z.number().int().nonnegative(),
    papers_requiring_review: z.number().int().nonnegative(),
  }).strict(),
  usage: z.object({
    papers_with_usage: z.number().int().nonnegative(),
    input_tokens: z.number().int().nonnegative(),
    cached_input_tokens: z.number().int().nonnegative(),
    output_tokens: z.number().int().nonnegative(),
    reasoning_tokens: z.number().int().nonnegative(),
  }).strict(),
  aggregates: z.object({
    by_paper: z.record(z.string(), z.number().int().nonnegative()),
    by_objective: z.record(z.string(), z.number().int().nonnegative()),
    by_archetype: z.record(AbstractArchetypeZ, z.number().int().nonnegative()),
    by_profile: z.record(z.enum(['CK', 'AK', 'R']), z.number().int().nonnegative()),
    by_difficulty: z.record(z.enum(['1', '2', '3']), z.number().int().nonnegative()),
    by_visual_type: z.record(VisualArchetypeZ, z.number().int().nonnegative()),
    by_context: z.record(z.string(), z.number().int().nonnegative()),
    by_command_verb: z.record(z.string(), z.number().int().nonnegative()),
    by_part_count: z.record(z.string(), z.number().int().nonnegative()),
  }).strict(),
  papers: z.array(ClassifiedPaperZ),
}).strict();

export type ClassifiedPaper = z.infer<typeof ClassifiedPaperZ>;
export type CorpusClassificationArtifact = z.infer<typeof CorpusClassificationArtifactZ>;

function increment(record: Record<string, number>, key: string) {
  record[key] = (record[key] ?? 0) + 1;
}

export function buildClassificationArtifact(args: {
  inventoryHash: string;
  eligiblePapers: number;
  papers: ClassifiedPaper[];
  generatedAt?: string;
}): CorpusClassificationArtifact {
  const aggregates = {
    by_paper: {} as Record<string, number>,
    by_objective: {} as Record<string, number>,
    by_archetype: {} as Record<string, number>,
    by_profile: {} as Record<string, number>,
    by_difficulty: {} as Record<string, number>,
    by_visual_type: {} as Record<string, number>,
    by_context: {} as Record<string, number>,
    by_command_verb: {} as Record<string, number>,
    by_part_count: {} as Record<string, number>,
  };
  let papersRequiringReview = 0;

  for (const paper of args.papers) {
    increment(aggregates.by_paper, `P${paper.paper}`);
    if (
      paper.classification.review_flags.length > 0 ||
      paper.classification.questions.some((question) => question.confidence < 0.75 || question.review_flags.length > 0)
    ) papersRequiringReview++;
    for (const question of paper.classification.questions) {
      for (const objective of question.objective_ids) increment(aggregates.by_objective, objective);
      increment(aggregates.by_archetype, question.archetype);
      increment(aggregates.by_profile, question.inferred_profile);
      increment(aggregates.by_difficulty, String(question.difficulty));
      for (const visual of question.visual_types) increment(aggregates.by_visual_type, visual);
      increment(aggregates.by_context, question.context_category);
      for (const commandVerb of question.command_verbs) increment(aggregates.by_command_verb, commandVerb);
      increment(aggregates.by_part_count, String(question.part_count));
    }
  }

  return CorpusClassificationArtifactZ.parse({
    schema_version: 1,
    generated_at: args.generatedAt ?? new Date().toISOString(),
    mode: 'unlicensed-metadata-only',
    source_inventory_sha256: args.inventoryHash,
    policy: {
      raw_files_retained: false,
      rendered_pages_retained: false,
      extracted_question_content_retained: false,
    },
    extraction_tools: {
      renderer: 'mupdf@1.28.0',
      ocr: 'tesseract.js@7.0.0',
      raster_scale: 1.5,
      minimum_native_chars_per_page: 80,
      low_contrast_retry: 'grayscale-normalize-threshold-150-or-180',
    },
    summary: {
      eligible_papers: args.eligiblePapers,
      classified_papers: args.papers.length,
      pending_papers: args.eligiblePapers - args.papers.length,
      classified_questions: args.papers.reduce(
        (sum, paper) => sum + paper.classification.questions.length,
        0,
      ),
      papers_requiring_review: papersRequiringReview,
    },
    usage: {
      papers_with_usage: args.papers.filter((paper) => paper.usage !== undefined).length,
      input_tokens: args.papers.reduce((sum, paper) => sum + (paper.usage?.input_tokens ?? 0), 0),
      cached_input_tokens: args.papers.reduce(
        (sum, paper) => sum + (paper.usage?.cached_input_tokens ?? 0),
        0,
      ),
      output_tokens: args.papers.reduce((sum, paper) => sum + (paper.usage?.output_tokens ?? 0), 0),
      reasoning_tokens: args.papers.reduce((sum, paper) => sum + (paper.usage?.reasoning_tokens ?? 0), 0),
    },
    aggregates,
    papers: args.papers,
  });
}

export interface ObjectiveCatalogEntry {
  id: string;
  topic_code: string;
  topic_title: string;
  text: string;
}

export function buildCorpusClassificationPrompt(args: {
  paper: 1 | 2;
  year: number;
  session: 'january' | 'may-june';
  objectiveCatalog: ObjectiveCatalogEntry[];
  signals: ExtractedPdfSignals;
}): string {
  const objectives = args.objectiveCatalog
    .map((objective) => `${objective.id} | ${objective.topic_code} | ${objective.text}`)
    .join('\n');
  const pageSignals = args.signals.pages
    .map((page) => `page ${page.page}: text=${page.text_chars}, source=${page.text_source}, embedded-images=${page.embedded_images}`)
    .join('\n');

  return `Classify CSEC Mathematics papers for private curriculum research.

Return metadata only. Never quote, reproduce, summarize, or paraphrase any question, option, answer, diagram, or marking material. Do not return source text in any field.

Create exactly one record for each numbered top-level question. Subparts belong to their top-level question and are represented by part_count. For Paper 1, return the complete sequence of 60 numbered multiple-choice items. For Paper 2, each numbered structured problem is a question.

Record only explicit command verbs. Use an empty command_verbs array for an interrogative multiple-choice stem that has no explicit command verb; do not invent one.

Use a short lowercase generic label for context_category, such as none, consumer, school, travel, sport, workplace, environment, or data. Do not put source wording in this field.

Map each question to the most specific objectives in the 2027 catalog below. Use an empty objective_ids array and the legacy-only-content flag only when there is genuinely no 2027 match. Infer CK, AK, or R from the dominant cognitive demand. Difficulty is 1 routine, 2 multi-step, or 3 demanding/reasoning-heavy.

Archetype describes the structure of the task and must be one of the schema labels. Never use a mathematical topic such as translation, construction, rotation, algebra, or statistics as an archetype.

Visual types describe what a student must read from the source presentation. Use visual-type-inferred when the extracted text refers to a figure but the type is not completely certain. Embedded-image counts are page-level hints, not proof that every question on the page is visual. OCR captures labels and nearby instructions but may not preserve spatial relationships, so apply visual-type-inferred whenever the visual type is uncertain.

2027 OBJECTIVE CATALOG:
${objectives}

PAPER TO CLASSIFY:
Paper ${args.paper}, ${args.session} ${args.year}

PAPER PAGE SIGNALS:
${pageSignals}

TRANSIENT EXTRACTED PAPER TEXT — analyze it, but do not reproduce any of it in the response:
${args.signals.text}`;
}
