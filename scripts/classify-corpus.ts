// Transient classifier for the canonical corpus inventory. Source files and
// extracted wording remain in memory only; the saved catalog contains abstract tags.
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, NoObjectGeneratedError, type LanguageModel } from 'ai';
import sharp from 'sharp';
import { createWorker, type Worker } from 'tesseract.js';
import {
  buildClassificationArtifact,
  buildCorpusClassificationPrompt,
  ClassifiedPaperZ,
  CORPUS_CLASSIFIER_VERSION,
  CorpusClassificationArtifactZ,
  extractPdfSignals,
  flagUnknownObjectives,
  hasCompletePaperOneSequence,
  ModelPaperClassificationZ,
  repairKnownClassificationAliases,
  type ClassifiedPaper,
  type ObjectiveCatalogEntry,
} from '@/lib/generation/corpus-classification';
import { CorpusInventoryZ } from '@/lib/generation/corpus-inventory';
import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';

const DEFAULT_OUTPUT = 'design/research/question-corpus-classification.json';
const DEFAULT_CLASSIFIER_MODEL = 'gpt-5.6-luna';

const ClassifierEnvZ = z.object({
  AI_API_KEY: z.string().min(1),
  CORPUS_CLASSIFIER_MODEL: z.string().min(1).default(DEFAULT_CLASSIFIER_MODEL),
});

const ArgsZ = z.object({
  mode: z.enum(['audit', 'classify']),
  limit: z.coerce.number().int().min(1).optional(),
  output: z.string().min(1),
  restart: z.boolean(),
}).strict();

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const index = argv.indexOf(`--${flag}`);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  return ArgsZ.parse({
    mode: get('mode') ?? 'audit',
    limit: get('limit'),
    output: get('output') ?? DEFAULT_OUTPUT,
    restart: argv.includes('--restart'),
  });
}

const allTopics = [...module1Topics, ...module2Topics, ...module3Topics];
const objectiveCatalog: ObjectiveCatalogEntry[] = allTopics.flatMap((topic) =>
  topic.objectives.map((objective) => ({
    id: objective.id,
    topic_code: topic.code,
    topic_title: topic.title,
    text: objective.text,
  })),
);
const objectiveIds = new Set(objectiveCatalog.map((objective) => objective.id));

async function fetchBytes(url: string): Promise<Uint8Array> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(180_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return new Uint8Array(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function readExisting(output: string, restart: boolean, inventoryHash: string) {
  if (restart) return [];
  try {
    const raw: unknown = JSON.parse(await readFile(output, 'utf8'));
    const current = CorpusClassificationArtifactZ.safeParse(raw);
    const existing = current.success
      ? current.data
      : z.object({
        source_inventory_sha256: z.string().regex(/^[a-f0-9]{64}$/),
        papers: z.array(ClassifiedPaperZ),
      }).passthrough().parse(raw);
    if (existing.source_inventory_sha256 !== inventoryHash) {
      throw new Error('Existing catalog was built from a different corpus inventory; use --restart');
    }
    return existing.papers;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

async function writeArtifact(
  output: string,
  inventoryHash: string,
  eligiblePapers: number,
  papers: ClassifiedPaper[],
) {
  const artifact = buildClassificationArtifact({
    inventoryHash,
    eligiblePapers,
    papers: [...papers].sort((a, b) => a.exam_key.localeCompare(b.exam_key)),
  });
  await mkdir(dirname(output), { recursive: true });
  const temporary = `${output}.tmp`;
  await writeFile(temporary, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  await rename(temporary, output);
  return artifact;
}

async function classifyPaper(
  prompt: string,
  examKey: string,
  paper: 1 | 2,
  classifierModel: LanguageModel,
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { object, usage } = await generateObject({
        model: classifierModel,
        schema: ModelPaperClassificationZ,
        prompt,
        maxOutputTokens: 20_000,
        providerOptions: { openai: { reasoningEffort: 'low' } },
        experimental_repairText: async ({ text }) => repairKnownClassificationAliases(text),
      });
      const removedObjectives = flagUnknownObjectives(object, objectiveIds);
      if (removedObjectives > 0) {
        console.error(`${examKey} removed ${removedObjectives} objective IDs outside the 2027 catalog`);
      }
      if (paper === 1 && !hasCompletePaperOneSequence(object)) {
        throw new Error('returned an incomplete Paper 1 question sequence');
      }
      return { object, usage };
    } catch (error) {
      lastError = error;
      const errorName = error instanceof Error ? error.name : typeof error;
      let issuePaths = '';
      if (NoObjectGeneratedError.isInstance(error) && error.text) {
        try {
          const raw: unknown = JSON.parse(error.text);
          const parsed = ModelPaperClassificationZ.safeParse(raw);
          if (!parsed.success) {
            issuePaths = ` issues=${parsed.error.issues
              .slice(0, 8)
              .map((issue) => {
                let value = raw;
                for (const segment of issue.path) {
                  if (typeof value !== 'object' || value === null) break;
                  value = (value as Record<string | number, unknown>)[segment];
                }
                return `${issue.code}:${issue.path.join('.')}=${JSON.stringify(value).slice(0, 40)}`;
              })
              .join(',')}`;
          }
        } catch {
          issuePaths = ' issues=invalid-json';
        }
      }
      const diagnostics = NoObjectGeneratedError.isInstance(error)
        ? ` finish=${error.finishReason ?? 'unknown'} chars=${error.text?.length ?? 0} cause=${error.cause instanceof Error ? error.cause.name : 'unknown'}`
        : '';
      console.error(`${examKey} classification attempt ${attempt}/3 failed (${errorName})${diagnostics}${issuePaths}`);
    }
  }
  throw lastError;
}

function extractionKind(nativeChars: number, ocrChars: number, totalChars: number) {
  if (totalChars < 1_000) return 'insufficient' as const;
  if (nativeChars > 0 && ocrChars > 0) return 'native-with-ocr' as const;
  if (ocrChars > 0) return 'ocr-only' as const;
  return 'native' as const;
}

async function main() {
  const args = parseArgs();
  const inventoryText = await readFile('design/research/question-corpus-inventory.json', 'utf8');
  const inventory = CorpusInventoryZ.parse(JSON.parse(inventoryText));
  const allEligible = inventory.entries.filter(
    (entry) => entry.eligible_for_pattern_analysis && (entry.paper === 1 || entry.paper === 2),
  );
  const selected = allEligible.slice(0, args.limit);
  const inventoryHash = createHash('sha256').update(inventoryText).digest('hex');

  if (args.mode === 'audit') {
    const auditRows: Array<Record<string, unknown>> = [];
    for (const [index, entry] of selected.entries()) {
      const data = await fetchBytes(entry.fetch_url);
      const signals = await extractPdfSignals(data);
      auditRows.push({
        corpus_entry_id: entry.id,
        exam_key: entry.exam_key,
        paper: entry.paper,
        year: entry.year,
        session: entry.session,
        page_count: signals.page_count,
        native_text_chars: signals.native_text_chars,
        embedded_images: signals.embedded_images,
        text_extractability: signals.native_text_chars >= 1_000
          ? 'native'
          : signals.native_text_chars > 0 ? 'sparse' : 'none',
      });
      console.error(`[${index + 1}/${selected.length}] ${entry.exam_key} native-chars=${signals.native_text_chars}`);
    }
    console.log(JSON.stringify({
      summary: {
        source_inventory_sha256: inventoryHash,
        eligible_papers: selected.length,
        native_text_papers: auditRows.filter((row) => row.text_extractability === 'native').length,
        sparse_text_papers: auditRows.filter((row) => row.text_extractability === 'sparse').length,
        no_text_papers: auditRows.filter((row) => row.text_extractability === 'none').length,
        total_pages: auditRows.reduce((sum, row) => sum + Number(row.page_count), 0),
        total_native_text_chars: auditRows.reduce((sum, row) => sum + Number(row.native_text_chars), 0),
      },
      papers: auditRows,
    }, null, 2));
    return;
  }

  const completed = await readExisting(args.output, args.restart, inventoryHash);
  const completedIds = new Set(completed.map((paper) => paper.corpus_entry_id));
  if (selected.every((entry) => completedIds.has(entry.id))) {
    const artifact = buildClassificationArtifact({
      inventoryHash,
      eligiblePapers: allEligible.length,
      papers: completed,
    });
    console.log(JSON.stringify(artifact.summary, null, 2));
    return;
  }

  const classifierConfig = ClassifierEnvZ.parse(process.env);
  const openai = createOpenAI({ apiKey: classifierConfig.AI_API_KEY });
  const classifierModel = openai(classifierConfig.CORPUS_CLASSIFIER_MODEL);
  let ocrWorker: Worker | undefined;

  try {
    for (const [index, entry] of selected.entries()) {
      if (completedIds.has(entry.id)) {
        console.error(`[${index + 1}/${selected.length}] ${entry.exam_key} already classified`);
        continue;
      }
      if (
        (entry.paper !== 1 && entry.paper !== 2) ||
        entry.year === null ||
        entry.session === null ||
        entry.exam_key === null
      ) throw new Error(`${entry.id} lacks canonical exam metadata`);

      const data = await fetchBytes(entry.fetch_url);
      const signals = await extractPdfSignals(data, {
        ocrPage: async (png) => {
          ocrWorker ??= await createWorker('eng', 1, { cacheMethod: 'none' });
          const original = await ocrWorker.recognize(Buffer.from(png));
          if (original.data.text.trim().length >= 80) return original.data.text;
          const candidates = [original.data.text];
          for (const threshold of [150, 180]) {
            const prepared = await sharp(Buffer.from(png))
              .grayscale()
              .normalize()
              .threshold(threshold)
              .png()
              .toBuffer();
            const retried = await ocrWorker.recognize(prepared);
            candidates.push(retried.data.text);
          }
          return candidates.sort((a, b) => b.length - a.length)[0];
        },
      });
      if (signals.text_chars < 1_000) {
        throw new Error(`${entry.exam_key} has insufficient readable text after OCR`);
      }

      const { object, usage } = await classifyPaper(
        buildCorpusClassificationPrompt({
          paper: entry.paper,
          year: entry.year,
          session: entry.session,
          objectiveCatalog,
          signals,
        }),
        entry.exam_key,
        entry.paper,
        classifierModel,
      );

      const classified = ClassifiedPaperZ.parse({
        corpus_entry_id: entry.id,
        exam_key: entry.exam_key,
        paper: entry.paper,
        year: entry.year,
        session: entry.session,
        page_count: signals.page_count,
        native_text_chars: signals.native_text_chars,
        ocr_text_chars: signals.ocr_text_chars,
        embedded_images: signals.embedded_images,
        extraction: extractionKind(signals.native_text_chars, signals.ocr_text_chars, signals.text_chars),
        classifier: {
          model: classifierConfig.CORPUS_CLASSIFIER_MODEL,
          version: CORPUS_CLASSIFIER_VERSION,
        },
        usage: {
          input_tokens: usage.inputTokens ?? 0,
          cached_input_tokens: usage.cachedInputTokens ?? 0,
          output_tokens: usage.outputTokens ?? 0,
          reasoning_tokens: usage.reasoningTokens ?? 0,
        },
        classification: object,
      });
      completed.push(classified);
      completedIds.add(entry.id);
      const artifact = await writeArtifact(args.output, inventoryHash, allEligible.length, completed);
      console.error(
        `[${index + 1}/${selected.length}] ${entry.exam_key} questions=${object.questions.length} total=${artifact.summary.classified_papers} input=${usage.inputTokens ?? 0} cached=${usage.cachedInputTokens ?? 0} output=${usage.outputTokens ?? 0}`,
      );
    }
  } finally {
    await ocrWorker?.terminate();
  }

  const artifact = await writeArtifact(args.output, inventoryHash, allEligible.length, completed);
  console.log(JSON.stringify(artifact.summary, null, 2));
}

main().catch((error) => {
  const name = error instanceof Error ? error.name : typeof error;
  const message = error instanceof Error ? error.message.split('\n', 1)[0].slice(0, 300) : 'unknown failure';
  console.error(`${name}: ${message}`);
  process.exit(1);
});
