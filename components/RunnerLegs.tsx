'use client';

import { useEffect, useId, useState } from 'react';

/*
 * A pair of hand-drawn legs churning mid-stride — the runner's half of the
 * duo. Same squigglevision recipe as JoggerDoodle/ScruffyDog.
 */

const SOIL = '#362b1f';
const OAT = '#f6eedd';
const PINE = '#2f4f38';
const BARK = '#5a4534';
const CLAY = '#bd6b44';

export default function RunnerLegs({ className = '' }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const boilId = `rl-boil-${uid}`;
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <svg
      viewBox="0 0 160 200"
      className={className}
      role="img"
      aria-label="Hand-drawn doodle of a runner's legs churning mid-stride"
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .rl-leg-front { animation: rl-front 0.34s ease-in-out infinite alternate; }
          .rl-leg-back { animation: rl-back 0.34s ease-in-out infinite alternate; }
          .rl-shorts { animation: rl-bob 0.34s ease-in-out infinite alternate; }
          .rl-lines path { animation: rl-dash 0.3s linear infinite; }
        }
        @keyframes rl-front { from { transform: rotate(-34deg); } to { transform: rotate(30deg); } }
        @keyframes rl-back { from { transform: rotate(30deg); } to { transform: rotate(-34deg); } }
        @keyframes rl-bob { from { transform: translateY(0); } to { transform: translateY(-6px); } }
        @keyframes rl-dash { to { stroke-dashoffset: -26; } }
      `}</style>

      <defs>
        <filter id={boilId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.017" numOctaves="2" result="n">
            {animate && (
              <animate attributeName="baseFrequency" values="0.017;0.021;0.014" dur="0.4s" calcMode="discrete" repeatCount="indefinite" />
            )}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g filter={`url(#${boilId})`}>
        {/* motion lines */}
        <g className="rl-lines" stroke={SOIL} strokeOpacity="0.35" strokeWidth="2.6" strokeLinecap="round" fill="none" strokeDasharray="8 6">
          <path d="M10 60 h26" />
          <path d="M4 84 h30" />
          <path d="M14 108 h22" />
        </g>

        {/* back leg */}
        <g className="rl-leg-back" style={{ transformOrigin: '80px 96px', transformBox: 'view-box' }}>
          <path d="M80 96 L64 140 L58 168" fill="none" stroke={SOIL} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="52" cy="172" rx="13" ry="7" fill={BARK} stroke={SOIL} strokeWidth="3" transform="rotate(-18 52 172)" />
        </g>

        {/* shorts / hip */}
        <g className="rl-shorts">
          <path
            d="M62 78 Q80 70 100 78 Q106 92 100 104 Q80 112 62 104 Q56 92 62 78 Z"
            fill={PINE}
            stroke={SOIL}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </g>

        {/* front leg */}
        <g className="rl-leg-front" style={{ transformOrigin: '86px 98px', transformBox: 'view-box' }}>
          <path d="M86 98 L108 132 L118 164" fill="none" stroke={SOIL} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="126" cy="167" rx="14" ry="7.5" fill={CLAY} stroke={SOIL} strokeWidth="3" transform="rotate(14 126 167)" />
        </g>
      </g>
    </svg>
  );
}
