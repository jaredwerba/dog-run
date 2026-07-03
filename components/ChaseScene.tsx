'use client';

import { useEffect, useId, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from 'lenis/react';

/*
 * Scroll-locked chase: GSAP ScrollTrigger pins this section while scroll
 * progress drives the scruffy dog sprinting left→right after a bouncing
 * tennis ball. Same hand-drawn squigglevision style as the other doodles.
 */

const SOIL = '#362b1f';
const OAT = '#f6eedd';
const LINEN = '#fbf6ea';
const PINE = '#2f4f38';
const BARK = '#5a4534';
const CLAY = '#bd6b44';
const TENNIS = '#c9d15f';

const PINE_PATH =
  'M20 0 L34 24 L26 24 L38 44 L28 44 L42 64 L23 64 L23 76 L17 76 L17 64 L-2 64 L12 44 L2 44 L14 24 L6 24 Z';

function Boil({ id, animate }: { id: string; animate: boolean }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" result="n">
        {animate && (
          <animate attributeName="baseFrequency" values="0.016;0.02;0.013" dur="0.42s" calcMode="discrete" repeatCount="indefinite" />
        )}
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
}

function ChaseBall({ animate }: { animate: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg viewBox="0 0 60 60" className="w-[44px] sm:w-[58px]" aria-hidden>
      <defs>
        <Boil id={`cb-${uid}`} animate={animate} />
      </defs>
      <g filter={`url(#cb-${uid})`}>
        <circle cx="30" cy="30" r="24" fill={TENNIS} stroke={SOIL} strokeWidth="3.5" />
        <path d="M12 14 C24 24, 24 36, 12 46 M48 14 C36 24, 36 36, 48 46" fill="none" stroke={LINEN} strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function RunningDog({ animate }: { animate: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const boilId = `rd-${uid}`;
  return (
    <svg
      viewBox="0 0 250 150"
      className="w-[180px] sm:w-[240px]"
      role="img"
      aria-label="Hand-drawn scruffy dog sprinting after a tennis ball"
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .rd-leg-a { animation: rd-gait 0.2s ease-in-out infinite alternate; }
          .rd-leg-b { animation: rd-gait 0.2s ease-in-out infinite alternate; animation-delay: -0.2s; }
          .rd-tail { animation: rd-wag 0.15s ease-in-out infinite alternate; }
          .rd-ear { animation: rd-flap 0.24s ease-in-out infinite alternate; }
          .rd-tongue { animation: rd-stream 0.28s ease-in-out infinite alternate; }
          .rd-lines path { animation: rd-dash 0.3s linear infinite; }
        }
        @keyframes rd-gait { from { transform: rotate(-38deg); } to { transform: rotate(32deg); } }
        @keyframes rd-wag { from { transform: rotate(-20deg); } to { transform: rotate(18deg); } }
        @keyframes rd-flap { from { transform: rotate(-10deg); } to { transform: rotate(14deg); } }
        @keyframes rd-stream { from { transform: rotate(-8deg) scaleY(1); } to { transform: rotate(10deg) scaleY(1.12); } }
        @keyframes rd-dash { to { stroke-dashoffset: -30; } }
      `}</style>
      <defs>
        <Boil id={boilId} animate={animate} />
      </defs>

      <g filter={`url(#${boilId})`}>
        {/* motion lines */}
        <g className="rd-lines" stroke={SOIL} strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="9 7">
          <path d="M6 62 h30" />
          <path d="M0 84 h38" />
          <path d="M8 106 h26" />
        </g>

        {/* tail — scruffy, streaming */}
        <g className="rd-tail" style={{ transformOrigin: '64px 84px', transformBox: 'view-box' }}>
          <path
            d="M66 86 Q48 76 42 60 Q40 50 48 46 Q46 56 52 62 Q48 50 58 48 Q54 60 60 70 Q64 78 66 86 Z"
            fill={BARK}
            stroke={SOIL}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>

        {/* back legs */}
        <g className="rd-leg-a" style={{ transformOrigin: '88px 112px', transformBox: 'view-box' }}>
          <path d="M88 112 L76 138" fill="none" stroke={SOIL} strokeWidth="7" strokeLinecap="round" />
        </g>
        <g className="rd-leg-b" style={{ transformOrigin: '104px 114px', transformBox: 'view-box' }}>
          <path d="M104 114 L98 140" fill="none" stroke={SOIL} strokeWidth="7" strokeLinecap="round" />
        </g>

        {/* body — scruffy back, horizontal at full stretch */}
        <path
          d="M66 92 L60 82 L70 84 L68 72 L78 78 L82 66 L90 74 L98 64 L104 74 L114 66 L120 76 L130 70 L134 80 L144 74 L148 84
             Q162 86 166 96 Q168 112 156 118 Q120 128 88 122 Q68 118 64 104 Q63 96 66 92 Z"
          fill={OAT}
          stroke={SOIL}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* bark saddle patch */}
        <path d="M92 76 Q112 70 126 76 Q122 92 104 94 Q94 88 92 76 Z" fill={BARK} stroke={SOIL} strokeWidth="2.5" strokeLinejoin="round" />
        {/* belly */}
        <path d="M96 116 Q118 122 142 114 Q138 122 124 124 Q106 124 96 116 Z" fill={LINEN} stroke={SOIL} strokeWidth="2" strokeLinejoin="round" />

        {/* front legs */}
        <g className="rd-leg-b" style={{ transformOrigin: '144px 114px', transformBox: 'view-box' }}>
          <path d="M144 114 L156 138" fill="none" stroke={SOIL} strokeWidth="7" strokeLinecap="round" />
        </g>
        <g className="rd-leg-a" style={{ transformOrigin: '158px 110px', transformBox: 'view-box' }}>
          <path d="M158 110 L172 134" fill="none" stroke={SOIL} strokeWidth="7" strokeLinecap="round" />
        </g>

        {/* head — leaning into the chase */}
        <g style={{ transformOrigin: '186px 66px', transformBox: 'view-box' }} transform="rotate(6 186 66)">
          {/* upright ear */}
          <path d="M164 36 Q158 16 170 10 Q180 9 182 26 Q182 36 176 42 Z" fill={BARK} stroke={SOIL} strokeWidth="3" strokeLinejoin="round" />
          {/* flopped ear streaming behind */}
          <g className="rd-ear" style={{ transformOrigin: '168px 44px', transformBox: 'view-box' }}>
            <path d="M168 44 Q150 40 144 52 Q142 64 154 66 Q164 62 168 52 Z" fill={BARK} stroke={SOIL} strokeWidth="3" strokeLinejoin="round" />
          </g>
          {/* skull with scruff */}
          <path
            d="M164 54 L158 46 L166 48 L164 38 L173 44 L174 32 L182 42 L188 30 L193 42 L202 36 L202 48 L211 44 L208 54
               Q220 60 222 72 Q223 86 212 92 Q198 100 182 96 Q166 92 162 78 Q160 64 164 54 Z"
            fill={OAT}
            stroke={SOIL}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* patch over eye */}
          <path d="M168 56 Q160 64 164 74 Q172 78 178 72 Q180 62 175 56 Q171 53 168 56 Z" fill={BARK} stroke={SOIL} strokeWidth="2.5" strokeLinejoin="round" />
          {/* determined squinty eyes */}
          <path d="M170 64 q4 -4 8 0" fill="none" stroke={LINEN} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M194 60 q4 -4 8 0" fill="none" stroke={SOIL} strokeWidth="2.8" strokeLinecap="round" />
          {/* muzzle */}
          <path d="M212 66 Q228 64 233 74 Q236 84 226 87 Q215 90 209 84 Q206 74 212 66 Z" fill={LINEN} stroke={SOIL} strokeWidth="3" strokeLinejoin="round" />
          <path d="M230 68 q7 2 5 8 q-6 3 -9 -1 q-2 -5 4 -7 Z" fill={SOIL} />
          {/* open panting mouth */}
          <path d="M209 86 Q217 93 227 88" fill="none" stroke={SOIL} strokeWidth="2.6" strokeLinecap="round" />
          {/* tongue streaming back */}
          <g className="rd-tongue" style={{ transformOrigin: '210px 88px', transformBox: 'view-box' }}>
            <path
              d="M210 87 Q202 102 190 106 Q182 106 184 98 Q188 90 200 86 Q206 84 210 87 Z"
              fill={CLAY}
              stroke={SOIL}
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

export default function ChaseScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const dogRef = useRef<HTMLDivElement>(null);
  const dogBobRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const ballBounceRef = useRef<HTMLDivElement>(null);
  const ballSpinRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  // Keep ScrollTrigger in sync with Lenis smooth scrolling
  useLenis(() => ScrollTrigger.update());

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=1500',
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // ball leads the whole way
      tl.fromTo(
        ballRef.current,
        { x: () => -window.innerWidth * 0.08 - 90 },
        { x: () => window.innerWidth + 120, ease: 'none', duration: 1 },
        0
      );
      // bounce — decaying arcs
      tl.to(
        ballBounceRef.current,
        {
          keyframes: [
            { y: -170, ease: 'power1.out' },
            { y: 0, ease: 'power1.in' },
            { y: -130, ease: 'power1.out' },
            { y: 0, ease: 'power1.in' },
            { y: -95, ease: 'power1.out' },
            { y: 0, ease: 'power1.in' },
            { y: -65, ease: 'power1.out' },
            { y: 0, ease: 'power1.in' },
          ],
          duration: 1,
        },
        0
      );
      tl.to(ballSpinRef.current, { rotate: 1080, ease: 'none', duration: 1 }, 0);

      // dog gives chase, always a stride behind
      tl.fromTo(
        dogRef.current,
        { x: () => -window.innerWidth * 0.08 - 320 },
        { x: () => window.innerWidth + 60, ease: 'none', duration: 1 },
        0.05
      );
      tl.to(
        dogBobRef.current,
        {
          keyframes: Array.from({ length: 8 }, (_, i) => [
            { y: -12, ease: 'power1.out' },
            { y: 0, ease: 'power1.in' },
          ]).flat(),
          duration: 0.95,
        },
        0.05
      );

      // headline breathes in and out mid-chase
      tl.fromTo(headlineRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.12 }, 0.06);
      tl.to(headlineRef.current, { opacity: 0, y: -18, duration: 0.12 }, 0.82);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] overflow-hidden bg-gradient-to-b from-[#e9edd2] to-oat"
      aria-label="A scruffy dog chasing a tennis ball across the screen as you scroll"
    >
      {/* headline */}
      <div
        ref={headlineRef}
        className="absolute top-[16%] inset-x-0 text-center px-6"
        style={reduced ? undefined : { opacity: 0 }}
      >
        <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">THE WHOLE BUSINESS MODEL</p>
        <h2 className="font-display text-[34px] sm:text-[48px] leading-[1.05] text-soil">
          See ball.
          <br />
          Chase ball. Repeat.
        </h2>
      </div>

      {/* ground */}
      <svg className="absolute bottom-0 left-0 w-full h-[110px]" viewBox="0 0 1440 160" preserveAspectRatio="xMidYMax slice" aria-hidden>
        <defs>
          <path id="chase-pine" d={PINE_PATH} />
        </defs>
        <path d="M0 160 L0 96 Q360 76 720 92 T1440 84 L1440 160 Z" fill={PINE} />
        <use href="#chase-pine" fill={PINE} transform="translate(30 38) scale(0.9)" />
        <use href="#chase-pine" fill={PINE} transform="translate(90 46) scale(0.7)" />
        <use href="#chase-pine" fill={PINE} transform="translate(1320 34) scale(0.95)" />
        <use href="#chase-pine" fill={PINE} transform="translate(1390 44) scale(0.7)" />
      </svg>

      {/* the ball — x (lead) → bounce (y) → spin */}
      <div ref={ballRef} className="absolute bottom-[96px] left-0" style={reduced ? { left: '58%' } : undefined}>
        <div ref={ballBounceRef}>
          <div ref={ballSpinRef}>
            <ChaseBall animate={!reduced} />
          </div>
        </div>
      </div>

      {/* the dog — x (chase) → bob (y) */}
      <div ref={dogRef} className="absolute bottom-[64px] left-0" style={reduced ? { left: '18%' } : undefined}>
        <div ref={dogBobRef}>
          <RunningDog animate={!reduced} />
        </div>
      </div>
    </section>
  );
}
