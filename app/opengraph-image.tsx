import { ImageResponse } from 'next/og';

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
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 900 }}>
          extra<span style={{ color: '#C1121F' }}>lesson</span>
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
