import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-orange-50">
      {/* Hero */}
      <div className="px-6 pt-28 pb-16 text-center">
        <div className="text-7xl mb-6">🐾</div>
        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-3">
          Find your<br />
          <span className="text-orange-500">perfect run buddy</span>
        </h1>
        <p className="text-gray-500 text-base max-w-xs mx-auto mb-8">
          Match Boston dog owners with local runners around Castle Island and beyond.
        </p>
        <Link
          href="/register"
          className="inline-block bg-orange-500 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:bg-orange-600 active:scale-95 transition-all"
        >
          Get started — it&apos;s free
        </Link>
      </div>

      {/* How it works */}
      <div className="px-6 pb-16 max-w-sm mx-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-5 text-center">How it works</h2>
        <div className="space-y-4">
          <Step icon="🔑" title="Create an account" desc="Sign up with a passkey — no password needed. Just Face ID or Touch ID." />
          <Step icon="🗺️" title="Pick your route" desc="Choose from pre-defined Boston running routes like Castle Island." />
          <Step icon="🤝" title="Find your match" desc="Dog owners see runners. Runners see dogs. Browse by pace and contact directly." />
        </div>
      </div>

      {/* Routes preview */}
      <div className="px-6 pb-16 max-w-sm mx-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Routes</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <div className="text-3xl">🏝️</div>
            <div>
              <p className="font-bold text-gray-900">Castle Island</p>
              <p className="text-sm text-gray-500">South Boston · ~2.5 mile loop · Waterfront</p>
            </div>
            <span className="ml-auto text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">
              Active
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">More routes coming soon</p>
      </div>

      {/* Footer CTA */}
      <div className="px-6 pb-16 text-center">
        <p className="text-gray-500 text-sm mb-4">Already have an account?</p>
        <Link href="/register" className="text-orange-500 font-semibold text-sm">
          Sign in with passkey →
        </Link>
      </div>
    </main>
  );
}

function Step({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-gray-500 text-sm">{desc}</p>
      </div>
    </div>
  );
}
