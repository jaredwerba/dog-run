'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import LiquidGlassWrapper, { GlassPanel } from '@/components/LiquidGlassWrapper';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!browserSupportsWebAuthn()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-light-gray">
        <p className="text-black/60 text-center text-[17px] tracking-[-0.024em]">
          Your browser doesn&apos;t support passkeys. Try Chrome, Safari, or Edge on a modern device.
        </p>
      </div>
    );
  }

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      const beginRes = await fetch('/api/auth/login/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email }),
      });
      const beginData = await beginRes.json();
      if (!beginRes.ok) throw new Error(beginData.error);

      const authResp = await startAuthentication({ optionsJSON: beginData });

      const completeRes = await fetch('/api/auth/login/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authResp),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeData.error);

      router.push('/browse');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg.includes('cancelled') || msg.includes('AbortError') ? 'Passkey cancelled.' : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LiquidGlassWrapper
      className="min-h-screen bg-light-gray flex flex-col items-center justify-center px-6 pt-20 pb-10"
      defaults={{
        cornerRadius: 20,
        refraction: 0.015,
        blurAmount: 0.15,
        specular: 0.08,
        fresnel: 0.5,
        shadowOpacity: 0.12,
        shadowSpread: 10,
        tintStrength: 0.03,
        zRadius: 16,
      }}
    >
      {/* Background visual element for glass refraction */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-apple-blue/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-bright-blue/8 blur-3xl" />
      </div>

      <div className="text-center mb-6 relative z-10">
        <h1 className="text-[28px] font-semibold text-near-black leading-tight tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-black/48 mt-1 tracking-[-0.014em]">Sign in with your passkey</p>
      </div>

      <GlassPanel
        className="w-full max-w-sm p-6 space-y-4"
        config={{
          cornerRadius: 20,
          blurAmount: 0.2,
          refraction: 0.015,
          specular: 0.1,
          brightness: 0.03,
        }}
      >
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
          className="w-full border border-black/10 rounded-lg px-4 py-3 text-[17px] tracking-[-0.024em] focus:outline-none focus:ring-2 focus:ring-apple-blue bg-white/80 text-near-black placeholder:text-black/30"
          autoFocus
          autoComplete="email"
          onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && handleLogin()}
        />
        {error && <p className="text-red-500 text-sm tracking-[-0.014em]">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading || !email.includes('@')}
          className="w-full bg-apple-blue hover:bg-apple-blue-hover text-white font-medium py-3 rounded-lg disabled:opacity-40 flex items-center justify-center gap-2 text-[17px] transition-colors"
        >
          {loading ? <span className="animate-spin">⏳</span> : 'Sign in with passkey'}
        </button>
      </GlassPanel>

      <p className="text-center text-sm text-black/48 tracking-[-0.014em] mt-6 relative z-10">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-link-blue hover:underline font-medium">
          Create one
        </Link>
      </p>
    </LiquidGlassWrapper>
  );
}
