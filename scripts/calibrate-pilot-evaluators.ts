import { readFile, rename, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import {
  calibratePilotEvaluators,
  PilotEvaluationForCalibrationZ,
} from '@/lib/generation/pilot-calibration';

const ArgsZ = z.object({
  primary: z.string().min(1),
  comparator: z.string().min(1),
  output: z.string().min(1),
}).strict();

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const index = argv.indexOf(`--${flag}`);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  return ArgsZ.parse({
    primary: get('primary') ?? 'design/research/question-bank-pilot-evaluation.json',
    comparator: get('comparator') ?? 'design/research/question-bank-pilot-evaluation-terra.json',
    output: get('output') ?? 'design/research/question-bank-pilot-evaluator-calibration.json',
  });
}

async function readArtifact(path: string) {
  const raw: unknown = JSON.parse(await readFile(path, 'utf8'));
  return PilotEvaluationForCalibrationZ.parse(raw);
}

async function main() {
  const args = parseArgs();
  const primary = await readArtifact(args.primary);
  const comparator = await readArtifact(args.comparator);
  const calibration = calibratePilotEvaluators(primary, comparator);
  const artifact = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    mode: 'unlicensed-metadata-only',
    ...calibration,
  };
  const temporary = `${args.output}.tmp`;
  await writeFile(temporary, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  await rename(temporary, args.output);
  console.log(`Core agreement: ${calibration.agreement.core_classification_bps / 100}%`);
  console.log(`Readiness agreement: ${calibration.agreement.readiness_bps / 100}%`);
  console.log(`Routing: ${calibration.routing.decision}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
