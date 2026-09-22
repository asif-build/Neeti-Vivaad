import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Neeti Saarthi — Learn, Grow & Practise Better Decisions';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#070d18',
          backgroundImage: 'radial-gradient(circle at 50% 30%, #0F766E 0%, #070d18 70%)',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#FEF3C7',
            border: '2px solid #111',
            borderRadius: '999px',
            padding: '8px 24px',
            marginBottom: '28px',
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#111', letterSpacing: '0.1em' }}>
            ★ OFFICIAL PORTAL &bull; SKILL INTELLIGENCE
          </span>
        </div>

        <h1
          style={{
            fontSize: '64px',
            fontWeight: 900,
            color: '#FFFFFF',
            textAlign: 'center',
            letterSpacing: '-0.02em',
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
          }}
        >
          Neeti Saarthi
        </h1>

        <p
          style={{
            fontSize: '26px',
            fontWeight: 500,
            color: '#2DD4BF',
            textAlign: 'center',
            margin: '0 0 32px 0',
            maxWidth: '900px',
          }}
        >
          Your Skills. Your Growth. Your Next Step.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '12px',
          }}
        >
          <div
            style={{
              backgroundColor: '#F8F7F2',
              border: '2px solid #111',
              borderRadius: '16px',
              padding: '12px 24px',
              fontSize: '18px',
              fontWeight: 800,
              color: '#111',
            }}
          >
            My Profile
          </div>
          <div
            style={{
              backgroundColor: '#F2A900',
              border: '2px solid #111',
              borderRadius: '16px',
              padding: '12px 24px',
              fontSize: '18px',
              fontWeight: 800,
              color: '#111',
            }}
          >
            Curated Courses
          </div>
          <div
            style={{
              backgroundColor: '#14B8A6',
              border: '2px solid #111',
              borderRadius: '16px',
              padding: '12px 24px',
              fontSize: '18px',
              fontWeight: 800,
              color: '#111',
            }}
          >
            Knowledge Check
          </div>
          <div
            style={{
              backgroundColor: '#FEF3C7',
              border: '2px solid #111',
              borderRadius: '16px',
              padding: '12px 24px',
              fontSize: '18px',
              fontWeight: 800,
              color: '#111',
            }}
          >
            Neeti Vivaad
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
