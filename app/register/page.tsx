'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { spring, press } from '@/components/ux';

type Step = 'role' | 'email' | 'passkey';

/* iOS navigation push/pop between steps */
const stepVariants = {
  enter: (dir: number) => ({ x: dir * 56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -56, opacity: 0 }),
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('role');
  const [dir, setDir] = useState(1);

  function goTo(next: Step, direction: 1 | -1) {
    setDir(direction);
    setStep(next);
  }
  const [role, setRole] = useState<'owner' | 'runner' | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // null until mounted — avoids a server/client hydration mismatch
  const [supported, setSupported] = useState<boolean | null>(null);
  // Set when a guest clicked a profile while browsing ("?meet=Tank&side=dogs")
  const [meet, setMeet] = useState('');
  const [meetSide, setMeetSide] = useState<'dogs' | 'runners' | ''>('');

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    const params = new URLSearchParams(window.location.search);
    // Names only — strip anything spammy/URL-like from the shareable param
    const rawMeet = params.get('meet') ?? '';
    setMeet(rawMeet.replace(/[^\p{L}\p{N} .''-]/gu, '').trim().slice(0, 30));
    const side = params.get('side');
    setMeetSide(side === 'dogs' || side === 'runners' ? side : '');
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

  const cardCls = 'w-full max-w-sm bg-linen border border-soil/10 rounded-xl shadow-sm';

  return (
    <div className="min-h-screen bg-oat flex flex-col items-center justify-center px-6 pt-20 pb-10">
      <div className="text-center mb-8">
        {meet && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="inline-block bg-linen border border-tennis rounded-full px-4 py-1.5 text-[13px] font-bold text-soil mb-3"
          >
            🐾 {meet} is waiting on the other side
          </motion.p>
        )}
        <h1 className="font-display text-[26px] text-soil leading-tight">Create your account</h1>
        <p className="text-sm text-soil/55 mt-1.5">
          Boston only, for now — first runs at Castle Island &amp; nearby parks.
        </p>
      </div>

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        {step === 'role' && (
          <motion.div
            key="role"
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={spring}
            className="w-full flex flex-col items-center"
          >
            <p className="text-soil/55 text-sm text-center mb-4">I am a…</p>
            <motion.button
              {...press}
              className={`${cardCls} p-5 text-left cursor-pointer mb-3 hover:border-pine/50 hover:shadow-md transition-shadow`}
              onClick={() => {
                setRole('owner');
                // Owners browse runners — a dog they clicked won't be in their feed
                if (meetSide === 'dogs') setMeet('');
                goTo('email', 1);
              }}
            >
              <div className="text-3xl mb-1">🐶</div>
              <div className="font-bold text-soil text-[17px]">Dog Owner</div>
              <div className="text-sm text-soil/55">Find a runner to join my dog&apos;s run</div>
            </motion.button>
            <motion.button
              {...press}
              className={`${cardCls} p-5 text-left cursor-pointer hover:border-pine/50 hover:shadow-md transition-shadow`}
              onClick={() => {
                setRole('runner');
                // Runners browse dogs — a runner they clicked won't be in their feed
                if (meetSide === 'runners') setMeet('');
                goTo('email', 1);
              }}
            >
              <div className="text-3xl mb-1">🏃</div>
              <div className="font-bold text-soil text-[17px]">Runner</div>
              <div className="text-sm text-soil/55">Find a dog to run with around Boston</div>
            </motion.button>
            <p className="text-center text-sm text-soil/55 pt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-pine font-bold hover:underline">Sign in</Link>
            </p>
          </motion.div>
        )}

        {step === 'email' && (
          <motion.div
            key="email"
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={spring}
            className={`${cardCls} p-6 space-y-4`}
          >
            <button onClick={() => goTo('role', -1)} className="text-sm text-pine font-medium hover:underline">← Back</button>
            <h2 className="text-xl font-bold text-soil">Your email address</h2>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
              className="w-full border border-soil/15 rounded-lg px-4 py-3 text-[17px] focus:outline-none focus:ring-2 focus:ring-pine bg-white text-soil placeholder:text-soil/30"
              autoFocus
              autoComplete="email"
            />
            {error && <p className="text-clay-deep text-sm font-medium">{error}</p>}
            <motion.button
              {...press}
              onClick={() => { if (email.includes('@')) goTo('passkey', 1); }}
              disabled={!email.includes('@')}
              className="w-full bg-pine hover:bg-pine-deep text-oat font-bold py-3 rounded-lg disabled:opacity-40 text-[16px] transition-colors"
            >
              Continue
            </motion.button>
          </motion.div>
        )}

        {step === 'passkey' && (
          <motion.div
            key="passkey"
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={spring}
            className={`${cardCls} p-6 space-y-4`}
          >
            <button onClick={() => goTo('email', -1)} className="text-sm text-pine font-medium hover:underline">← Back</button>
            <h2 className="text-xl font-bold text-soil">Set up your passkey</h2>
            <p className="text-soil/55 text-sm">
              A passkey uses Face ID, Touch ID, or your device PIN — no password needed.
            </p>
            {error && <p className="text-clay-deep text-sm font-medium">{error}</p>}
            <motion.button
              {...press}
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-pine hover:bg-pine-deep text-oat font-bold py-3 rounded-lg disabled:opacity-60 text-[16px] transition-colors"
            >
              {loading ? 'Waiting for passkey…' : 'Create passkey'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
