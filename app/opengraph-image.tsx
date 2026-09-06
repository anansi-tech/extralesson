import { ImageResponse } from 'next/og';
import { LANDING } from '@/lib/landing-content';
import { dbConnect } from '@/lib/db';
import { loadShareLine, type ShareLine } from '@/lib/share-line';

// THE REAL LOCKUP, not a wordmark rebuilt here. Satori takes an image element
// but not inline vector markup, so the lockup is handed over as a data URI,
// drawn from the same three paths app/lockup.tsx gives the headers. Satori has
// no Fraunces, so styled text renders the headline in a generic sans.
import { lockupSvgMarkup } from './lockup';

const LOCKUP = `data:image/svg+xml;base64,${Buffer.from(lockupSvgMarkup()).toString('base64')}`;
/** The cross in the marker's red: an image, so no font has to carry the glyph. */
const CROSS = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><path d="M5 5 L25 25 M25 5 L5 25" stroke="#C1121F" stroke-width="4" stroke-linecap="round" fill="none"/></svg>',
).toString('base64')}`;

export const alt = `ExtraLesson — ${LANDING.headline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

/** The line from the bank; a share image with no line is still the headline. */
async function line(): Promise<ShareLine | null> {
  try {
    await dbConnect();
    return await loadShareLine();
  } catch {
    return null;
  }
}

/**
 * THE SHARE IMAGE (ROUND_9 Task 8; Share and Icon.dc.html §10): the paper,
 * the margin rule, the lockup, the h1 as it stands, one marked line from
 * an approved question, and the domain. All from landing-content.ts and the
 * bank, so a copy change cannot strand it. No hand font: the app makes no
 * third-party font request, and satori cannot read the self-hosted one.
 */
export default async function OgImage() {
  const marked = await line();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: 'repeating-linear-gradient(to bottom, #FBF7EE, #FBF7EE 47px, #C9D6E8 47px, #C9D6E8 48px)',
          color: '#1E2430',
        }}
      >
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 88, width: 2, background: '#E4B8B4', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 64, left: 112, right: 64, bottom: 64, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <img src={LOCKUP} width={260} height={68} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 84, fontWeight: 900, lineHeight: 1.0, letterSpacing: -2.5 }}>{LANDING.headline}</div>
            {marked && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 36 }}>
                <span style={{ fontSize: 44, color: '#2A3550', lineHeight: 1 }}>{marked.wrote}</span>
                <img src={CROSS} width={30} height={30} alt="" />
                <span style={{ fontSize: 38, color: '#C1121F', lineHeight: 1 }}>{marked.slip}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, letterSpacing: 1.6, color: '#6E7687', textTransform: 'uppercase' }}>
            <span>CSEC Mathematics practice</span>
            <span style={{ color: '#1E2430' }}>{LANDING.domain}</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
