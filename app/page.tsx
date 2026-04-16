import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero — full-screen video background */}
      <div className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/hero-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-lg">
          <p className="text-[15px] font-medium text-white/60 tracking-[-0.024em] mb-3 uppercase tracking-widest">
            Boston&apos;s dog-runner matching app
          </p>
          <h1 className="text-[44px] sm:text-[56px] font-semibold text-white leading-[1.07] tracking-[-0.005em] mb-4">
            Find your<br />perfect run buddy.
          </h1>
          <p className="text-[17px] leading-[1.47] tracking-[-0.024em] text-white/70 max-w-xs mx-auto mb-8">
            Match dog owners with local runners around Castle Island and beyond.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-block bg-apple-blue hover:bg-apple-blue-hover text-white font-medium text-[17px] px-7 py-2.5 rounded-lg transition-colors"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="inline-block text-white font-medium text-[17px] px-7 py-2.5 rounded-[980px] border border-white/30 hover:border-white/60 hover:bg-white/10 transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* How it works — light section */}
      <div className="bg-light-gray px-6 py-16 max-w-sm mx-auto">
        <h2 className="text-2xl font-semibold text-near-black tracking-tight text-center mb-8">
          How it works
        </h2>
        <div className="space-y-5">
          <Step icon="🔑" title="Create an account" desc="Sign up with a passkey — no password needed. Just Face ID or Touch ID." />
          <Step icon="🗺️" title="Pick your route" desc="Choose from pre-defined Boston running routes like Castle Island." />
          <Step icon="🤝" title="Find your match" desc="Dog owners see runners. Runners see dogs. Browse by pace and message directly." />
        </div>
      </div>

      {/* Routes — continues light section */}
      <div className="bg-light-gray px-6 pb-20 max-w-sm mx-auto">
        <h2 className="text-2xl font-semibold text-near-black tracking-tight text-center mb-5">
          Routes
        </h2>
        <div className="bg-white rounded-lg apple-shadow overflow-hidden">
          <div className="flex items-center gap-4 p-5">
            <div className="text-3xl">🏝️</div>
            <div>
              <p className="font-semibold text-near-black text-[17px] tracking-[-0.024em]">Castle Island</p>
              <p className="text-sm text-black/48 tracking-[-0.014em]">South Boston · ~2.5 mile loop · Waterfront</p>
            </div>
            <span className="ml-auto text-xs bg-apple-blue text-white font-medium px-2.5 py-1 rounded-full">
              Active
            </span>
          </div>
        </div>
        <p className="text-xs text-black/48 text-center mt-4 tracking-[-0.008em]">More routes coming soon</p>
      </div>
    </main>
  );
}

function Step({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-lg bg-dark-surface flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-near-black text-sm tracking-[-0.014em]">{title}</p>
        <p className="text-sm text-black/60 tracking-[-0.014em]">{desc}</p>
      </div>
    </div>
  );
}
