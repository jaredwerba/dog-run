'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';

type Step = 'role' | 'email' | 'passkey';
type Mode = 'register' | 'login';

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('register');
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<'owner' | 'runner' | null>(null);
  const [username, setUsername] = useState('');
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
        body: JSON.stringify({ username, role }),
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

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      const beginRes = await fetch('/api/auth/login/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
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
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center px-6 pb-10 pt-20">
      <div className="w-full max-w-sm">
        {/* Mode toggle */}
        <div className="flex bg-white rounded-full p-1 shadow-sm mb-8">
          {(['register', 'login'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setStep('role'); setError(''); }}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
                mode === m ? 'bg-orange-500 text-white' : 'text-gray-500'
              }`}
            >
              {m === 'register' ? 'Create account' : 'Sign in'}
            </button>
          ))}
        </div>

        {mode === 'register' ? (
          <>
            {step === 'role' && (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-gray-900 text-center">I am a…</h1>
                <button
                  onClick={() => { setRole('owner'); setStep('email'); }}
                  className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-orange-400 transition-colors"
                >
                  <div className="text-3xl mb-1">🐶</div>
                  <div className="font-bold text-gray-900">Dog Owner</div>
                  <div className="text-sm text-gray-500">Find a runner to join my dog's run</div>
                </button>
                <button
                  onClick={() => { setRole('runner'); setStep('email'); }}
                  className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-orange-400 transition-colors"
                >
                  <div className="text-3xl mb-1">🏃</div>
                  <div className="font-bold text-gray-900">Runner</div>
                  <div className="text-sm text-gray-500">Find a dog to run with around Boston</div>
                </button>
              </div>
            )}

            {step === 'email' && (
              <div className="space-y-4">
                <button onClick={() => setStep('role')} className="text-sm text-gray-500">← Back</button>
                <h1 className="text-2xl font-bold text-gray-900">Your email address</h1>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
                  autoFocus
                  autoComplete="email"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  onClick={() => { if (username.includes('@')) setStep('passkey'); }}
                  disabled={!username.includes('@')}
                  className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 'passkey' && (
              <div className="space-y-4">
                <button onClick={() => setStep('email')} className="text-sm text-gray-500">← Back</button>
                <h1 className="text-2xl font-bold text-gray-900">Set up your passkey</h1>
                <p className="text-gray-500 text-sm">
                  A passkey uses Face ID, Touch ID, or your device PIN — no password needed.
                </p>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <>🔑 Create passkey</>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Login flow */
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 text-center">Welcome back</h1>
            <input
              type="email"
              placeholder="you@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
              autoFocus
              autoComplete="email"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading || !username.includes('@')}
              className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <span className="animate-spin">⏳</span> : <>🔑 Sign in with passkey</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
