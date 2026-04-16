'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import LiquidGlassWrapper, { GlassPanel } from '@/components/LiquidGlassWrapper';

type Step = 'role' | 'email' | 'passkey';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<'owner' | 'runner' | null>(null);
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

  async function handleRegister() {
    setError('');
    setLoading(true);
    try {
      const beginRes = await fetch('/api/auth/register/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, role }),
      });
      const beginData = await beginRes.json();
      if (!beginRes.ok) throw new Error(beginData.error);

      const attResp = await startRegistration({ optionsJSON: beginData });

      const completeRes = await fetch('/api/auth/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attResp),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeData.error);

      router.push('/profile/setup');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg.includes('cancelled') || msg.includes('AbortError') ? 'Passkey cancelled.' : msg);
    } finally {
      setLoading(false);
    }
  }

  const glassDefaults = {
    cornerRadius: 20,
    refraction: 0.015,
    blurAmount: 0.15,
    specular: 0.08,
    fresnel: 0.5,
    shadowOpacity: 0.12,
    shadowSpread: 10,
    tintStrength: 0.03,
    zRadius: 16,
  };

  return (
    <LiquidGlassWrapper
      className="min-h-screen bg-light-gray flex flex-col items-center justify-center px-6 pt-20 pb-10"
      defaults={glassDefaults}
    >
      {/* Background visuals for glass refraction */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-10 w-64 h-64 rounded-full bg-apple-blue/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-10 w-72 h-72 rounded-full bg-bright-blue/8 blur-3xl" />
      </div>

      <div className="text-center mb-8 relative z-10">
        <h1 className="text-[28px] font-semibold text-near-black leading-tight tracking-tight">
          Create your account
        </h1>
      </div>

      {step === 'role' && (
        <>
          <p className="text-black/48 text-sm text-center tracking-[-0.014em] mb-4 relative z-10">I am a…</p>
          <GlassPanel
            className="w-full max-w-sm p-5 text-left cursor-pointer mb-3"
            config={{ cornerRadius: 20, button: true, blurAmount: 0.2, specular: 0.1 }}
            onClick={() => { setRole('owner'); setStep('email'); }}
          >
            <div className="text-3xl mb-1">🐶</div>
            <div className="font-semibold text-near-black text-[17px] tracking-[-0.024em]">Dog Owner</div>
            <div className="text-sm text-black/48 tracking-[-0.014em]">Find a runner to join my dog&apos;s run</div>
          </GlassPanel>
          <GlassPanel
            className="w-full max-w-sm p-5 text-left cursor-pointer"
            config={{ cornerRadius: 20, button: true, blurAmount: 0.2, specular: 0.1 }}
            onClick={() => { setRole('runner'); setStep('email'); }}
          >
            <div className="text-3xl mb-1">🏃</div>
            <div className="font-semibold text-near-black text-[17px] tracking-[-0.024em]">Runner</div>
            <div className="text-sm text-black/48 tracking-[-0.014em]">Find a dog to run with around Boston</div>
          </GlassPanel>
          <p className="text-center text-sm text-black/48 pt-4 tracking-[-0.014em] relative z-10">
            Already have an account?{' '}
            <Link href="/login" className="text-link-blue hover:underline font-medium">Sign in</Link>
          </p>
        </>
      )}

      {step === 'email' && (
        <GlassPanel
          className="w-full max-w-sm p-6 space-y-4"
          config={{ cornerRadius: 20, blurAmount: 0.2, specular: 0.1 }}
        >
          <button onClick={() => setStep('role')} className="text-sm text-link-blue hover:underline">← Back</button>
          <h2 className="text-xl font-semibold text-near-black tracking-tight">Your email address</h2>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
            className="w-full border border-black/10 rounded-lg px-4 py-3 text-[17px] tracking-[-0.024em] focus:outline-none focus:ring-2 focus:ring-apple-blue bg-white/80 text-near-black placeholder:text-black/30"
            autoFocus
            autoComplete="email"
          />
          {error && <p className="text-red-500 text-sm tracking-[-0.014em]">{error}</p>}
          <button
            onClick={() => { if (email.includes('@')) setStep('passkey'); }}
            disabled={!email.includes('@')}
            className="w-full bg-apple-blue hover:bg-apple-blue-hover text-white font-medium py-3 rounded-lg disabled:opacity-40 text-[17px] transition-colors"
          >
            Continue
          </button>
        </GlassPanel>
      )}

      {step === 'passkey' && (
        <GlassPanel
          className="w-full max-w-sm p-6 space-y-4"
          config={{ cornerRadius: 20, blurAmount: 0.2, specular: 0.1 }}
        >
          <button onClick={() => setStep('email')} className="text-sm text-link-blue hover:underline">← Back</button>
          <h2 className="text-xl font-semibold text-near-black tracking-tight">Set up your passkey</h2>
          <p className="text-black/48 text-sm tracking-[-0.014em]">
            A passkey uses Face ID, Touch ID, or your device PIN — no password needed.
          </p>
          {error && <p className="text-red-500 text-sm tracking-[-0.014em]">{error}</p>}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-apple-blue hover:bg-apple-blue-hover text-white font-medium py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2 text-[17px] transition-colors"
          >
            {loading ? <span className="animate-spin">⏳</span> : 'Create passkey'}
          </button>
        </GlassPanel>
      )}
    </LiquidGlassWrapper>
  );
}
