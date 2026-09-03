import { Question } from '@/lib/db';

// The queue hands out the next draft and nothing else, so one box has to reopen
// a named question: scripts print ids by their last six characters, so a term
// shaped like part of an id is matched as one, everything else as text.
export interface FoundQuestion {
  id: string;
  status: string;
  kind: string;
  module: number;
  marks: number;
  preview: string;
}

const HEX = /^[a-f0-9]{4,24}$/i;

export async function findQuestions(query: string, limit = 25): Promise<FoundQuestion[]> {
  const term = query.trim();
  if (!term) return [];

  // An id, whole or by its tail — `$regex` on _id needs the id as a string, so
  // the match is done with $expr over its string form.
  const filter = HEX.test(term)
    ? { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: `${term.toLowerCase()}$` } } }
    : {
        $or: [
          { stem: { $regex: term, $options: 'i' } },
          { stimulus: { $regex: term, $options: 'i' } },
          { 'parts.prompt': { $regex: term, $options: 'i' } },
          { worked_solution: { $regex: term, $options: 'i' } },
        ],
      };

  const rows = await Question.find(filter)
    .select('status kind module marks stem stimulus')
    .limit(limit)
    .lean<{ _id: unknown; status: string; kind: string; module: number; marks: number; stem: string; stimulus?: string }[]>();

  return rows.map((r) => ({
    id: String(r._id),
    status: r.status,
    kind: r.kind,
    module: r.module,
    marks: r.marks,
    preview: (r.stimulus || r.stem).replace(/\$[^$]*\$/g, '…').replace(/\s+/g, ' ').slice(0, 96),
  }));
}
