'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig, useScroll, useTransform } from 'motion/react';
import { ReactLenis } from 'lenis/react';

const PollenField = dynamic(() => import('@/components/PollenField'), { ssr: false });
const TennisBall3D = dynamic(() => import('@/components/TennisBall3D'), { ssr: false });
const JoggerDoodle = dynamic(() => import('@/components/JoggerDoodle'), { ssr: false });
const ScruffyDog = dynamic(() => import('@/components/ScruffyDog'), { ssr: false });

/* ── Shared fade-up-on-scroll props ────────────────────── */
const fadeUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: 'easeOut' as const },
};

/* ── Tennis ball dot — the recurring motif ─────────────── */
function TennisBall({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={`inline-block ${className}`}
      aria-hidden
    >
      <circle cx="10" cy="10" r="9" fill="var(--color-tennis)" stroke="var(--color-soil)" strokeWidth="1.5" />
      <path d="M3 4.5 C8 8, 8 12, 3 15.5 M17 4.5 C12 8, 12 12, 17 15.5" fill="none" stroke="var(--color-soil)" strokeWidth="1.2" />
    </svg>
  );
}

/* ── Simple leaf, for drifting foliage ─────────────────── */
function Leaf({ size = 22, color = 'var(--color-fern)', className = '' }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 2 C20 8 20 17 12 23 C4 17 4 8 12 2 Z" fill={color} />
      <path d="M12 5 L12 20" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
    </svg>
  );
}

/* ── Pine forest layers for the hero ───────────────────── */
const PINE_PATH =
  'M20 0 L34 24 L26 24 L38 44 L28 44 L42 64 L23 64 L23 76 L17 76 L17 64 L-2 64 L12 44 L2 44 L14 24 L6 24 Z';

function PineLayer({
  id,
  color,
  trees,
  hill,
  className = '',
}: {
  id: string;
  color: string;
  trees: { x: number; y: number; s: number }[];
  hill: string;
  className?: string;
}) {
  return (
    <svg
      className={`absolute bottom-0 left-0 w-full ${className}`}
      viewBox="0 0 1440 240"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      <defs>
        <path id={id} d={PINE_PATH} />
      </defs>
      <path d={hill} fill={color} />
      {trees.map((t, i) => (
        <use
          key={i}
          href={`#${id}`}
          fill={color}
          transform={`translate(${t.x} ${t.y}) scale(${t.s})`}
        />
      ))}
    </svg>
  );
}

const BACK_TREES = [40, 150, 260, 380, 490, 610, 730, 850, 960, 1080, 1190, 1300, 1400].map(
  (x, i) => ({ x, y: 96 + (i % 3) * 8, s: 0.55 + (i % 2) * 0.12 })
);
const MID_TREES = [0, 170, 330, 520, 700, 880, 1050, 1230, 1380].map((x, i) => ({
  x,
  y: 112 + (i % 2) * 10,
  s: 0.85 + (i % 3) * 0.12,
}));
const FRONT_TREES = [-20, 180, 420, 900, 1150, 1340].map((x, i) => ({
  x,
  y: 116 - (i % 2) * 8,
  s: 1.25 + (i % 2) * 0.2,
}));

/* ── Hero — illustrated forest sunrise ─────────────────── */
function ForestHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const sunY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const backY = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const frontY = useTransform(scrollYProgress, [0, 1], [0, 140]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] flex items-start sm:items-center justify-center overflow-hidden bg-gradient-to-b from-[#fdf3da] via-[#f7ecd0] to-[#e9edd2]"
    >
      {/* morning sun */}
      <motion.div
        style={{ y: sunY }}
        className="absolute right-[8%] sm:right-[14%] top-[10%] sm:top-[14%]"
        aria-hidden
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-sunlight"
          style={{ boxShadow: '0 0 110px 55px rgba(227,166,60,0.4)' }}
        />
      </motion.div>

      {/* drifting leaves */}
      {[
        { left: '8%', top: '22%', delay: 0, size: 20 },
        { left: '85%', top: '40%', delay: 1.4, size: 16 },
        { left: '16%', top: '55%', delay: 2.6, size: 18 },
      ].map((l) => (
        <motion.div
          key={l.left}
          className="absolute"
          style={{ left: l.left, top: l.top }}
          animate={{ y: [0, 14, 0], rotate: [-10, 10, -10] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: l.delay }}
          aria-hidden
        >
          <Leaf size={l.size} color="var(--color-moss)" />
        </motion.div>
      ))}

      {/* forest layers */}
      <motion.div style={{ y: backY }} className="absolute inset-x-0 bottom-0 h-[150px] sm:h-[220px]" aria-hidden>
        <PineLayer
          id="pine-b"
          color="#a4b78f"
          trees={BACK_TREES}
          hill="M0 240 L0 150 Q360 118 720 140 T1440 130 L1440 240 Z"
          className="h-full"
        />
      </motion.div>
      <motion.div style={{ y: midY }} className="absolute inset-x-0 bottom-0 h-[130px] sm:h-[190px]" aria-hidden>
        <PineLayer
          id="pine-m"
          color="#567c52"
          trees={MID_TREES}
          hill="M0 240 L0 168 Q400 140 800 162 T1440 150 L1440 240 Z"
          className="h-full"
        />
      </motion.div>
      <motion.div style={{ y: frontY }} className="absolute inset-x-0 bottom-0 h-[110px] sm:h-[160px]" aria-hidden>
        <PineLayer
          id="pine-f"
          color="#2f4f38"
          trees={FRONT_TREES}
          hill="M0 240 L0 180 Q360 158 720 176 T1440 168 L1440 240 Z"
          className="h-full"
        />
      </motion.div>

      {/* sunlit pollen — three.js */}
      <PollenField className="absolute inset-0 z-[6]" />

      {/* content */}
      <div className="relative z-10 text-center px-6 max-w-3xl pt-28 sm:pt-16 pb-[190px] sm:pb-[240px]">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-data text-[12px] sm:text-[13px] tracking-[0.24em] text-clay mb-6"
        >
          BOSTON, MA · RUNNER–DOG MATCHING
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-soil leading-[1.04] text-[38px] sm:text-[58px] mb-6"
        >
          Every good dog
          <br />
          deserves a runner
          <TennisBall size={16} className="ml-2 -translate-y-1 sm:-translate-y-2" />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-[16px] sm:text-[18px] leading-relaxed text-bark max-w-xl mx-auto mb-10"
        >
          Go Dogs Boston matches your high-energy dog with a Boston runner who
          actually wants the miles. Your dog comes home tired and happy — no more
          guilt about the walk you didn&apos;t have time for. Runners get a partner
          who never cancels.
        </motion.p>

        {/* trail-sign CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative inline-flex flex-col gap-3 items-stretch"
        >
          <span
            className="absolute left-1/2 -translate-x-1/2 -top-2 -bottom-6 w-2.5 rounded-full bg-bark/85"
            aria-hidden
          />
          <Link
            href="/register"
            className="trail-sign relative bg-bark text-oat font-bold text-[15px] tracking-wide pl-6 pr-10 py-3.5 -rotate-1 shadow-lg hover:bg-soil transition-colors"
          >
            I’M A RUNNER — FIND A DOG
          </Link>
          <Link
            href="/register"
            className="trail-sign relative bg-pine text-oat font-bold text-[15px] tracking-wide pl-6 pr-10 py-3.5 rotate-1 shadow-lg hover:bg-pine-deep transition-colors"
          >
            I OWN A DOG — FIND A RUNNER
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8"
        >
          <Link
            href="/browse"
            className="text-[14px] font-bold text-bark underline decoration-bark/30 underline-offset-4 hover:decoration-bark transition-colors"
          >
            or just browse the dogs &amp; runners first →
          </Link>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="font-data text-[11px] tracking-[0.15em] text-bark/60 mt-6"
        >
          FREE TO JOIN · BOSTON ONLY · FIRST RUNS IN PUBLIC PARKS
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-4 flex justify-center"
        >
          <ScruffyDog className="w-[100px] sm:w-[130px]" />
        </motion.div>
      </div>
    </section>
  );
}

/* ── iPhone 17 Pro demo ────────────────────────────────── */
const DEMO_DOGS = [
  { initials: 'T', name: 'Tank', breed: 'Lab mix · 3 yrs', need: '5 mi/day', energy: 4, tone: 'bg-fern' },
  { initials: 'J', name: 'Juno', breed: 'Shepherd · 2 yrs', need: '6 mi/day', energy: 5, tone: 'bg-clay' },
  { initials: 'B', name: 'Biscuit', breed: 'Border collie · 4 yrs', need: '6 mi/day', energy: 5, tone: 'bg-sunlight' },
];

function EnergyDots({ level }: { level: number }) {
  return (
    <span className="flex gap-1" aria-label={`Energy ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= level ? 'bg-fern' : 'bg-soil/15'}`}
        />
      ))}
    </span>
  );
}

const screenSlide = {
  initial: { x: 46, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -46, opacity: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
};

function DemoScreenBrowse() {
  return (
    <motion.div {...screenSlide} className="absolute inset-0 px-4 pt-14 pb-4">
      <p className="font-data text-[9px] tracking-[0.18em] text-clay mb-1">SOUTH BOSTON</p>
      <p className="font-bold text-[17px] text-soil mb-3">Dogs near you</p>
      <div className="space-y-2.5">
        {DEMO_DOGS.map((dog, i) => (
          <motion.div
            key={dog.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.15 }}
            className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm"
          >
            <span
              className={`w-10 h-10 rounded-full ${dog.tone} text-white font-bold text-[15px] flex items-center justify-center shrink-0`}
            >
              {dog.initials}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-[13px] text-soil">{dog.name}</span>
              <span className="block text-[11px] text-soil/55 truncate">{dog.breed}</span>
            </span>
            <span className="text-right">
              <EnergyDots level={dog.energy} />
              <span className="block font-data text-[9px] text-soil/50 mt-1">{dog.need}</span>
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function DemoScreenProfile() {
  return (
    <motion.div {...screenSlide} className="absolute inset-0 px-4 pt-14 pb-4 flex flex-col">
      <div className="bg-fern rounded-xl h-28 flex items-center justify-center mb-3">
        <span className="w-14 h-14 rounded-full bg-white/25 text-white font-bold text-[24px] flex items-center justify-center">
          T
        </span>
      </div>
      <p className="font-bold text-[17px] text-soil">Tank</p>
      <p className="text-[12px] text-soil/55 mb-3">Lab mix · 3 yrs · South Boston</p>
      <dl className="font-data text-[11px] space-y-1.5 text-soil/75 mb-auto">
        <div className="flex justify-between"><dt className="text-soil/45">NEEDS</dt><dd>5 MI/DAY</dd></div>
        <div className="flex justify-between"><dt className="text-soil/45">PACE OK</dt><dd>UP TO 8:00/MI</dd></div>
        <div className="flex justify-between"><dt className="text-soil/45">PULLS?</dt><dd>A LITTLE</dd></div>
      </dl>
      <motion.button
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1, 0.94, 1] }}
        transition={{ delay: 1.6, duration: 0.5, times: [0, 0.5, 0.75, 1] }}
        className="w-full bg-pine text-oat font-bold text-[13px] py-3 rounded-xl"
      >
        Request a run
      </motion.button>
    </motion.div>
  );
}

const CHAT = [
  { me: false, text: 'Tank would love a Tuesday run 🐾' },
  { me: true, text: '6:30 at the Castle Island gate?' },
  { me: false, text: 'Perfect. He’ll be the one vibrating.' },
];

function DemoScreenChat() {
  return (
    <motion.div {...screenSlide} className="absolute inset-0 px-4 pt-14 pb-4">
      <p className="font-bold text-[14px] text-soil border-b border-soil/10 pb-2 mb-3">
        Dan <span className="font-normal text-soil/50">— Tank’s owner</span>
      </p>
      <div className="space-y-2">
        {CHAT.map((m, i) => (
          <motion.p
            key={m.text}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.55 }}
            className={`max-w-[80%] text-[12px] leading-snug px-3 py-2 rounded-2xl ${
              m.me
                ? 'ml-auto bg-pine text-oat rounded-br-md'
                : 'bg-white text-soil shadow-sm rounded-bl-md'
            }`}
          >
            {m.text}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
}

function DemoScreenConfirmed() {
  return (
    <motion.div {...screenSlide} className="absolute inset-0 px-4 pt-14 pb-4 flex flex-col items-center justify-center text-center">
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 18 }}
        className="w-14 h-14 rounded-full bg-fern text-white flex items-center justify-center mb-4"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l5 5 9-11" />
        </svg>
      </motion.span>
      <p className="font-bold text-[17px] text-soil mb-1">Run scheduled</p>
      <p className="font-data text-[10px] tracking-[0.14em] text-clay mb-3">
        TUE 6:30 AM · CASTLE ISLAND
      </p>
      <p className="text-[12px] text-soil/55">Tank can’t wait.</p>
    </motion.div>
  );
}

const DEMO_SCREENS = [DemoScreenBrowse, DemoScreenProfile, DemoScreenChat, DemoScreenConfirmed];

function PhoneDemo() {
  const [screen, setScreen] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setScreen((s) => (s + 1) % DEMO_SCREENS.length), 3400);
    return () => clearInterval(t);
  }, []);

  const Active = DEMO_SCREENS[screen];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[290px] h-[600px] rounded-[54px] bg-[#4a4a45] p-[9px] shadow-2xl shadow-black/50">
        {/* side buttons */}
        <span className="absolute -left-[2px] top-[130px] w-[3px] h-9 rounded-l bg-[#3a3a36]" aria-hidden />
        <span className="absolute -left-[2px] top-[180px] w-[3px] h-14 rounded-l bg-[#3a3a36]" aria-hidden />
        <span className="absolute -right-[2px] top-[160px] w-[3px] h-16 rounded-r bg-[#3a3a36]" aria-hidden />

        <div className="relative w-full h-full rounded-[45px] overflow-hidden bg-oat">
          {/* dynamic island */}
          <span className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[92px] h-[26px] rounded-full bg-black z-20" aria-hidden />
          {/* status bar */}
          <span className="absolute top-3.5 left-7 font-data text-[10px] text-soil/70 z-10">6:24</span>

          <AnimatePresence mode="wait">
            <Active key={screen} />
          </AnimatePresence>

          {/* home indicator */}
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-soil/25 z-20" aria-hidden />
        </div>
      </div>

      {/* progress dots */}
      <div className="flex gap-2 mt-6" role="tablist" aria-label="Demo screens">
        {DEMO_SCREENS.map((_, i) => (
          <button
            key={i}
            onClick={() => setScreen(i)}
            role="tab"
            aria-selected={i === screen}
            aria-label={['Browse dogs', 'Dog profile', 'Chat', 'Run scheduled'][i]}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === screen ? 'bg-tennis' : 'bg-white/25 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── How it works: route line that draws on scroll ─────── */
const STEPS = [
  {
    mile: 'MI 0.0',
    title: 'Pick your side',
    desc: 'Sign up as a runner or a dog owner. A passkey and about sixty seconds — no password.',
  },
  {
    mile: 'MI 0.7',
    title: 'Match nearby',
    desc: 'Owners browse runners, runners browse dogs — filtered by neighborhood, pace, and energy level.',
  },
  {
    mile: 'MI 1.5',
    title: 'Plan the run',
    desc: 'Chat in the app, pick a route, and set the rules: distance, pace, and where you meet.',
  },
  {
    mile: 'MI 2.2',
    title: 'Run',
    desc: 'Meet under the trees, clip the leash, go. Save the buddies you like for next week.',
  },
];

function RouteTrail() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const path = pathRef.current;
    if (!wrap || !path) return;

    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      path.style.strokeDashoffset = '0';
      return;
    }

    path.style.strokeDashoffset = `${len}`;
    let raf = 0;
    const update = () => {
      const r = wrap.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.85 - r.top) / r.height));
      path.style.strokeDashoffset = `${len * (1 - progress)}`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <svg
        className="absolute left-0 top-0 h-full w-14"
        viewBox="0 0 56 800"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M28 0 C 46 90, 10 170, 28 270 C 46 370, 10 450, 28 550 C 42 630, 16 710, 28 800"
          fill="none"
          stroke="var(--color-bark)"
          strokeWidth="3"
          strokeLinecap="round"
          ref={pathRef}
        />
      </svg>

      <ol className="space-y-14 sm:space-y-16">
        {STEPS.map((step, i) => {
          const last = i === STEPS.length - 1;
          return (
            <li key={step.mile} className="relative flex gap-6 sm:gap-8">
              <div className="w-14 shrink-0 flex flex-col items-center pt-1">
                {last ? (
                  <TennisBall size={26} />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-linen border-[3px] border-pine" />
                )}
              </div>
              <div>
                <p className="font-data text-[12px] tracking-[0.15em] text-clay mb-1">{step.mile}</p>
                <h3 className="font-bold text-[19px] text-soil mb-1.5">{step.title}</h3>
                <p className="text-[15px] text-soil/65 leading-relaxed max-w-md">{step.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── Content data ──────────────────────────────────────── */
const RUN_LOG = [
  {
    header: 'TUE 6:12 AM · CASTLE ISLAND · 4.4 MI',
    quote:
      'Tank pulls me through mile five like it’s nothing. Best tempo partner in Southie — and he never checks his watch.',
    name: 'Priya R.',
    detail: 'Runner, matched with Tank (lab mix)',
  },
  {
    header: 'THU 7:40 PM · ESPLANADE · 6.0 MI',
    quote:
      'My border collie needs six miles a day. I do not. Biscuit has three regular runners now, and I have my evenings back.',
    name: 'Dan M.',
    detail: 'Owner of Biscuit, Back Bay',
  },
  {
    header: 'SAT 8:05 AM · JAMAICA POND · 3.1 MI',
    quote:
      'My lease says no dogs. Now I get the dog, the dog gets the miles, and Juno’s owner gets a Saturday morning off.',
    name: 'Maya K.',
    detail: 'Runner, matched with Juno (shepherd)',
  },
];

const TRUST = [
  {
    title: 'Verified profiles',
    desc: 'Every runner and owner verifies their identity before their first match.',
    icon: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zM9 12l2 2 4-4" />,
  },
  {
    title: 'Chat before you meet',
    desc: 'Message in the app until you’re comfortable. Share only what you choose.',
    icon: <path d="M21 14a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v8z" />,
  },
  {
    title: 'First runs in public parks',
    desc: 'Meetups start at busy Boston parks and trailheads — never a private address.',
    icon: <path d="M12 3l5 7h-3l4 6H6l4-6H7l5-7zM12 16v5" />,
  },
  {
    title: 'Owners set the run rules',
    desc: 'Pace caps, distance limits, and hot-weather rules travel with every dog.',
    icon: <path d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM10 8h4M10 12h4M10 16h2" />,
  },
];

const ROUTES = [
  { name: 'Castle Island Loop', href: '/routes/castle-island', dist: '2.2 MI', surface: 'Paved', note: 'Ocean breeze, fort views', favorite: true },
  { name: 'Charles River Esplanade', href: '/routes/charles-river', dist: '3–17 MI', surface: 'Paved', note: 'Fountains and shade the whole way', favorite: false },
  { name: 'Boston Common & Garden', href: '/routes/boston-common', dist: '1.5 MI', surface: 'Mixed', note: 'Quick downtown lunch-break loops', favorite: false },
  { name: 'Jamaica Pond', href: '/routes/jamaica-pond', dist: '1.5 MI', surface: 'Soft path', note: 'Gentle on joints, good for easy days', favorite: false },
];

/* ── Page ──────────────────────────────────────────────── */
export default function Home() {
  return (
    <ReactLenis root>
      <MotionConfig reducedMotion="user">
        <main className="min-h-screen bg-oat font-body text-soil">
          <ForestHero />

          {/* ── Under the canopy: phone demo ─────────────── */}
          <section className="relative bg-pine text-white px-6 py-20 sm:py-24 overflow-hidden">
            {/* foliage accents */}
            <Leaf size={120} color="rgba(255,255,255,0.05)" className="absolute -left-8 top-12 rotate-[30deg]" />
            <Leaf size={160} color="rgba(255,255,255,0.05)" className="absolute -right-12 bottom-16 -rotate-[24deg]" />

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <motion.div {...fadeUp}>
                <p className="font-data text-[12px] tracking-[0.24em] text-tennis mb-3">THE APP</p>
                <h2 className="font-display text-[30px] sm:text-[42px] leading-[1.08] mb-4">
                  Watch a match
                  <br />
                  happen
                </h2>
                <p className="text-[16px] text-white/75 leading-relaxed max-w-sm mb-6">
                  Browse the dogs near you, send a run request, agree on a time
                  and a trailhead. From opening the app to a scheduled run in
                  under two minutes — then you’re outside.
                </p>
                <ul className="space-y-3">
                  {['Browse dogs by energy and pace', 'Chat with the owner first', 'Meet at a park you both know'].map((b) => (
                    <li key={b} className="flex gap-3 items-baseline text-[15px] text-white/85">
                      <span className="w-2 h-2 rounded-full bg-tennis shrink-0" aria-hidden />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div {...fadeUp}>
                <PhoneDemo />
              </motion.div>
            </div>
          </section>

          {/* ── The match, in one look ───────────────────── */}
          <section className="px-6 py-20 sm:py-24">
            <div className="max-w-4xl mx-auto">
              <motion.div {...fadeUp} className="text-center mb-6">
                <h2 className="font-display text-[30px] sm:text-[42px] leading-[1.08] text-soil">
                  You run. They run.
                  <br />
                  We do the introductions.
                </h2>
              </motion.div>

              <motion.div {...fadeUp}>
                <JoggerDoodle className="w-full max-w-[440px] mx-auto mb-8" />
              </motion.div>

              <motion.div {...fadeUp}>
                <div className="relative flex flex-col md:flex-row items-stretch justify-center gap-10 md:gap-0">
                  <div className="bg-linen rounded-lg border border-soil/10 shadow-sm p-6 md:w-[290px]">
                    <p className="font-data text-[11px] tracking-[0.18em] text-pine mb-3">RUNNER PROFILE</p>
                    <p className="font-bold text-[19px] mb-4">Priya R.</p>
                    <dl className="font-data text-[13px] space-y-2 text-soil/75">
                      <div className="flex justify-between"><dt className="text-soil/45">PACE</dt><dd>8:30 /MI</dd></div>
                      <div className="flex justify-between"><dt className="text-soil/45">RANGE</dt><dd>3–7 MI</dd></div>
                      <div className="flex justify-between"><dt className="text-soil/45">HOME</dt><dd>SOUTHIE</dd></div>
                      <div className="flex justify-between"><dt className="text-soil/45">MORNINGS</dt><dd>YES</dd></div>
                    </dl>
                  </div>

                  <div className="relative flex md:flex-col items-center justify-center md:w-[150px] shrink-0" aria-hidden>
                    <span className="hidden md:block w-full border-t-2 border-dashed border-bark/50" />
                    <span className="md:hidden h-10 border-l-2 border-dashed border-bark/50" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <TennisBall size={24} />
                    </span>
                  </div>

                  <div className="bg-linen rounded-lg border border-soil/10 shadow-sm p-6 md:w-[290px]">
                    <p className="font-data text-[11px] tracking-[0.18em] text-clay mb-3">DOG PROFILE</p>
                    <p className="font-bold text-[19px] mb-4">Tank · Lab mix, 3</p>
                    <dl className="font-data text-[13px] space-y-2 text-soil/75">
                      <div className="flex justify-between"><dt className="text-soil/45">NEEDS</dt><dd>5 MI /DAY</dd></div>
                      <div className="flex justify-between"><dt className="text-soil/45">ENERGY</dt><dd>▮▮▮▮▯</dd></div>
                      <div className="flex justify-between"><dt className="text-soil/45">PULLS?</dt><dd>A LITTLE</dd></div>
                      <div className="flex justify-between"><dt className="text-soil/45">RECALL</dt><dd>SOLID</dd></div>
                    </dl>
                  </div>
                </div>

                <p className="font-data text-[12px] tracking-[0.15em] text-center mt-8">
                  <span className="inline-block border border-clay text-clay px-4 py-1.5 rounded-sm -rotate-1">
                    MATCHED — TUE 6:30 AM · CASTLE ISLAND
                  </span>
                </p>
              </motion.div>
            </div>
          </section>

          {/* ── How it works ─────────────────────────────── */}
          <section className="bg-linen px-6 py-20 sm:py-24">
            <div className="max-w-2xl mx-auto">
              <motion.div {...fadeUp} className="mb-14">
                <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">HOW IT WORKS</p>
                <h2 className="font-display text-[30px] sm:text-[42px] leading-[1.08] text-soil mb-3">
                  Four steps, about one lap
                  <br />
                  of Castle Island
                </h2>
                <p className="text-[16px] text-soil/60 leading-relaxed max-w-md">
                  The whole thing is built to get you from signing up to
                  actually running — 2.2 miles, one dog, no fuss.
                </p>
              </motion.div>

              <RouteTrail />
            </div>
          </section>

          {/* ── The deal, both sides ─────────────────────── */}
          <section className="bg-pine text-white px-6 py-20 sm:py-24">
            <div className="max-w-4xl mx-auto">
              <motion.div {...fadeUp} className="mb-14">
                <h2 className="font-display text-[30px] sm:text-[42px] leading-[1.08]">
                  A fair trade,
                  <br />
                  both ways
                </h2>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-12 md:gap-16">
                <motion.div {...fadeUp}>
                  <p className="font-data text-[12px] tracking-[0.24em] text-tennis mb-5">FOR RUNNERS</p>
                  <ul className="space-y-4 mb-8">
                    {[
                      'A steady training partner with boundless enthusiasm and zero excuses',
                      'Dog time without the vet bills or the no-pets lease',
                      'Pick dogs by pace, size, and neighborhood',
                    ].map((b) => (
                      <li key={b} className="flex gap-3 items-baseline text-[15px] text-white/85 leading-relaxed">
                        <span className="w-2 h-2 rounded-full bg-tennis shrink-0 translate-y-[-1px]" aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className="inline-block bg-oat text-pine font-bold text-[15px] px-6 py-3 rounded-md hover:bg-linen transition-colors"
                  >
                    Create a runner profile →
                  </Link>
                </motion.div>

                <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }}>
                  <p className="font-data text-[12px] tracking-[0.24em] text-tennis mb-5">FOR DOG OWNERS</p>
                  <ul className="space-y-4 mb-8">
                    {[
                      'Come home to a calm, tired dog — not one bouncing off the walls at 6pm',
                      'Give your dog the miles they need without rearranging your whole day',
                      'Runners in your neighborhood, on your schedule — you set the pace, distance, and heat rules',
                    ].map((b) => (
                      <li key={b} className="flex gap-3 items-baseline text-[15px] text-white/85 leading-relaxed">
                        <span className="w-2 h-2 rounded-full bg-tennis shrink-0 translate-y-[-1px]" aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className="inline-block bg-oat text-pine font-bold text-[15px] px-6 py-3 rounded-md hover:bg-linen transition-colors"
                  >
                    Create an owner profile →
                  </Link>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── Run log ──────────────────────────────────── */}
          <section className="px-6 py-20 sm:py-24">
            <div className="max-w-3xl mx-auto">
              <motion.div {...fadeUp} className="mb-12">
                <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">FROM THE RUN LOG</p>
                <h2 className="font-display text-[30px] sm:text-[42px] leading-[1.08] text-soil">
                  Happy runners, tired dogs
                </h2>
              </motion.div>

              <div className="space-y-5">
                {RUN_LOG.map((entry, i) => (
                  <motion.figure
                    key={entry.name}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: i * 0.09 }}
                    className="bg-linen rounded-lg border border-soil/10 shadow-sm p-6 sm:p-7"
                  >
                    <p className="font-data text-[12px] tracking-[0.12em] text-pine border-b border-dashed border-soil/15 pb-3 mb-4">
                      {entry.header}
                    </p>
                    <blockquote className="text-[16px] text-soil/80 leading-relaxed mb-3">
                      “{entry.quote}”
                    </blockquote>
                    <figcaption className="text-[13px] text-soil/50">
                      <span className="font-bold text-soil/75">{entry.name}</span> · {entry.detail}
                    </figcaption>
                  </motion.figure>
                ))}
              </div>
            </div>
          </section>

          {/* ── Trust ────────────────────────────────────── */}
          <section className="bg-linen px-6 py-20 sm:py-24">
            <div className="max-w-3xl mx-auto">
              <motion.div {...fadeUp} className="mb-12">
                <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">SAFETY</p>
                <h2 className="font-display text-[30px] sm:text-[42px] leading-[1.08] text-soil mb-3">
                  Built for handing
                  <br />
                  over the leash
                </h2>
                <p className="text-[16px] text-soil/60 leading-relaxed max-w-md">
                  Trusting a stranger with your dog — or meeting one for a run —
                  is the whole product. So it’s built into every step.
                </p>
              </motion.div>

              <div className="grid sm:grid-cols-2 gap-x-12 gap-y-9">
                {TRUST.map((item, i) => (
                  <motion.div
                    key={item.title}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                    className="flex gap-4 items-start"
                  >
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--color-fern)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                      aria-hidden
                    >
                      {item.icon}
                    </svg>
                    <div>
                      <h3 className="font-bold text-[16px] text-soil mb-1">{item.title}</h3>
                      <p className="text-[14px] text-soil/60 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Route board ──────────────────────────────── */}
          <section className="bg-pine text-white px-6 py-20 sm:py-24">
            <div className="max-w-3xl mx-auto">
              <motion.div {...fadeUp} className="mb-10">
                <p className="font-data text-[12px] tracking-[0.24em] text-tennis mb-3">WHERE THE PACK RUNS</p>
                <h2 className="font-display text-[30px] sm:text-[42px] leading-[1.08]">Trailhead board</h2>
              </motion.div>

              <motion.div {...fadeUp}>
                <div className="border-2 border-white/25 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="font-data text-[11px] tracking-[0.18em] text-tennis border-b border-white/20">
                          <th className="px-5 py-3.5 font-medium">ROUTE</th>
                          <th className="px-5 py-3.5 font-medium">DIST</th>
                          <th className="px-5 py-3.5 font-medium hidden sm:table-cell">SURFACE</th>
                          <th className="px-5 py-3.5 font-medium hidden md:table-cell">NOTES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ROUTES.map((route) => (
                          <tr key={route.name} className="border-b border-white/10 last:border-0">
                            <td className="px-5 py-4 font-bold text-[15px] whitespace-nowrap">
                              <Link href={route.href} className="hover:text-tennis transition-colors underline decoration-white/20 underline-offset-4 hover:decoration-tennis">
                                {route.name}
                              </Link>
                              {route.favorite && (
                                <span className="ml-2 align-middle" title="Pack favorite">
                                  <TennisBall size={14} />
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 font-data text-[13px] text-white/80 whitespace-nowrap">{route.dist}</td>
                            <td className="px-5 py-4 font-data text-[13px] text-white/80 hidden sm:table-cell">{route.surface}</td>
                            <td className="px-5 py-4 text-[14px] text-white/70 hidden md:table-cell">{route.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="font-data text-[11px] tracking-[0.15em] text-white/45 mt-4">
                  <TennisBall size={12} className="mr-1.5 -translate-y-px" />
                  = PACK FAVORITE · MORE ROUTES ADDED AS THE PACK GROWS
                </p>
              </motion.div>
            </div>
          </section>

          {/* ── Final CTA ────────────────────────────────── */}
          <section className="px-6 py-24 text-center">
            <motion.div {...fadeUp}>
              <TennisBall3D className="w-[170px] h-[170px] mx-auto -mb-3" />
              <h2 className="font-display text-[34px] sm:text-[50px] leading-[1.06] text-soil mb-4">
                Somewhere under the trees,
                <br />
                a dog is waiting on you
              </h2>
              <p className="text-[16px] text-soil/60 max-w-md mx-auto mb-10 leading-relaxed">
                Free to join. Two-minute setup. Fresh air guaranteed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link
                  href="/register"
                  className="w-full sm:w-auto bg-pine hover:bg-pine-deep text-white font-bold text-[15px] px-7 py-3.5 rounded-md transition-colors"
                >
                  Create a runner profile
                </Link>
                <Link
                  href="/register"
                  className="w-full sm:w-auto bg-clay hover:bg-clay-deep text-white font-bold text-[15px] px-7 py-3.5 rounded-md transition-colors"
                >
                  Create an owner profile
                </Link>
              </div>
            </motion.div>
          </section>

          {/* ── Footer ───────────────────────────────────── */}
          <footer className="bg-pine-deep text-white px-6 pt-16 pb-10">
            <div className="max-w-4xl mx-auto">
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
                <div className="lg:col-span-2">
                  <p className="font-display text-[24px] mb-3">Go Dogs Boston 🎾</p>
                  <p className="text-white/50 text-[14px] leading-relaxed max-w-xs">
                    Matching Boston runners with high-energy dogs and the owners
                    who love them.
                  </p>
                </div>

                {[
                  {
                    heading: 'PRODUCT',
                    links: [
                      { label: 'How it works', href: '/register' },
                      { label: 'Browse dogs', href: '/register' },
                      { label: 'Browse runners', href: '/register' },
                      { label: 'Safety', href: '/register' },
                    ],
                  },
                  {
                    heading: 'ROUTES',
                    links: [
                      { label: 'Castle Island', href: '/routes/castle-island' },
                      { label: 'Charles River', href: '/routes/charles-river' },
                      { label: 'Boston Common', href: '/routes/boston-common' },
                      { label: 'Jamaica Pond', href: '/routes/jamaica-pond' },
                    ],
                  },
                  {
                    heading: 'COMPANY',
                    links: [
                      { label: 'About', href: '/about' },
                      { label: 'Contact', href: '/contact' },
                      { label: 'Careers', href: '/careers' },
                    ],
                  },
                ].map((col) => (
                  <div key={col.heading}>
                    <p className="font-data text-[11px] tracking-[0.2em] text-white/35 mb-4">{col.heading}</p>
                    <ul className="space-y-2.5">
                      {col.links.map((link) => (
                        <li key={link.label}>
                          <Link href={link.href} className="text-[14px] text-white/65 hover:text-tennis transition-colors">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="font-data text-[12px] text-white/35">MADE IN BOSTON · © 2026 GO DOGS BOSTON 🎾</p>
                <div className="flex gap-5 font-data text-[12px] text-white/35">
                  <Link href="/terms" className="hover:text-white/70 transition-colors">TERMS</Link>
                  <Link href="/privacy" className="hover:text-white/70 transition-colors">PRIVACY</Link>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </MotionConfig>
    </ReactLenis>
  );
}
