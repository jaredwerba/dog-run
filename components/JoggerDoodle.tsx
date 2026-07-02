'use client';

import { useEffect, useId, useState } from 'react';

/*
 * Hand-drawn doodle: a man jogging behind a very determined English bulldog.
 * All colors from the Go Dogs Boston palette. The whole scene runs through an
 * animated turbulence filter ("squigglevision") so the linework boils like a
 * hand-drawn cartoon.
 */

const SOIL = '#362b1f';
const OAT = '#f6eedd';
const LINEN = '#fbf6ea';
const PINE = '#2f4f38';
const BARK = '#5a4534';
const CLAY = '#bd6b44';
const TENNIS = '#c9d15f';

export default function JoggerDoodle({ className = '' }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const boilId = `boil-${uid}`;
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <svg
      viewBox="0 0 540 270"
      className={className}
      role="img"
      aria-label="Hand-drawn doodle of a runner jogging behind a determined English bulldog on a leash"
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .jd-bob { animation: jd-bob 0.5s ease-in-out infinite alternate; }
          .jd-bob-dog { animation: jd-bob 0.32s ease-in-out infinite alternate; }
          .jd-leg-f { animation: jd-swing 0.5s ease-in-out infinite alternate; }
          .jd-leg-b { animation: jd-swing 0.5s ease-in-out infinite alternate; animation-delay: -0.5s; }
          .jd-arm-f { animation: jd-swing-s 0.5s ease-in-out infinite alternate; animation-delay: -0.5s; }
          .jd-arm-b { animation: jd-swing-s 0.5s ease-in-out infinite alternate; }
          .jd-dleg-a { animation: jd-dswing 0.28s ease-in-out infinite alternate; }
          .jd-dleg-b { animation: jd-dswing 0.28s ease-in-out infinite alternate; animation-delay: -0.28s; }
          .jd-tail { animation: jd-wag 0.18s ease-in-out infinite alternate; }
          .jd-ear { animation: jd-flap 0.3s ease-in-out infinite alternate; }
          .jd-tongue { animation: jd-lick 0.26s ease-in-out infinite alternate; }
          .jd-lines path { animation: jd-dash 0.4s linear infinite; }
          .jd-sweat { animation: jd-sweat 0.9s ease-out infinite; }
          .jd-puff { animation: jd-puff 0.6s ease-out infinite; }
        }
        @keyframes jd-bob { to { transform: translateY(-5px); } }
        @keyframes jd-swing { from { transform: rotate(24deg); } to { transform: rotate(-24deg); } }
        @keyframes jd-swing-s { from { transform: rotate(18deg); } to { transform: rotate(-18deg); } }
        @keyframes jd-dswing { from { transform: rotate(30deg); } to { transform: rotate(-30deg); } }
        @keyframes jd-wag { from { transform: rotate(-24deg); } to { transform: rotate(22deg); } }
        @keyframes jd-flap { from { transform: rotate(-14deg); } to { transform: rotate(10deg); } }
        @keyframes jd-lick { from { transform: rotate(7deg); } to { transform: rotate(-9deg) scaleY(1.12); } }
        @keyframes jd-dash { to { stroke-dashoffset: -36; } }
        @keyframes jd-sweat { from { transform: translate(0, 0); opacity: 0.9; } to { transform: translate(-10px, -12px); opacity: 0; } }
        @keyframes jd-puff { from { transform: scale(0.5); opacity: 0.5; } to { transform: scale(1.3); opacity: 0; } }
      `}</style>

      <defs>
        <filter id={boilId} x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="2" result="n">
            {animate && (
              <animate
                attributeName="baseFrequency"
                values="0.013;0.017;0.011"
                dur="0.45s"
                calcMode="discrete"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g filter={`url(#${boilId})`}>
        {/* trail */}
        <path
          d="M18 234 Q 90 228 160 233 T 300 231 T 440 233 T 528 230"
          fill="none"
          stroke={SOIL}
          strokeOpacity="0.3"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="2 13"
        />

        {/* motion lines */}
        <g className="jd-lines" stroke={SOIL} strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="10 8">
          <path d="M78 96 h32" />
          <path d="M66 122 h40" />
          <path d="M80 148 h28" />
          <path d="M282 150 h28" />
          <path d="M272 174 h36" />
        </g>

        {/* dust puffs */}
        <g fill="none" stroke={SOIL} strokeOpacity="0.35" strokeWidth="2.5">
          <circle className="jd-puff" cx="132" cy="218" r="6" style={{ transformOrigin: '132px 218px', transformBox: 'view-box' }} />
          <circle className="jd-puff" cx="312" cy="214" r="5" style={{ transformOrigin: '312px 214px', transformBox: 'view-box', animationDelay: '-0.3s' }} />
        </g>

        {/* ───────────── MAN ───────────── */}
        <g className="jd-bob">
          {/* back arm */}
          <g className="jd-arm-b" style={{ transformOrigin: '196px 104px', transformBox: 'view-box' }}>
            <path d="M196 104 L171 122 L158 137" fill="none" stroke={SOIL} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {/* back leg */}
          <g className="jd-leg-b" style={{ transformOrigin: '180px 150px', transformBox: 'view-box' }}>
            <path d="M180 150 L152 172 L139 200" fill="none" stroke={SOIL} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx="133" cy="203" rx="9" ry="5.5" fill={BARK} stroke={SOIL} strokeWidth="2.5" transform="rotate(-32 133 203)" />
          </g>

          {/* torso (shirt) */}
          <path
            d="M197 92 Q216 95 212 118 Q208 140 191 153 Q175 158 168 147 Q163 122 177 103 Q186 93 197 92 Z"
            fill={CLAY}
            stroke={SOIL}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* shorts */}
          <path
            d="M190 148 Q198 158 192 169 Q180 176 168 169 Q160 158 169 146 Q180 156 190 148 Z"
            fill={PINE}
            stroke={SOIL}
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* front leg */}
          <g className="jd-leg-f" style={{ transformOrigin: '180px 150px', transformBox: 'view-box' }}>
            <path d="M182 152 L213 176 L219 207" fill="none" stroke={SOIL} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx="226" cy="210" rx="9.5" ry="5.5" fill={BARK} stroke={SOIL} strokeWidth="2.5" transform="rotate(10 226 210)" />
          </g>

          {/* head */}
          <circle cx="207" cy="72" r="19" fill={OAT} stroke={SOIL} strokeWidth="3.5" />
          {/* hair scribbles */}
          <path d="M193 58 q-3 -7 3 -11 M199 54 q-1 -7 5 -9 M206 52 q2 -6 7 -6" fill="none" stroke={SOIL} strokeWidth="2.5" strokeLinecap="round" />
          {/* sweatband */}
          <path d="M190 61 Q207 51 224 61 L222 68 Q207 59 192 68 Z" fill={TENNIS} stroke={SOIL} strokeWidth="2.5" strokeLinejoin="round" />
          {/* face */}
          <circle cx="217" cy="72" r="2.4" fill={SOIL} />
          <path d="M213 66 q4 -2 7 0" fill="none" stroke={SOIL} strokeWidth="2" strokeLinecap="round" />
          <path d="M221 80 Q217 87 210 84" fill="none" stroke={SOIL} strokeWidth="2.8" strokeLinecap="round" />
          {/* flying sweat */}
          <g fill={LINEN} stroke={SOIL} strokeWidth="2">
            <circle className="jd-sweat" cx="185" cy="52" r="3.2" style={{ transformOrigin: '185px 52px', transformBox: 'view-box' }} />
            <circle className="jd-sweat" cx="180" cy="66" r="2.6" style={{ transformOrigin: '180px 66px', transformBox: 'view-box', animationDelay: '-0.45s' }} />
          </g>

          {/* front arm — holds the leash */}
          <g className="jd-arm-f" style={{ transformOrigin: '199px 103px', transformBox: 'view-box' }}>
            <path d="M199 103 L228 115 L249 106" fill="none" stroke={SOIL} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="251" cy="105" r="4.5" fill={SOIL} />
          </g>
        </g>

        {/* leash — taut, the bulldog is doing the leading */}
        <path d="M251 106 Q350 128 440 154" fill="none" stroke={BARK} strokeWidth="3.5" strokeLinecap="round" />

        {/* ───────────── BULLDOG ───────────── */}
        <g className="jd-bob-dog">
          {/* tail nub */}
          <g className="jd-tail" style={{ transformOrigin: '334px 168px', transformBox: 'view-box' }}>
            <path d="M334 168 q-11 -5 -7 -15" fill="none" stroke={SOIL} strokeWidth="5.5" strokeLinecap="round" />
          </g>

          {/* back legs */}
          <g className="jd-dleg-a" style={{ transformOrigin: '352px 194px', transformBox: 'view-box' }}>
            <path d="M352 194 L343 218" fill="none" stroke={SOIL} strokeWidth="7" strokeLinecap="round" />
          </g>
          <g className="jd-dleg-b" style={{ transformOrigin: '368px 196px', transformBox: 'view-box' }}>
            <path d="M368 196 L375 218" fill="none" stroke={SOIL} strokeWidth="7" strokeLinecap="round" />
          </g>

          {/* body */}
          <path
            d="M330 168 Q328 147 353 141 Q392 131 428 139 Q456 145 458 170 Q459 194 435 200 Q396 208 358 202 Q332 197 330 168 Z"
            fill={OAT}
            stroke={SOIL}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* bark patch on back */}
          <path
            d="M360 140 Q384 131 407 137 Q402 154 378 156 Q363 152 360 140 Z"
            fill={BARK}
            stroke={SOIL}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* front legs */}
          <g className="jd-dleg-b" style={{ transformOrigin: '420px 196px', transformBox: 'view-box' }}>
            <path d="M420 196 L413 220" fill="none" stroke={SOIL} strokeWidth="7" strokeLinecap="round" />
          </g>
          <g className="jd-dleg-a" style={{ transformOrigin: '438px 194px', transformBox: 'view-box' }}>
            <path d="M438 194 L446 218" fill="none" stroke={SOIL} strokeWidth="7" strokeLinecap="round" />
          </g>

          {/* collar */}
          <path d="M433 152 Q448 160 446 178" fill="none" stroke={PINE} strokeWidth="7.5" strokeLinecap="round" />

          {/* head */}
          <g>
            {/* ear (behind head edge) */}
            <g className="jd-ear" style={{ transformOrigin: '447px 122px', transformBox: 'view-box' }}>
              <path d="M443 125 Q436 109 449 107 Q458 111 454 125 Z" fill={BARK} stroke={SOIL} strokeWidth="2.5" strokeLinejoin="round" />
            </g>
            <circle cx="463" cy="148" r="30" fill={OAT} stroke={SOIL} strokeWidth="3.5" />
            {/* bark patch over eye */}
            <path d="M448 121 Q436 132 440 146 Q450 150 458 143 Q462 128 448 121 Z" fill={BARK} stroke={SOIL} strokeWidth="2.5" strokeLinejoin="round" />
            {/* jowls */}
            <path d="M451 158 Q452 178 464 177 Q474 176 472 162" fill={OAT} stroke={SOIL} strokeWidth="2.8" strokeLinejoin="round" />
            {/* underbite teeth */}
            <rect x="459" y="166" width="6" height="7" rx="1.5" fill={LINEN} stroke={SOIL} strokeWidth="1.8" />
            <rect x="468" y="164" width="5.5" height="7" rx="1.5" fill={LINEN} stroke={SOIL} strokeWidth="1.8" />
            {/* nose + wrinkles */}
            <path d="M484 138 q8 3 6 10 q-6 4 -10 -1 q-2 -6 4 -9 Z" fill={SOIL} />
            <path d="M468 132 q9 -5 16 1 M470 152 q7 3 12 0" fill="none" stroke={SOIL} strokeWidth="2.2" strokeLinecap="round" />
            {/* derpy eyes */}
            <circle cx="452" cy="136" r="3.4" fill={SOIL} />
            <circle cx="473" cy="130" r="2.6" fill={SOIL} />
            <path d="M446 128 q4 -3 8 -1" fill="none" stroke={SOIL} strokeWidth="2" strokeLinecap="round" />
            {/* tongue */}
            <g className="jd-tongue" style={{ transformOrigin: '480px 160px', transformBox: 'view-box' }}>
              <path d="M478 159 Q494 164 490 180 Q486 189 477 183 Q471 169 478 159 Z" fill={CLAY} stroke={SOIL} strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M482 166 q2 6 1 11" fill="none" stroke={SOIL} strokeWidth="1.6" strokeLinecap="round" />
            </g>
          </g>

          {/* collar tag */}
          <circle cx="445" cy="183" r="5.5" fill={TENNIS} stroke={SOIL} strokeWidth="2.2" />
        </g>
      </g>
    </svg>
  );
}
