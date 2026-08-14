// Audit stored questions for currency/math delimiter collisions: bare "$12"
// currency swallows prose into KaTeX math mode ("12morethanagrass−bankticket").
// Affected questions are NOT string-patched — they are retired with
// reject_reason 'delimiter-collision' so the idempotent generation top-up
// regenerates them under the prompt-v3 EC$ convention.
// Idempotent. Run: npx tsx scripts/audit-delimiters.ts
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';

// A field has a delimiter collision when, after setting aside legitimate EC$
// markers, any of these hold:
//  (a) odd number of $ characters (unbalanced delimiters);
//  (b) a $ directly preceding a digit outside any balanced $...$ segment;
//  (c) a balanced $...$ segment that contains prose — three or more
//      multi-letter words — meaning a bare-$ currency pair swallowed text.
export function fieldHasCollision(raw: string): string | null {
  const s = raw.replace(/EC\$/g, '');
  const dollarCount = (s.match(/\$/g) || []).length;
  if (dollarCount % 2 === 1) return 'odd $ count';

  const mathSegments = s.match(/\$[^$]+\$/g) || [];
  const outside = s.replace(/\$[^$]+\$/g, '');
  if (/\$\d/.test(outside)) return '$ before digit outside math';

  for (const seg of mathSegments) {
    const words = seg
      .slice(1, -1)
      .split(/\s+/)
      .filter((w) => /^[a-zA-Z]{2,}[.,;]?$/.test(w));
    if (words.length >= 3) return `prose inside math: "${seg.slice(0, 60)}"`;
  }
  return null;
}

function questionCollisions(q: {
  stem: string;
  options?: string[];
  rubric?: { criterion: string }[];
  final_answer?: string;
  worked_solution: string;
  misconceptions: { trigger: string; remediation: string }[];
}): string[] {
  const fields: [string, string][] = [
    ['stem', q.stem],
    ['worked_solution', q.worked_solution],
    ...(q.options ?? []).map((o, i) => [`options[${i}]`, o] as [string, string]),
    ...(q.rubric ?? []).map((r, i) => [`rubric[${i}]`, r.criterion] as [string, string]),
    ...(q.final_answer ? ([['final_answer', q.final_answer]] as [string, string][]) : []),
    ...q.misconceptions.flatMap(
      (m, i) =>
        [
          [`misconceptions[${i}].trigger`, m.trigger],
          [`misconceptions[${i}].remediation`, m.remediation],
        ] as [string, string][],
    ),
  ];
  const findings: string[] = [];
  for (const [name, value] of fields) {
    const hit = fieldHasCollision(value);
    if (hit) findings.push(`${name}: ${hit}`);
  }
  return findings;
}

async function main() {
  await dbConnect();
  const questions = await Question.find({ status: { $in: ['draft', 'approved'] } });
  let retired = 0;
  for (const q of questions) {
    const findings = questionCollisions(q);
    if (findings.length > 0) {
      console.log(`✗ ${q._id} (${q.status}) — retiring:`);
      for (const f of findings) console.log(`    ${f}`);
      q.status = 'retired';
      q.reject_reason = 'delimiter-collision';
      await q.save();
      retired++;
    }
  }
  console.log(`Retired ${retired} of ${questions.length} questions for delimiter collisions.`);
  process.exit(0);
}

// Allow importing fieldHasCollision without running the audit (tests).
if (process.argv[1]?.endsWith('audit-delimiters.ts')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
