import { ImageResponse } from 'next/og';

// THE MARK, INLINE.
//
// It is one path, and it is drawn here rather than read from
// public/brand/mark.svg because a serverless bundle traces imports, not stray
// file reads — a runtime read of public/ is the kind of thing that works in
// dev and returns nothing in production. The copy is pinned by
// tests/brand.test.ts, which fails if this and the source drawing diverge, so
// the duplication cannot go stale quietly.
const MARK_PATH = 'M6 44 L30 68 L62 12 L96 12';
const MARK_RED = '#C1121F';
const mark = (stroke: number) =>
  `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path d="${MARK_PATH}" fill="none" stroke="${MARK_RED}" stroke-width="${stroke}" stroke-linecap="butt" stroke-linejoin="miter"/></svg>`,
  ).toString('base64')}`;

export const alt = 'ExtraLesson — Your child’s own CXC examiner. In red pen.';
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
        {/* Symbol then wordmark, the horizontal lockup's own order. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <img src={mark(11)} width={86} height={86} alt="" />
          <span style={{ display: 'flex', fontSize: 44, fontWeight: 900 }}>
            extra<span style={{ color: '#C1121F' }}>lesson</span>
          </span>
        </div>
        <div style={{ display: 'flex', fontSize: 92, fontWeight: 900, lineHeight: 1.05, marginTop: 30 }}>
          Your child&rsquo;s own CXC examiner.
        </div>
        <div style={{ display: 'flex', fontSize: 92, fontWeight: 900, color: '#C1121F' }}>
          In red pen.
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#6E7687', marginTop: 30 }}>
          CSEC Mathematics · marked the way examiners award marks — step by step
        </div>
      </div>
    ),
    size,
  );
}
