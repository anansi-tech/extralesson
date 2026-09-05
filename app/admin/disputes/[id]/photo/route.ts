import { NextResponse } from 'next/server';
import { dbConnect, CapturedImage, MarkDispute, Transcription } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

/** The disputed read's own take, while the image is within its TTL; 404 once it has gone. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/.test(id)) return new NextResponse('Not found', { status: 404 });
  await dbConnect();
  const dispute = await MarkDispute.findById(id).select('transcription_id').lean<{ transcription_id: unknown } | null>();
  const readId = dispute?.transcription_id ?? id;
  const read = await Transcription.findById(readId).select('session_id question_index take').lean<{ session_id: unknown; question_index: number; take: number } | null>();
  if (!read) return new NextResponse('Not found', { status: 404 });
  const image = await CapturedImage.findOne({ session_id: read.session_id, question_index: read.question_index, take: read.take }).lean<{ data: Buffer; content_type: string } | null>();
  if (!image) return new NextResponse('photo expired', { status: 404 });
  const bytes = Buffer.from((image.data as unknown as { buffer?: Uint8Array }).buffer ?? image.data);
  return new NextResponse(bytes, { headers: { 'content-type': image.content_type, 'cache-control': 'private, no-store' } });
}
