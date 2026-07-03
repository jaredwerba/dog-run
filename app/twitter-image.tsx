import { ImageResponse } from 'next/og';

export const alt = 'Go Dogs Boston — Runners and high-energy dogs, matched';
export const size = { width: 1200, height: 630 };
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
          background: '#2f4f38',
        }}
      >
        <div style={{ fontSize: 140, display: 'flex', marginBottom: 24 }}>🎾</div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            color: '#f6eedd',
            letterSpacing: -1,
          }}
        >
          Go Dogs Boston
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 500,
            color: '#c9d15f',
            marginTop: 20,
          }}
        >
          Runners and high-energy dogs, matched
        </div>
      </div>
    ),
    { ...size }
  );
}
