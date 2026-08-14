import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { z } from 'zod';
import { CorpusClassificationArtifactZ } from '@/lib/generation/corpus-classification';
import {
  buildQuestionBankTargets,
  QuestionBankTargetsArtifactZ,
} from '@/lib/generation/question-bank-targets';
import { seedBlueprints } from '@/lib/seed/blueprints';
import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';

const ArgsZ = z.object({
  input: z.string().min(1),
  output: z.string().min(1),
}).strict();

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const index = argv.indexOf(`--${flag}`);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  return ArgsZ.parse({
    input: get('input') ?? 'design/research/question-corpus-classification.json',
    output: get('output') ?? 'design/research/question-bank-targets.json',
  });
}

async function main() {
  const args = parseArgs();
  const source = await readFile(args.input, 'utf8');
  const classification = CorpusClassificationArtifactZ.parse(JSON.parse(source));
  const artifact = buildQuestionBankTargets({
    classification,
    classificationHash: createHash('sha256').update(source).digest('hex'),
    topics: [...module1Topics, ...module2Topics, ...module3Topics],
    blueprints: seedBlueprints,
  });
  await mkdir(dirname(args.output), { recursive: true });
  await writeFile(args.output, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  QuestionBankTargetsArtifactZ.parse(JSON.parse(await readFile(args.output, 'utf8')));
  console.log(JSON.stringify(artifact.summary, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'unknown failure';
  console.error(message);
  process.exit(1);
});
