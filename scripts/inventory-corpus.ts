// Metadata-only inventory for the two research archives named by the founder.
// Files are streamed into a hash and are never written to disk. No question
// wording, answer, diagram, OCR output, or other expressive content is retained.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import {
  classifyCorpusFilename,
  CorpusEntryZ,
  CorpusInventoryZ,
  determineEligibility,
  parseCsecHubManifest,
  parseDriveFolderHtml,
  type CorpusEntry,
  type DiscoveredCorpusEntry,
} from '@/lib/generation/corpus-inventory';

const CSECHUB_API = 'https://csechub.com/wp-json/wp/v2/pages?slug=csec-mathematics-past-papers';
const CSECHUB_LANDING = 'https://csechub.com/csec-mathematics-past-papers/';
const DRIVE_FOLDER_ID = '1giDOqjfkj0B07dEm0s4DoCSY8COzZ8m2';
const DRIVE_EMBED = `https://drive.google.com/embeddedfolderview?id=${DRIVE_FOLDER_ID}#list`;
const SECONDARY_LANDING = 'https://www.csecpastpapers.com/math-1';

const ArgsZ = z.object({
  output: z.string().min(1),
  concurrency: z.coerce.number().int().min(1).max(8),
});

const WordpressResponseZ = z.array(z.object({
  content: z.object({ rendered: z.string().min(1) }),
})).min(1);

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const index = argv.indexOf(`--${flag}`);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  return ArgsZ.parse({
    output: get('output') ?? 'design/research/question-corpus-inventory.json',
    concurrency: get('concurrency') ?? '4',
  });
}

async function fetchText(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function discoverEntries(): Promise<DiscoveredCorpusEntry[]> {
  const [wordpressRaw, driveHtml] = await Promise.all([
    fetchText(CSECHUB_API).then((text) => WordpressResponseZ.parse(JSON.parse(text))),
    fetchText(DRIVE_EMBED),
  ]);
  return [
    ...parseCsecHubManifest(wordpressRaw[0].content.rendered),
    ...parseDriveFolderHtml(driveHtml),
  ];
}

function detectFormat(prefix: Buffer): 'pdf' | 'jpeg' | 'other' {
  if (prefix.subarray(0, 5).toString('ascii') === '%PDF-') return 'pdf';
  if (prefix[0] === 0xff && prefix[1] === 0xd8 && prefix[2] === 0xff) return 'jpeg';
  return 'other';
}

async function fetchMetadata(entry: DiscoveredCorpusEntry): Promise<CorpusEntry> {
  const classified = classifyCorpusFilename(entry.filename);
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(entry.fetch_url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(180_000),
      });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

      const hash = createHash('sha256');
      const prefixChunks: Buffer[] = [];
      let prefixBytes = 0;
      let bytes = 0;
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const buffer = Buffer.from(value);
        hash.update(buffer);
        bytes += buffer.length;
        if (prefixBytes < 8) {
          const slice = buffer.subarray(0, 8 - prefixBytes);
          prefixChunks.push(slice);
          prefixBytes += slice.length;
        }
      }
      const format = detectFormat(Buffer.concat(prefixChunks));
      const eligibility = determineEligibility({
        classification: classified.classification,
        paper: classified.paper,
        format,
        fetchSucceeded: true,
      });
      return CorpusEntryZ.parse({
        ...entry,
        ...classified,
        eligible_for_pattern_analysis: eligibility.eligible,
        exclusion_reasons: eligibility.reasons,
        fetch: {
          status: 'ok',
          http_status: response.status,
          content_type: response.headers.get('content-type') ?? 'unknown',
          bytes,
          sha256: hash.digest('hex'),
          format,
        },
        duplicate_group: null,
        duplicate_of: null,
        exam_key: classified.paper && classified.year && classified.session
          ? `${classified.year}-${classified.session}-P${classified.paper}`
          : null,
        same_exam_group: null,
        same_exam_of: null,
      });
    } catch (error) {
      lastError = error;
    }
  }
  const eligibility = determineEligibility({
    classification: classified.classification,
    paper: classified.paper,
    format: null,
    fetchSucceeded: false,
  });
  return CorpusEntryZ.parse({
    ...entry,
    ...classified,
    eligible_for_pattern_analysis: false,
    exclusion_reasons: eligibility.reasons,
    fetch: {
      status: 'failed',
      http_status: null,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    },
    duplicate_group: null,
    duplicate_of: null,
    exam_key: classified.paper && classified.year && classified.session
      ? `${classified.year}-${classified.session}-P${classified.paper}`
      : null,
    same_exam_group: null,
    same_exam_of: null,
  });
}

async function mapConcurrent<T, R>(
  values: T[],
  concurrency: number,
  fn: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await fn(values[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function addDuplicateMetadata(entries: CorpusEntry[]): void {
  const byHash = new Map<string, CorpusEntry[]>();
  for (const entry of entries) {
    if (entry.fetch.status !== 'ok') continue;
    const group = byHash.get(entry.fetch.sha256) ?? [];
    group.push(entry);
    byHash.set(entry.fetch.sha256, group);
  }
  for (const [sha256, group] of byHash) {
    if (group.length < 2) continue;
    const groupId = sha256.slice(0, 16);
    for (const [index, entry] of group.entries()) {
      entry.duplicate_group = groupId;
      entry.duplicate_of = index === 0 ? null : group[0].id;
      if (index > 0) {
        entry.eligible_for_pattern_analysis = false;
        entry.exclusion_reasons.push('exact-duplicate');
      }
    }
  }

  // Different scans or recompressed copies of one sitting do not share a file
  // hash. Group them by exam identity and retain one canonical source for
  // aggregate analysis so repeated papers cannot bias the observed patterns.
  const byExam = new Map<string, CorpusEntry[]>();
  for (const entry of entries) {
    if (entry.classification !== 'question-paper' || !entry.exam_key || entry.paper === 3) continue;
    const group = byExam.get(entry.exam_key) ?? [];
    group.push(entry);
    byExam.set(entry.exam_key, group);
  }
  for (const [examKey, unsortedGroup] of byExam) {
    if (unsortedGroup.length < 2) continue;
    const group = [...unsortedGroup].sort((a, b) => {
      const aUsable = a.fetch.status === 'ok' && a.fetch.format === 'pdf';
      const bUsable = b.fetch.status === 'ok' && b.fetch.format === 'pdf';
      if (aUsable !== bUsable) return aUsable ? -1 : 1;
      if (a.source !== b.source) return a.source === 'csechub' ? -1 : 1;
      return a.filename.localeCompare(b.filename);
    });
    for (const [index, entry] of group.entries()) {
      entry.same_exam_group = examKey;
      entry.same_exam_of = index === 0 ? null : group[0].id;
      if (index > 0) {
        entry.eligible_for_pattern_analysis = false;
        if (!entry.exclusion_reasons.includes('same-exam-copy')) {
          entry.exclusion_reasons.push('same-exam-copy');
        }
      }
    }
  }
}

async function main() {
  const args = parseArgs();
  const discovered = await discoverEntries();
  console.error(`Discovered ${discovered.length} listed files; streaming metadata with concurrency ${args.concurrency}.`);
  const entries = await mapConcurrent(discovered, args.concurrency, async (entry, index) => {
    const result = await fetchMetadata(entry);
    console.error(`[${index + 1}/${discovered.length}] ${result.fetch.status} ${entry.source} ${entry.filename}`);
    return result;
  });
  addDuplicateMetadata(entries);

  const successfulHashes = entries
    .filter((entry) => entry.fetch.status === 'ok')
    .map((entry) => entry.fetch.status === 'ok' ? entry.fetch.sha256 : '');
  const duplicateGroups = new Set(entries.flatMap((entry) => entry.duplicate_group ? [entry.duplicate_group] : []));
  const sameExamGroups = new Set(entries.flatMap((entry) => entry.same_exam_group ? [entry.same_exam_group] : []));
  const classifications = Object.fromEntries(
    ['question-paper', 'paper-bundle', 'solution-or-answer', 'mock-or-sample', 'reference', 'unknown']
      .map((classification) => [
        classification,
        entries.filter((entry) => entry.classification === classification).length,
      ]),
  );
  const inventory = CorpusInventoryZ.parse({
    schema_version: 1,
    generated_at: new Date().toISOString(),
    mode: 'unlicensed-metadata-only',
    policy: {
      raw_files_retained: false,
      extracted_question_content_retained: false,
      purpose: 'File-level inventory, exact deduplication, and same-exam grouping before abstract pattern analysis.',
    },
    sources: [
      {
        id: 'csechub',
        landing_url: CSECHUB_LANDING,
        discovered_entries: entries.filter((entry) => entry.source === 'csechub').length,
      },
      {
        id: 'csecpastpapers-drive',
        landing_url: SECONDARY_LANDING,
        discovered_entries: entries.filter((entry) => entry.source === 'csecpastpapers-drive').length,
      },
    ],
    summary: {
      listed_entries: entries.length,
      fetched_entries: entries.filter((entry) => entry.fetch.status === 'ok').length,
      failed_entries: entries.filter((entry) => entry.fetch.status === 'failed').length,
      unique_file_hashes: new Set(successfulHashes).size,
      exact_duplicate_groups: duplicateGroups.size,
      same_exam_groups: sameExamGroups.size,
      eligible_entries: entries.filter((entry) => entry.eligible_for_pattern_analysis).length,
      classifications,
    },
    entries,
  });

  const outputPath = resolve(args.output);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  console.error(`Wrote metadata-only inventory to ${outputPath}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
