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
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-gray-600 text-center">
          Your browser doesn't support passkeys. Try Chrome, Safari, or Edge on a modern device.
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
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center px-6 pt-20 pb-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐾</div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        </div>

        {step === 'role' && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm text-center">I am a…</p>
            <button
              onClick={() => { setRole('owner'); setStep('email'); }}
              className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-orange-400 transition-colors"
            >
              <div className="text-3xl mb-1">🐶</div>
              <div className="font-bold text-gray-900">Dog Owner</div>
              <div className="text-sm text-gray-500">Find a runner to join my dog&apos;s run</div>
            </button>
            <button
              onClick={() => { setRole('runner'); setStep('email'); }}
              className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-orange-400 transition-colors"
            >
              <div className="text-3xl mb-1">🏃</div>
              <div className="font-bold text-gray-900">Runner</div>
              <div className="text-sm text-gray-500">Find a dog to run with around Boston</div>
            </button>
            <p className="text-center text-sm text-gray-500 pt-2">
              Already have an account?{' '}
              <Link href="/login" className="text-orange-500 font-semibold">Sign in</Link>
            </p>
          </div>
        )}

        {step === 'email' && (
          <div className="space-y-4">
            <button onClick={() => setStep('role')} className="text-sm text-gray-500">← Back</button>
            <h2 className="text-xl font-bold text-gray-900">Your email address</h2>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
              autoFocus
              autoComplete="email"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={() => { if (email.includes('@')) setStep('passkey'); }}
              disabled={!email.includes('@')}
              className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'passkey' && (
          <div className="space-y-4">
            <button onClick={() => setStep('email')} className="text-sm text-gray-500">← Back</button>
            <h2 className="text-xl font-bold text-gray-900">Set up your passkey</h2>
            <p className="text-gray-500 text-sm">
              A passkey uses Face ID, Touch ID, or your device PIN — no password needed.
            </p>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <span className="animate-spin">⏳</span> : <>🔑 Create passkey</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
