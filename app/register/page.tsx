'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';

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

  return (
    <div className="min-h-screen bg-light-gray flex flex-col items-center justify-center px-6 pt-20 pb-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold text-near-black leading-tight tracking-tight">
            Create your account
          </h1>
        </div>

        {step === 'role' && (
          <div className="space-y-3">
            <p className="text-black/48 text-sm text-center tracking-[-0.014em] mb-4">I am a…</p>
            <button
              onClick={() => { setRole('owner'); setStep('email'); }}
              className="w-full bg-white rounded-lg apple-shadow p-5 text-left hover:ring-2 hover:ring-apple-blue transition-all"
            >
              <div className="text-3xl mb-1">🐶</div>
              <div className="font-semibold text-near-black text-[17px] tracking-[-0.024em]">Dog Owner</div>
              <div className="text-sm text-black/48 tracking-[-0.014em]">Find a runner to join my dog&apos;s run</div>
            </button>
            <button
              onClick={() => { setRole('runner'); setStep('email'); }}
              className="w-full bg-white rounded-lg apple-shadow p-5 text-left hover:ring-2 hover:ring-apple-blue transition-all"
            >
              <div className="text-3xl mb-1">🏃</div>
              <div className="font-semibold text-near-black text-[17px] tracking-[-0.024em]">Runner</div>
              <div className="text-sm text-black/48 tracking-[-0.014em]">Find a dog to run with around Boston</div>
            </button>
            <p className="text-center text-sm text-black/48 pt-3 tracking-[-0.014em]">
              Already have an account?{' '}
              <Link href="/login" className="text-link-blue hover:underline font-medium">Sign in</Link>
            </p>
          </div>
        )}

        {step === 'email' && (
          <div className="space-y-4">
            <button onClick={() => setStep('role')} className="text-sm text-link-blue hover:underline">← Back</button>
            <h2 className="text-xl font-semibold text-near-black tracking-tight">Your email address</h2>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
              className="w-full border border-black/10 rounded-lg px-4 py-3 text-[17px] tracking-[-0.024em] focus:outline-none focus:ring-2 focus:ring-apple-blue bg-white text-near-black placeholder:text-black/30"
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
          </div>
        )}

        {step === 'passkey' && (
          <div className="space-y-4">
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
          </div>
        )}
      </div>
    </div>
  );
}
