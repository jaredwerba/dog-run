'use client';

import { useEffect, useId, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/*
 * Full-screen "it's a match" moment when a run gets booked: a hand-drawn hand
 * reaches in and pets the dog, the tail wags like mad, and hearts float up.
 * Same squigglevision recipe as the other doodles. Auto-dismisses; tap to skip.
 */

const SOIL = '#362b1f';
const OAT = '#f6eedd';
const LINEN = '#fbf6ea';
const BARK = '#5a4534';
const CLAY = '#bd6b44';
const TENNIS = '#c9d15f';

function Heart({ x, y, delay, size = 22, color = CLAY }: { x: number; y: number; delay: number; size?: number; color?: string }) {
  return (
    <g
      className="mc-heart"
      style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box', animationDelay: `${delay}s` }}
    >
      <path
        d={`M${x} ${y + size * 0.3}
           C ${x - size * 0.5} ${y - size * 0.25}, ${x - size * 0.5} ${y - size * 0.7}, ${x} ${y - size * 0.35}
           C ${x + size * 0.5} ${y - size * 0.7}, ${x + size * 0.5} ${y - size * 0.25}, ${x} ${y + size * 0.3} Z`}
        fill={color}
        stroke={SOIL}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </g>
  );
}

function PetTheDog() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const boilId = `mc-boil-${uid}`;
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <svg viewBox="0 0 280 240" className="w-[280px] sm:w-[340px]" aria-hidden>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .mc-tail { animation: mc-wag 0.14s ease-in-out infinite alternate; }
          .mc-hand { animation: mc-pet 0.55s ease-in-out infinite alternate; }
          .mc-tongue { animation: mc-loll 0.3s ease-in-out infinite alternate; }
          .mc-heart { animation: mc-float 2.2s ease-out infinite; opacity: 0; }
        }
        @keyframes mc-wag { from { transform: rotate(-30deg); } to { transform: rotate(28deg); } }
        @keyframes mc-pet { from { transform: translateY(0) rotate(0deg); } to { transform: translateY(13px) rotate(-7deg); } }
        @keyframes mc-loll { from { transform: rotate(5deg); } to { transform: rotate(-6deg) scaleY(1.15); } }
        @keyframes mc-float {
          0% { opacity: 0; transform: translateY(6px) scale(0.3); }
          18% { opacity: 1; transform: translateY(-4px) scale(1.08); }
          30% { transform: translateY(-14px) scale(1); }
          100% { opacity: 0; transform: translateY(-68px) scale(1.05) rotate(8deg); }
        }
      `}</style>

      <defs>
        <filter id={boilId} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="n">
            {animate && (
              <animate
                attributeName="baseFrequency"
                values="0.015;0.019;0.012"
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
        {/* hearts */}
        <Heart x={62} y={70} delay={0} />
        <Heart x={218} y={58} delay={0.7} size={17} color={TENNIS} />
        <Heart x={104} y={42} delay={1.3} size={26} />

        {/* tail */}
        <g className="mc-tail" style={{ transformOrigin: '62px 168px', transformBox: 'view-box' }}>
          <path
            d="M64 170 Q46 158 42 138 Q41 128 50 124 Q47 136 54 142 Q50 128 60 126 Q55 140 62 150 Q66 160 64 170 Z"
            fill={BARK}
            stroke={SOIL}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>

        {/* sitting dog, front-ish view */}
        <path
          d="M62 172 Q58 140 82 130 Q112 122 132 134 Q148 146 146 172 Q144 196 122 200 Q86 202 68 194 Q60 186 62 172 Z"
          fill={OAT}
          stroke={SOIL}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M96 148 Q112 152 112 172 Q112 192 102 198 Q90 194 88 176 Q87 158 96 148 Z"
          fill={LINEN}
          stroke={SOIL}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* front paws */}
        <ellipse cx="88" cy="198" rx="11" ry="5.5" fill={OAT} stroke={SOIL} strokeWidth="2.8" />
        <ellipse cx="116" cy="199" rx="11" ry="5.5" fill={OAT} stroke={SOIL} strokeWidth="2.8" />

        {/* head, tilted up happily toward the hand */}
        <g>
          <path
            d="M84 92 Q80 66 96 56 L100 64 L106 54 L112 62 L118 52 L124 62
               Q140 58 148 72 Q156 88 148 104 Q138 120 114 118 Q92 116 84 100 Q82 96 84 92 Z"
            fill={OAT}
            stroke={SOIL}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* ears */}
          <path d="M86 74 Q74 60 80 48 Q90 48 94 62 Z" fill={BARK} stroke={SOIL} strokeWidth="3" strokeLinejoin="round" />
          <g>
            <path d="M144 70 Q158 62 164 72 Q166 84 154 88 Q146 84 144 70 Z" fill={BARK} stroke={SOIL} strokeWidth="3" strokeLinejoin="round" />
          </g>
          {/* patch + squinty eyes */}
          <path d="M94 80 Q88 90 94 98 Q102 100 106 92 Q106 82 100 78 Q96 77 94 80 Z" fill={BARK} stroke={SOIL} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M96 86 q4 -5 8 0" fill="none" stroke={LINEN} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M124 82 q4 -5 8 0" fill="none" stroke={SOIL} strokeWidth="2.8" strokeLinecap="round" />
          {/* muzzle + nose + smile */}
          <path d="M108 96 Q122 92 130 100 Q134 110 124 114 Q112 116 106 108 Q104 100 108 96 Z" fill={LINEN} stroke={SOIL} strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M116 96 q7 0 7 6 q-4 4 -8 1 q-3 -4 1 -7 Z" fill={SOIL} />
          <path d="M108 110 Q116 118 128 112" fill="none" stroke={SOIL} strokeWidth="2.6" strokeLinecap="round" />
          {/* tongue */}
          <g className="mc-tongue" style={{ transformOrigin: '118px 114px', transformBox: 'view-box' }}>
            <path
              d="M114 113 Q112 128 118 135 Q126 138 129 129 Q131 119 125 113 Q119 110 114 113 Z"
              fill={CLAY}
              stroke={SOIL}
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* the petting hand, from top-right */}
        <g className="mc-hand" style={{ transformOrigin: '210px 20px', transformBox: 'view-box' }}>
          {/* arm */}
          <path d="M232 6 L196 44" fill="none" stroke={SOIL} strokeWidth="10" strokeLinecap="round" />
          <path d="M232 6 L196 44" fill="none" stroke={CLAY} strokeWidth="5.5" strokeLinecap="round" />
          {/* hand — mitteny, palm down over the head */}
          <path
            d="M196 40 Q206 36 210 44 Q214 40 218 46 Q222 44 223 50 Q228 50 226 57 Q222 66 208 66 Q192 64 186 54 Q184 44 196 40 Z"
            fill={OAT}
            stroke={SOIL}
            strokeWidth="3"
            strokeLinejoin="round"
            transform="translate(-42 26) rotate(18 200 50)"
          />
        </g>
      </g>
    </svg>
  );
}

export default function MatchCelebration({
  show,
  headline = 'It’s a run date!',
  sub = 'Calendar invites are on the way ✉️',
  onDone,
}: {
  show: boolean;
  headline?: string;
  sub?: string;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onDone}
          aria-label="Dismiss celebration"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-pine-deep/70 backdrop-blur-sm cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.7, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="flex flex-col items-center"
          >
            <PetTheDog />
            <p className="font-display text-[30px] sm:text-[36px] text-oat mt-2">{headline}</p>
            <p className="text-[14px] text-oat/70 mt-1">{sub}</p>
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
