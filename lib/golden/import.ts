import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { GoldenBundle } from './bundle';
import { transcribeWorking } from '@/lib/grade/transcribe';

/**
 * Appends a bundle to a golden directory in that directory's own style, so
 * the diff is the case and nothing else. Refuses an id already present.
 * The page is RE-READ with the current reader rather than copied from the
 * stored read: the stored one is what the product said at the time, and the
 * transcript here should start from what the reader says now, for a person
 * to correct. Lines the student rejected are dropped from the fresh read too.
 */
export async function importGoldenBundle(bundle: GoldenBundle, dir: string): Promise<{ id: string; files: string[]; reread: boolean }> {
  const setPath = join(dir, 'set.json');
  const reviewPath = join(dir, 'review.json');
  const logPath = join(dir, 'APPROVAL_LOG.md');
  const set = JSON.parse(readFileSync(setPath, 'utf8')) as unknown[];
  const review = JSON.parse(readFileSync(reviewPath, 'utf8')) as { entries: { id: string }[] } & Record<string, unknown>;
  if ((set as { id: string }[]).some((e) => e.id === bundle.id) || review.entries.some((e) => e.id === bundle.id)) {
    throw new Error(`${bundle.id} is already in the golden set`);
  }
  // Style check before anything is written: the serialisers below must give
  // back the files as they are, or the import would reflow them.
  if (serialiseSet(set) !== readFileSync(setPath, 'utf8')) throw new Error('set.json is not in the style this writes');
  if (serialiseReview(review) !== readFileSync(reviewPath, 'utf8')) throw new Error('review.json is not in the style this writes');

  const files: string[] = [];
  if (bundle.image) {
    const imagePath = join(dir, bundle.image.filename);
    if (existsSync(imagePath)) throw new Error(`${bundle.image.filename} already exists`);
    mkdirSync(dirname(imagePath), { recursive: true });
    writeFileSync(imagePath, Buffer.from(bundle.image.base64, 'base64'));
    files.push(bundle.image.filename);
  }
  const reread = bundle.image ? await rereadTranscript(bundle) : null;
  set.push(reread ? { ...bundle.set, transcript: reread } : bundle.set);
  writeFileSync(setPath, serialiseSet(set));
  review.entries.push(bundle.review);
  writeFileSync(reviewPath, serialiseReview(review));
  files.push('set.json', 'review.json');

  const date = bundle.source.exported_at.slice(0, 10);
  const line = `- \`${bundle.id}\`: from a field dispute on ${bundle.source.code}, exported ${date}; every row proposed, ${bundle.source.code} disputed.\n`;
  const log = existsSync(logPath) ? readFileSync(logPath, 'utf8') : '';
  const heading = '## Field cases — proposed';
  writeFileSync(logPath, log.includes(heading) ? log.replace(/\n*$/, '\n') + line : `${log.replace(/\n*$/, '\n')}\n${heading}\n\nExported from /admin/disputes by \`pnpm golden:import\`. Proposed until a person approves them; the loader skips them meanwhile.\n\n${line}`);
  files.push('APPROVAL_LOG.md');
  return { id: bundle.id, files, reread: reread !== null };
}

const flat = (s: string) => s.toLowerCase().replace(/[\s,]/g, '');

async function rereadTranscript(bundle: GoldenBundle): Promise<GoldenBundle['set']['transcript'] | null> {
  try {
    const out = await transcribeWorking({
      image: new Uint8Array(Buffer.from(bundle.image!.base64, 'base64')),
      contentType: bundle.image!.content_type,
      slotRefs: bundle.slot_refs ?? [],
    });
    const rejected = new Set((bundle.rejected_texts ?? []).map(flat));
    return out.transcription.lines
      .filter((l) => !rejected.has(flat(l.text)))
      .map((l) => ({ part_label: l.part_label ?? null, text: l.text }));
  } catch {
    return null;
  }
}

const js = (v: unknown) => JSON.stringify(v);

/** set.json is one-space indented, ASCII-escaped, and ends without a newline. */
export function serialiseSet(set: unknown[]): string {
  return JSON.stringify(set, null, 1).replace(/[^\x00-\x7f]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

/** review.json keeps one mark per line; a plain JSON.stringify would reflow 1,300 lines. */
export function serialiseReview(review: { entries: unknown[] } & Record<string, unknown>): string {
  const out = ['{'];
  for (const k of ['version', 'status', 'reviewer', 'reviewed_at']) out.push(`  "${k}": ${js(review[k])},`);
  out.push('  "entries": [');
  const entries = (review.entries as Record<string, unknown>[]).map((e) => {
    const L = ['    {', `      "id": ${js(e.id)},`, `      "case": ${js(e.case)},`];
    const sa = Object.entries((e.student_answers ?? {}) as Record<string, string>).map(([k, v]) => `${js(k)}: ${js(v)}`).join(', ');
    L.push(`      "student_answers": { ${sa} },`);
    const marks = e.marks as Record<string, unknown>[];
    const trailing = [] as string[];
    if ('human_note' in e) trailing.push(`      "human_note": ${js(e.human_note)}`);
    if ('proposed' in e) trailing.push(`      "proposed": ${js(e.proposed)}`);
    const comma = trailing.length ? ',' : '';
    if (marks.length) {
      L.push('      "marks": [');
      L.push(marks.map((m) => '        { ' + Object.entries(m).map(([k, v]) => `${js(k)}: ${js(v)}`).join(', ') + ' }').join(',\n'));
      L.push('      ]' + comma);
    } else {
      L.push('      "marks": []' + comma);
    }
    L.push(trailing.join(',\n'));
    L.push('    }');
    return L.filter((l) => l !== '').join('\n');
  });
  out.push(entries.join(',\n'));
  out.push('  ]');
  out.push('}');
  return out.join('\n') + '\n';
}
