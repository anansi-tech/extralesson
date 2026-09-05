import { ImageResponse } from 'next/og';

// THE REAL LOCKUP, not a wordmark rebuilt here. Satori takes an image element
// but not inline vector markup, so the lockup is handed over as a data URI,
// drawn from the same three paths app/lockup.tsx gives the headers. Satori has
// no Fraunces, so styled text renders the wordmark in a generic sans.
import { lockupSvgMarkup } from './lockup';

const LOCKUP = `data:image/svg+xml;base64,${Buffer.from(lockupSvgMarkup()).toString('base64')}`;

export const alt = 'ExtraLesson — Practise CSEC Maths the way you’ll sit it. Marked in red pen.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background:
            'repeating-linear-gradient(to bottom, #FBF7EE 0 62px, #C9D6E8 62px 64px)',
          color: '#1E2430',
          fontSize: 40,
        }}
      >
        <img src={LOCKUP} width={306} height={80} alt="" />
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 900, lineHeight: 1.05, marginTop: 30 }}>
          Practise CSEC Maths
        </div>
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 900, lineHeight: 1.05 }}>
          the way you’ll sit it.
        </div>
        <div style={{ display: 'flex', fontSize: 56, fontWeight: 900, color: '#C1121F', marginTop: 10 }}>
          Marked in red pen.
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#6E7687', marginTop: 30 }}>
          CSEC Mathematics · marked the way examiners award marks — step by step
        </div>
      </div>
    ),
    size,
  );
}
