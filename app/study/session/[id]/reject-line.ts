'use server';

import { z } from 'zod';
import { dbConnect, LineRejected, Transcription } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const RejectZ = z.object({
  transcriptionId: z.string().regex(/^[a-f0-9]{24}$/),
  lineIndex: z.number().int().min(0).max(79),
});

/**
 * Takes one read line out of marking. Only while the read is unmarked: once
 * markWorking has run, the marks stand and a dispute is the route.
 */
export async function rejectLine(input: { transcriptionId: string; lineIndex: number }): Promise<{ ok: true } | { error: string }> {
  const auth = await requireSession();
  const parsed = RejectZ.safeParse(input);
  if (!parsed.success) return { error: 'That could not be sent.' };
  const { transcriptionId, lineIndex } = parsed.data;

  await dbConnect();
  const read = await Transcription.findOne({ _id: transcriptionId, student_id: auth.student_id })
    .select('lines marker_version')
    .lean<{ lines: unknown[]; marker_version?: string } | null>();
  if (!read || lineIndex >= read.lines.length) return { error: 'That line could not be found.' };
  if (read.marker_version) return { error: 'This page has been marked; query the mark instead.' };

  try {
    await LineRejected.create({ transcription_id: transcriptionId, line_index: lineIndex });
  } catch (e) {
    if (!(e instanceof Error && /duplicate/i.test(e.message))) throw e;
  }
  return { ok: true };
}

/**
 * Puts a line back (ROUND_7 Task 2): the exclusion is reversible until
 * submit, and after submit the marks stand and a dispute is the route.
 */
export async function restoreLine(input: { transcriptionId: string; lineIndex: number }): Promise<{ ok: true } | { error: string }> {
  const auth = await requireSession();
  const parsed = RejectZ.safeParse(input);
  if (!parsed.success) return { error: 'That could not be sent.' };
  const { transcriptionId, lineIndex } = parsed.data;

  await dbConnect();
  const read = await Transcription.findOne({ _id: transcriptionId, student_id: auth.student_id })
    .select('marker_version')
    .lean<{ marker_version?: string } | null>();
  if (!read) return { error: 'That line could not be found.' };
  if (read.marker_version) return { error: 'This page has been marked; query the mark instead.' };

  await LineRejected.deleteOne({ transcription_id: transcriptionId, line_index: lineIndex });
  return { ok: true };
}
