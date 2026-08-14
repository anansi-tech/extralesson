import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { scaleBankPlan } from '@/lib/generation/bank-plan';
import { QuestionBankTargetsArtifactZ } from '@/lib/generation/question-bank-targets';

const ArgsZ = z.object({
  total: z.coerce.number().int().positive().max(100_000),
}).strict();

function parseArgs() {
  const argv = process.argv.slice(2);
  const index = argv.indexOf('--total');
  return ArgsZ.parse({ total: index >= 0 ? argv[index + 1] : 400 });
}

async function main() {
  const args = parseArgs();
  const targets = QuestionBankTargetsArtifactZ.parse(
    JSON.parse(await readFile('design/research/question-bank-targets.json', 'utf8')),
  );
  console.log(JSON.stringify(scaleBankPlan(targets, args.total), null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'unknown failure');
  process.exit(1);
});
