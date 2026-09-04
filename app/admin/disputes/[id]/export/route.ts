import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { getSession, isAdminEmail } from '@/lib/auth/session';
import { buildGoldenBundle } from '@/lib/golden/bundle';

/** Read-only: the bundle is built in memory and handed to the browser. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !isAdminEmail(session.email)) return new NextResponse('Forbidden', { status: 403 });
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/.test(id)) return new NextResponse('Not found', { status: 404 });
  await dbConnect();
  const bundle = await buildGoldenBundle(id);
  if (!bundle) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(JSON.stringify(bundle, null, 1), {
    headers: {
      'content-type': 'application/json',
      'content-disposition': `attachment; filename="golden-${bundle.id}.json"`,
    },
  });
}
