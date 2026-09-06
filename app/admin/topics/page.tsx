import { dbConnect, Blueprint, Topic } from '@/lib/db';
import { ROW } from '../ui';

export const metadata = { title: 'Syllabus & blueprints — ExtraLesson admin' };
export const dynamic = 'force-dynamic';

// Read-only syllabus graph + blueprint viewer (ROUND_1 §2).
export default async function TopicsPage() {
  await dbConnect();
  const [topics, blueprints] = await Promise.all([
    Topic.find()
      .sort({ module: 1, order: 1 })
      .lean<
        {
          module: number;
          code: string;
          title: string;
          order: number;
          objectives: { id: string; text: string; notes?: string }[];
        }[]
      >(),
    Blueprint.find()
      .sort({ paper: 1, module: 1 })
      .lean<
        {
          paper: string;
          module: number;
          allocations: { topic_codes: string[]; items?: number; marks?: number }[];
          profile_split: { CK: number; AK: number; R: number };
        }[]
      >(),
  ]);

  return (
    <div>
        <header className="mb-6">
          <p className="text-[12px] leading-snug text-dim">
            Read only — the seeded syllabus graph and the paper allocations it is built from.
          </p>
        </header>

        <section>
          <h2 className="text-2xl font-black tracking-[-0.015em]">Blueprints (official allocations)</h2>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {blueprints.map((b) => (
              <div key={`${b.paper}-${b.module}`} className="border-[1.5px] border-ink bg-white p-4">
                <div className="section-label">
                  {b.paper} · Module {b.module}
                  <span className="ml-2 text-dim">
                    CK {b.profile_split.CK} / AK {b.profile_split.AK} / R {b.profile_split.R}
                  </span>
                </div>
                <ul className="mt-1 text-sm">
                  {b.allocations.map((a, i) => (
                    <li key={i} className={`flex justify-between ${ROW}`}>
                      <span className="font-mono text-xs">{a.topic_codes.join(' + ')}</span>
                      <span className="font-mono text-xs">
                        {a.items != null ? `${a.items} items` : `${a.marks} marks`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {[1, 2, 3].map((m) => (
          <section key={m} className="mt-8">
            <h2 className="text-2xl font-black tracking-[-0.015em]">Module {m}</h2>
            {topics
              .filter((t) => t.module === m)
              .map((t) => (
                <details key={t.code} className="mt-2 border-[1.5px] border-ink bg-white">
                  <summary className="min-h-11 cursor-pointer p-4 font-bold">
                    <span className="font-mono text-xs text-dim">{t.code}</span> {t.title}
                    <span className="ml-2 font-mono text-xs text-dim">
                      {t.objectives.length} objectives
                    </span>
                  </summary>
                  <ul className="px-4 pb-2">
                    {t.objectives.map((o) => (
                      <li key={o.id} className={`text-sm ${ROW}`}>
                        <span className="font-mono text-xs font-semibold">{o.id}</span> {o.text}
                        {o.notes && <div className="text-xs text-dim">{o.notes}</div>}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
          </section>
        ))}
    </div>
  );
}
