'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { springGentle, press } from '@/components/ux';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // null until mounted — avoids a server/client hydration mismatch
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
  }, []);

  if (supported === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-oat">
        <p className="text-soil/60 text-center text-[17px]">
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
    <div className="min-h-screen bg-oat flex flex-col items-center justify-center px-6 pt-20 pb-10">
      <div className="text-center mb-6">
        <h1 className="font-display text-[26px] text-soil leading-tight">Welcome back</h1>
        <p className="text-sm text-soil/55 mt-1">Sign in with your passkey</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springGentle}
        className="w-full max-w-sm bg-linen border border-soil/10 rounded-xl shadow-sm p-6 space-y-4"
      >
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
          className="w-full border border-soil/15 rounded-lg px-4 py-3 text-[17px] focus:outline-none focus:ring-2 focus:ring-pine bg-white text-soil placeholder:text-soil/30"
          autoFocus
          autoComplete="email"
          onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && handleLogin()}
        />
        {error && <p className="text-clay-deep text-sm font-medium">{error}</p>}
        <motion.button
          {...press}
          onClick={handleLogin}
          disabled={loading || !email.includes('@')}
          className="w-full bg-pine hover:bg-pine-deep text-oat font-bold py-3 rounded-lg disabled:opacity-40 text-[16px] transition-colors"
        >
          {loading ? 'Waiting for passkey…' : 'Sign in with passkey'}
        </motion.button>
      </motion.div>

      <p className="text-center text-sm text-soil/55 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-pine font-bold hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
