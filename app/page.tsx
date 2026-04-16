'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import LiquidGlassWrapper, { GlassPanel } from '@/components/LiquidGlassWrapper';

const CastleIslandMap = dynamic(() => import('@/components/CastleIslandMap'), {
  ssr: false,
  loading: () => <div className="w-full h-64 sm:h-72 rounded-2xl bg-light-gray animate-pulse" />,
});

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero — full-screen video, glass only on buttons */}
      <LiquidGlassWrapper
        className="relative min-h-[100svh] flex items-center justify-center overflow-hidden"
        defaults={{
          cornerRadius: 980,
          refraction: 0.025,
          blurAmount: 0.3,
          chromAberration: 0.015,
          edgeHighlight: 0.06,
          specular: 0.25,
          fresnel: 0.85,
          shadowOpacity: 0.3,
          shadowSpread: 14,
          tintStrength: 0.04,
          zRadius: 18,
        }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/hero-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover"
          data-dynamic
          src="/hero.mp4"
        />

        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 text-center px-6 max-w-lg">
          <p className="text-[12px] font-semibold text-white/70 uppercase tracking-[0.2em] mb-4">
            Boston · Castle Island
          </p>
          <h1 className="text-[44px] sm:text-[60px] font-semibold text-white leading-[1.05] tracking-[-0.01em] mb-5 drop-shadow-lg">
            Your dog needs<br />a running buddy.
          </h1>
          <p className="text-[18px] leading-[1.4] tracking-[-0.024em] text-white/85 max-w-sm mx-auto mb-12 drop-shadow">
            We match high-energy dogs with local runners — so your pup gets the run they need, even when you can&apos;t.
          </p>
        </div>

        {/* Glass button group */}
        <GlassPanel
          className="absolute z-20 left-1/2 -translate-x-1/2 bottom-[18%] sm:bottom-auto sm:top-[calc(50%+110px)] flex gap-2 p-2"
          config={{
            cornerRadius: 980,
            blurAmount: 0.35,
            refraction: 0.025,
            specular: 0.3,
            fresnel: 0.9,
            tintStrength: 0.06,
            brightness: 0.08,
            shadowOpacity: 0.3,
            shadowSpread: 18,
          }}
        >
          <Link
            href="/register"
            className="block px-6 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-semibold text-[15px] tracking-[-0.014em] whitespace-nowrap transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="block px-6 py-2.5 rounded-full text-white font-semibold text-[15px] tracking-[-0.014em] whitespace-nowrap hover:bg-white/10 transition-colors"
          >
            Sign in
          </Link>
        </GlassPanel>
      </LiquidGlassWrapper>

      {/* Why — dark cinematic section */}
      <section className="bg-black text-white px-6 py-24">
        <div className="max-w-md mx-auto">
          <p className="text-[12px] font-semibold text-white/50 uppercase tracking-[0.2em] mb-3 text-center">
            Why DogRun
          </p>
          <h2 className="text-[34px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.01em] mb-12 text-center">
            Active dogs<br />live longer.
          </h2>

          <div className="space-y-10">
            <Stat
              big="60%"
              label="of high-energy breeds get less exercise than they need"
            />
            <Stat
              big="2×"
              label="lifespan in dogs that get regular daily exercise"
            />
            <Stat
              big="15 min"
              label="to find a runner in your neighborhood"
            />
          </div>
        </div>
      </section>

      {/* Two-sided value props */}
      <section className="bg-light-gray px-6 py-20">
        <div className="max-w-md mx-auto space-y-12">
          <ValueCard
            kicker="For dog owners"
            headline="Can&apos;t run today? Someone else will."
            bullets={[
              'High-energy breeds need 60+ minutes of cardio daily',
              'Skip the guilt when work, weather, or injury gets in the way',
              'Your dog comes home tired, happy, and healthier',
            ]}
            cta="Find a runner"
            href="/register"
          />
          <ValueCard
            kicker="For runners"
            headline="Run with the best training partner you&apos;ll ever have."
            bullets={[
              'Free zone-2 training partner that never cancels',
              'Animal companionship without the responsibility',
              'Help a dog and owner in your neighborhood',
            ]}
            cta="Become a runner"
            href="/register"
          />
        </div>
      </section>

      {/* How it works — simple 2-path */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-md mx-auto">
          <h2 className="text-[34px] sm:text-[40px] font-semibold text-near-black leading-[1.1] tracking-[-0.01em] mb-12 text-center">
            How it works
          </h2>
          <div className="space-y-6">
            <SimpleStep
              num="1"
              title="Create your profile"
              desc="Sign up as a dog owner or runner. Takes 60 seconds with passkey — no password."
            />
            <SimpleStep
              num="2"
              title="Match locally"
              desc="Owners see runners. Runners see dogs. Filter by pace and availability."
            />
            <SimpleStep
              num="3"
              title="Run together"
              desc="Message in-app, agree on a time, meet at Castle Island. That&apos;s it."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-light-gray px-6 py-20 text-center">
        <h2 className="text-[32px] sm:text-[40px] font-semibold text-near-black leading-[1.1] tracking-[-0.01em] mb-3">
          Ready to find your match?
        </h2>
        <p className="text-[17px] text-black/60 max-w-xs mx-auto mb-8 tracking-[-0.014em]">
          Free to join. Castle Island and beyond.
        </p>
        <Link
          href="/register"
          className="inline-block bg-apple-blue hover:bg-apple-blue-hover text-white font-semibold text-[17px] px-8 py-3.5 rounded-full transition-colors"
        >
          Get started — it&apos;s free
        </Link>
      </section>

      {/* Routes */}
      <section className="bg-white px-6 pb-24">
        <div className="max-w-md mx-auto">
          <p className="text-[12px] font-semibold text-black/40 uppercase tracking-[0.2em] mb-4 text-center pt-4">
            Routes
          </p>

          <div className="bg-light-gray rounded-2xl overflow-hidden apple-shadow">
            {/* Map */}
            <CastleIslandMap />

            {/* Caption */}
            <div className="flex items-center gap-4 p-5">
              <div className="text-3xl">🏝️</div>
              <div className="flex-1">
                <p className="font-semibold text-near-black text-[17px] tracking-[-0.024em]">Castle Island</p>
                <p className="text-sm text-black/48 tracking-[-0.014em]">South Boston · Fort perimeter · Waterfront</p>
              </div>
              <span className="text-xs bg-apple-blue text-white font-medium px-2.5 py-1 rounded-full">
                Live
              </span>
            </div>
          </div>

          <a
            href="https://maps.apple.com/?q=Castle+Island+South+Boston&ll=42.3358,-71.0085&z=15"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center mt-3 text-link-blue font-medium text-sm hover:underline"
          >
            Open in Apple Maps →
          </a>
          <p className="text-xs text-black/40 text-center mt-2 tracking-[-0.008em]">More Boston routes coming soon</p>
        </div>
      </section>
    </main>
  );
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-[56px] sm:text-[72px] font-semibold leading-none tracking-[-0.02em] text-white mb-2">
        {big}
      </p>
      <p className="text-[15px] text-white/60 max-w-[260px] mx-auto leading-[1.4] tracking-[-0.014em]">
        {label}
      </p>
    </div>
  );
}

function ValueCard({
  kicker,
  headline,
  bullets,
  cta,
  href,
}: {
  kicker: string;
  headline: string;
  bullets: string[];
  cta: string;
  href: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-7 apple-shadow">
      <p className="text-[12px] font-semibold text-apple-blue uppercase tracking-[0.15em] mb-3">
        {kicker}
      </p>
      <h3 className="text-[26px] font-semibold text-near-black leading-[1.15] tracking-[-0.01em] mb-5">
        {headline}
      </h3>
      <ul className="space-y-3 mb-6">
        {bullets.map((b) => (
          <li key={b} className="flex gap-3 items-start text-[15px] text-black/70 tracking-[-0.014em] leading-[1.4]">
            <span className="text-apple-blue mt-0.5 shrink-0">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="inline-block text-apple-blue font-semibold text-[15px] hover:underline"
      >
        {cta} →
      </Link>
    </div>
  );
}

function SimpleStep({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-9 h-9 rounded-full bg-apple-blue text-white flex items-center justify-center font-semibold text-sm shrink-0">
        {num}
      </div>
      <div>
        <p className="font-semibold text-near-black text-[17px] tracking-[-0.024em] mb-1">{title}</p>
        <p className="text-[15px] text-black/60 leading-[1.4] tracking-[-0.014em]">{desc}</p>
      </div>
    </div>
  );
}
