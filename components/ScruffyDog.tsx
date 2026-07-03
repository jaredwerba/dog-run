'use client';

import { useEffect, useId, useState } from 'react';

/*
 * A scruffy, goofy, obviously hand-drawn mutt: sitting, tongue out, tail
 * wagging like mad. Same recipe as JoggerDoodle — soil outlines, flat palette
 * fills, squigglevision boil filter, CSS keyframe part-animations.
 */

const SOIL = '#362b1f';
const OAT = '#f6eedd';
const LINEN = '#fbf6ea';
const BARK = '#5a4534';
const CLAY = '#bd6b44';

export default function ScruffyDog({ className = '' }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const boilId = `sd-boil-${uid}`;
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <svg
      viewBox="0 0 210 190"
      className={className}
      role="img"
      aria-label="Hand-drawn doodle of a scruffy dog sitting with its tongue out, wagging its tail"
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .sd-tail { animation: sd-wag 0.16s ease-in-out infinite alternate; }
          .sd-tongue { animation: sd-loll 0.34s ease-in-out infinite alternate; }
          .sd-head { animation: sd-tilt 4.2s ease-in-out infinite; }
          .sd-ear-flop { animation: sd-flop 0.9s ease-in-out infinite alternate; }
          .sd-body { animation: sd-breathe 1.6s ease-in-out infinite alternate; }
        }
        @keyframes sd-wag { from { transform: rotate(-28deg); } to { transform: rotate(26deg); } }
        @keyframes sd-loll { from { transform: rotate(4deg) scaleY(1); } to { transform: rotate(-6deg) scaleY(1.14); } }
        @keyframes sd-tilt {
          0%, 55%, 100% { transform: rotate(0deg); }
          65%, 85% { transform: rotate(7deg); }
        }
        @keyframes sd-flop { from { transform: rotate(-4deg); } to { transform: rotate(7deg); } }
        @keyframes sd-breathe { from { transform: scale(1); } to { transform: scale(1.015); } }
      `}</style>

      <defs>
        <filter id={boilId} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" result="n">
            {animate && (
              <animate
                attributeName="baseFrequency"
                values="0.016;0.021;0.013"
                dur="0.42s"
                calcMode="discrete"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g filter={`url(#${boilId})`}>
        {/* tail — big, scruffy, wagging like mad */}
        <g className="sd-tail" style={{ transformOrigin: '42px 128px', transformBox: 'view-box' }}>
          <path
            d="M44 130 Q28 118 24 100 Q22 90 30 84 Q28 94 34 100 Q30 88 38 82 Q36 94 42 102 Q40 90 48 88 Q42 100 48 112 Q50 122 44 130 Z"
            fill={BARK}
            stroke={SOIL}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>

        {/* haunch (sitting rear) */}
        <path
          d="M42 132 Q40 106 62 98 Q88 92 98 112 Q104 132 96 152 Q90 168 68 168 Q46 166 42 148 Q41 140 42 132 Z"
          fill={OAT}
          stroke={SOIL}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* back paw + curled hind leg */}
        <ellipse cx="80" cy="167" rx="13" ry="6" fill={OAT} stroke={SOIL} strokeWidth="3" />
        <path d="M58 126 Q76 128 82 148" fill="none" stroke={SOIL} strokeWidth="2.6" strokeLinecap="round" />

        {/* body/chest — scraggly back line */}
        <g className="sd-body" style={{ transformOrigin: '120px 150px', transformBox: 'view-box' }}>
          <path
            d="M88 110 Q92 92 108 84 L112 90 L116 82 L121 89 L126 80 L130 88
               Q142 84 150 92 Q160 102 158 122 Q157 142 152 156 Q149 166 138 167
               L104 167 Q92 164 88 148 Q85 128 88 110 Z"
            fill={OAT}
            stroke={SOIL}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* linen chest patch */}
          <path
            d="M122 108 Q136 112 138 130 Q139 148 132 160 Q120 158 116 144 Q112 124 122 108 Z"
            fill={LINEN}
            stroke={SOIL}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </g>

        {/* front legs */}
        <path d="M124 126 L120 164" fill="none" stroke={SOIL} strokeWidth="6.5" strokeLinecap="round" />
        <path d="M144 124 L146 164" fill="none" stroke={SOIL} strokeWidth="6.5" strokeLinecap="round" />
        <ellipse cx="118" cy="167" rx="10" ry="5.5" fill={OAT} stroke={SOIL} strokeWidth="2.8" />
        <ellipse cx="149" cy="167" rx="10" ry="5.5" fill={OAT} stroke={SOIL} strokeWidth="2.8" />

        {/* head — big, goofy, scruff spikes */}
        <g className="sd-head" style={{ transformOrigin: '138px 92px', transformBox: 'view-box' }}>
          {/* upright ear */}
          <path
            d="M112 42 Q106 20 118 14 Q128 12 130 30 Q130 40 124 46 Z"
            fill={BARK}
            stroke={SOIL}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* flopped ear (behind the skull, peeking out right) */}
          <g className="sd-ear-flop" style={{ transformOrigin: '160px 48px', transformBox: 'view-box' }}>
            <path
              d="M158 46 Q178 42 184 58 Q188 74 176 80 Q166 80 162 66 Q158 54 158 46 Z"
              fill={BARK}
              stroke={SOIL}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
          {/* skull with scruff */}
          <path
            d="M110 60 L104 52 L112 54 L110 44 L119 50 L120 38 L128 48 L134 36 L139 48 L148 40 L149 52 L158 48 L155 58
               Q168 64 170 78 Q172 94 160 102 Q146 110 128 106 Q112 102 108 86 Q106 70 110 60 Z"
            fill={OAT}
            stroke={SOIL}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* bark patch over left eye */}
          <path
            d="M112 58 Q104 68 108 80 Q116 84 124 78 Q128 66 122 58 Q116 54 112 58 Z"
            fill={BARK}
            stroke={SOIL}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* muzzle */}
          <path
            d="M158 74 Q176 72 182 82 Q186 92 176 96 Q164 100 156 94 Q152 84 158 74 Z"
            fill={LINEN}
            stroke={SOIL}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* nose */}
          <path d="M180 78 q8 2 6 9 q-6 4 -10 -1 q-2 -5 4 -8 Z" fill={SOIL} />
          {/* happy squinty eyes ^ ^ */}
          <path d="M115 70 q4 -5 8 0" fill="none" stroke={SOIL} strokeWidth="2.8" strokeLinecap="round" />
          <path d="M140 66 q4 -5 8 0" fill="none" stroke={SOIL} strokeWidth="2.8" strokeLinecap="round" />
          {/* open smile */}
          <path d="M158 96 Q166 104 176 98" fill="none" stroke={SOIL} strokeWidth="2.8" strokeLinecap="round" />
          {/* tongue */}
          <g className="sd-tongue" style={{ transformOrigin: '164px 100px', transformBox: 'view-box' }}>
            <path
              d="M160 98 Q158 116 164 124 Q172 128 176 118 Q178 106 172 99 Q166 96 160 98 Z"
              fill={CLAY}
              stroke={SOIL}
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            <path d="M167 104 q1 8 2 13" fill="none" stroke={SOIL} strokeWidth="1.6" strokeLinecap="round" />
          </g>
          {/* cheek scruff */}
          <path d="M110 90 l-7 3 M111 96 l-6 5" fill="none" stroke={SOIL} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
