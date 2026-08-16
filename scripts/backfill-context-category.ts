// Same-commit backfill for R1.8 Part 0's context_category.
//
// Every question written before the field existed still HAS a setting — it is
// just not recorded, so the ledger cannot see it and the first paper-shaped
// batch would be told the bank has used nothing. Classify from the question's
// own words, and leave anything ambiguous unset rather than guessing: an
// unclassified question is honest, a wrongly classified one poisons the ledger.
//
// Idempotent. Run: pnpm tsx scripts/backfill-context-category.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import type { ContextCategory } from '@/lib/types';

const RULES: [ContextCategory, RegExp][] = [
  ['banking', /\b(interest|loan|mortgage|deposit|hire[- ]purchase|exchange rate|currency|US\$|savings account|instalment)\b/i],
  ['wages', /\b(salary|wage|paid|pay|earnings|overtime|fortnight|commission|income tax|deduction)\b/i],
  ['retail', /\b(shop|store|stall|vendor|market|sells?|sold|discount|mark(?:ed)?[- ]up|sale price|customer|retail)\b/i],
  ['transport', /\b(journey|bus|taxi|ferry|car|driver|speed|km\/h|fare|travel|route|timetable|fuel)\b/i],
  ['agriculture', /\b(farm|crop|plant(?:ed|ing)?|harvest|livestock|goat|cow|banana|mango|yam|field of)\b/i],
  ['fishing', /\b(fisher|boat|catch of|net|seine|lobster|snapper)\b/i],
  ['construction', /\b(tile|paving|pave|fence|fencing|wall|builder|cement|concrete|roof|floor of the room|patio)\b/i],
  ['household', /\b(tank|kitchen|recipe|bill|appliance|garden|room|bedroom|water usage|electricity)\b/i],
  ['school', /\b(school|class|student|pupil|teacher|examination|homework|library|fair)\b/i],
  ['sport', /\b(cricket|football|netball|athletic|match|team|score|tournament|race)\b/i],
  ['events', /\b(festival|concert|fete|carnival|party|catering|ticket sales)\b/i],
  ['tourism', /\b(hotel|tourist|visitor|resort|beach|tour|cruise)\b/i],
  ['health', /\b(clinic|patient|dosage|medicine|nurse|nutrition|calorie|blood)\b/i],
  ['environment', /\b(rainfall|recycl|conservation|solar|energy|pollution|temperature record)\b/i],
  ['manufacturing', /\b(factory|production|packaging|machine|assembly|batch of)\b/i],
];

// Bare mathematics: either almost no prose at all, or prose whose SUBJECT is a
// mathematical object rather than a person doing something. "The diagram shows
// a circle with centre O" has no setting; "A vendor buys 24 mangoes" has one.
const MATH_OBJECT =
  /\b(diagram|graph|grid|circle|triangle|quadrilateral|polygon|function|matrix|sequence|expression|equation|inequality|integer|factor|vector|number line|set of)\b/i;
const AGENT =
  /\b(buys?|bought|sells?|sold|earns?|paid|pays?|travels?|works?|records?|surveys?|plans?|stands?|owns?|rents?|hires?|orders?|visits?|invests?)\b/i;

function looksContextFree(text: string): boolean {
  const words = text
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);
  if (words.length <= 8) return true;
  return MATH_OBJECT.test(text) && !AGENT.test(text);
}

function classify(text: string): ContextCategory | undefined {
  for (const [category, re] of RULES) if (re.test(text)) return category;
  return looksContextFree(text) ? 'none' : undefined;
}

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();
  const qs = await Question.find({ context_category: { $exists: false } })
    .select('stem stimulus parts options')
    .lean<{ _id: unknown; stem: string; stimulus?: string; parts?: { prompt: string }[]; options?: string[] }[]>();

  const counts: Record<string, number> = {};
  let unset = 0;
  for (const q of qs) {
    const text = [q.stimulus ?? '', q.stem, ...(q.parts ?? []).map((p) => p.prompt), ...(q.options ?? [])].join(' ');
    const category = classify(text);
    if (!category) {
      unset++;
      continue;
    }
    counts[category] = (counts[category] ?? 0) + 1;
    if (apply) await Question.updateOne({ _id: q._id }, { $set: { context_category: category } });
  }

  console.log(`${qs.length} question(s) without a setting recorded.`);
  for (const [c, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${c.padEnd(15)} ${n}`);
  console.log(`  ${'(left unset)'.padEnd(15)} ${unset}`);
  console.log(apply ? 'applied' : 'preview only — re-run with --yes');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
