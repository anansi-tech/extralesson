// Move the approved bank onto the measured setting convention (R1.8 Part 0).
//
// A real paper names no country and no city: sixteen territories sit it, and a
// stem set in one of them is a stem about one of them. Ours named a place in 33
// of 131 approved questions, and named the same two places in 27 of those.
//
// This is a mechanical conversion because the place is almost always a
// removable phrase — "At a school fair IN SAINT LUCIA, a youth group..." — and
// what is left is exactly the generic setting the papers use. Where it is not
// removable the question is left alone and reported, to be regenerated instead.
//
// Previews by default; --yes applies. Run: pnpm tsx scripts/strip-place-names.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';

const PLACE =
  '(?:Castries|Grenada|Saint Lucia|St\\.? Lucia|Kingston|Bridgetown|Barbados|Jamaica|Trinidad|Tobago|Guyana|Georgetown|Port of Spain|Antigua|Dominica|St\\.? Vincent|Belize|Nassau|Bahamas|Gros Islet|Soufriere|Vieux Fort|Roseau|Basseterre)';

// "…in Saint Lucia," -> "…," and "…in Grenada." -> "…." The place sits in a
// prepositional phrase that the sentence does not need.
const IN_PLACE = new RegExp(`\\s+(?:in|from|at|across|around|near|on)\\s+${PLACE}\\b`, 'gi');

// "At a Castries electronics stall" -> "At an electronics stall": the place is
// an adjective on the setting, and the article has to agree with whatever noun
// it now meets. The noun is captured rather than looked ahead at, so the
// article is rewritten ONLY where a word was removed between the two — a
// field-wide sweep would "correct" a unit vector into an unit vector.
const ADJECTIVAL = new RegExp(`\\b(a|an|the)\\s+${PLACE}\\s+([a-z][\\w-]*)`, 'gi');

// Vowel LETTER, not vowel sound: every noun our settings use ("electronics",
// "craft", "island") agrees on the letter, and a pronunciation dictionary is
// not something this script should be carrying.
const VOWEL = /^[aeiou]/i;

function agree(article: string, word: string): string {
  if (article.toLowerCase() === 'the') return `${article} ${word}`;
  const wanted = VOWEL.test(word) ? 'an' : 'a';
  const cased = article[0] === article[0].toUpperCase() ? `${wanted[0].toUpperCase()}${wanted.slice(1)}` : wanted;
  return `${cased} ${word}`;
}

/** One field's worth of prose, with the place taken out of the setting. */
export function stripPlaces(text: string): string {
  const out = text
    .replace(IN_PLACE, '')
    .replace(ADJECTIVAL, (_m, article: string, word: string) => agree(article, word));
  return out === text ? text : out.replace(/\s+([,.;:])/g, '$1').replace(/[ \t]{2,}/g, ' ');
}

/** Anything left after stripping — a place we cannot remove mechanically. */
const REMAINING = new RegExp(`\\b${PLACE}\\b`, 'i');

const FIELDS = ['stimulus', 'stem', 'worked_solution', 'parts', 'options', 'misconceptions'] as const;

function migrate(q: Record<string, unknown>): {
  changed: boolean;
  doc: Record<string, unknown>;
  leftover: boolean;
} {
  let changed = false;
  const fix = (v: unknown): unknown => {
    if (typeof v === 'string') {
      const next = stripPlaces(v);
      if (next !== v) changed = true;
      return next;
    }
    if (Array.isArray(v)) return v.map(fix);
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, fix(val)]));
    }
    return v;
  };

  const doc: Record<string, unknown> = {};
  for (const field of FIELDS) {
    if (q[field] === undefined) continue;
    doc[field] = fix(q[field]);
  }
  // A place surviving in prose the student reads is what sends a question back
  // for regeneration; the word GRENADA inside a sets question is a string of
  // letters, not a setting, and is deliberately not matched above.
  const prose = [doc.stimulus, doc.stem].filter((v) => typeof v === 'string').join(' ');
  return { changed, doc, leftover: REMAINING.test(prose) };
}

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();

  const qs = await Question.find({ status: 'approved' }).lean<Record<string, unknown>[]>();
  let touched = 0;
  const stubborn: string[] = [];
  const samples: string[] = [];

  for (const q of qs) {
    const { changed, doc, leftover } = migrate(q);
    if (leftover) stubborn.push(`${String(q._id)}: ${String(q.stem).replace(/\s+/g, ' ').slice(0, 90)}`);
    if (!changed) continue;
    touched++;
    if (samples.length < 6) {
      const before = String(q.stimulus ?? q.stem).replace(/\s+/g, ' ').slice(0, 78);
      const after = String(doc.stimulus ?? doc.stem).replace(/\s+/g, ' ').slice(0, 78);
      if (before !== after) samples.push(`  before: ${before}\n  after:  ${after}`);
    }
    if (apply) await Question.updateOne({ _id: q._id }, { $set: doc });
  }

  for (const s of samples) console.log(s);
  console.log(`\n${touched} of ${qs.length} approved questions had a place name removed.`);
  if (stubborn.length) {
    console.log(`\n${stubborn.length} still name a place and need regenerating:`);
    for (const s of stubborn) console.log(`  ${s}`);
  }
  console.log(apply ? 'applied' : 'preview only — re-run with --yes');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
