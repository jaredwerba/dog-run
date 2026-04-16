'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';

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
    <div className="min-h-screen bg-light-gray flex flex-col items-center justify-center px-6 pt-20 pb-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-[28px] font-semibold text-near-black leading-tight tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-black/48 mt-1 tracking-[-0.014em]">Sign in with your passkey</p>
        </div>

        <div className="bg-white rounded-lg apple-shadow p-6 space-y-4">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
            className="w-full border border-black/10 rounded-lg px-4 py-3 text-[17px] tracking-[-0.024em] focus:outline-none focus:ring-2 focus:ring-apple-blue bg-white text-near-black placeholder:text-black/30"
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
        </div>

        <p className="text-center text-sm text-black/48 tracking-[-0.014em]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-link-blue hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
