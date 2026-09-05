// What a results file must name, so two runs can be told apart (ROUND_6
// Task 7): the models, the marker prompt, the approved rubric, and the commit.
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Question } from '@/lib/db';
import { MODEL_ID, READER_MODEL_ID } from '@/lib/ai';
import { promptHash } from '@/lib/grade/mark-method';
import { GRADER_VERSION, MARKER_VERSION } from '@/lib/grade/version';

export interface Provenance {
  ran_at: string;
  commit: string;
  marker_model: string;
  reader_model: string;
  prompt_hash: string;
  rubric_version: string;
  grader_version: string;
  marker_version: string;
}

/** A hash over every approved rubric row, in bank order: a rubric edit changes it. */
export async function rubricVersion(): Promise<string> {
  const rows = await Question.find({ status: 'approved' }).select('rubric').sort({ _id: 1 }).lean<{ _id: unknown; rubric?: unknown[] }[]>();
  const h = createHash('sha256');
  for (const q of rows) h.update(`${String(q._id)}:${JSON.stringify(q.rubric ?? [])}\n`);
  return h.digest('hex').slice(0, 12);
}

export async function provenance(): Promise<Provenance> {
  let commit = 'unknown';
  try {
    commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    /* outside a checkout */
  }
  return {
    ran_at: new Date().toISOString(),
    commit,
    marker_model: MODEL_ID,
    reader_model: READER_MODEL_ID,
    prompt_hash: promptHash(),
    rubric_version: await rubricVersion(),
    grader_version: GRADER_VERSION,
    marker_version: MARKER_VERSION,
  };
}

export const RESULTS = join(process.cwd(), 'calibration', 'results');

/** Written beside the run, named by script and time; never overwritten. */
export function writeResults(script: string, body: object): string {
  mkdirSync(RESULTS, { recursive: true });
  const file = join(RESULTS, `${script}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify(body, null, 1) + '\n');
  return file;
}
