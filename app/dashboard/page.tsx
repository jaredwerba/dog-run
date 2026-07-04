'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import { spring } from '@/components/ux';

interface KindWord {
  comment: string;
  photo_url: string | null;
  created_at: string;
  runner_name: string | null;
}

interface DashboardData {
  role: 'owner' | 'runner';
  runsWeek: number;
  runsMonth: number;
  runsYear: number;
  milesWeek: number;
  milesMonth: number;
  milesYear: number;
  buddies: number;
  favorites: number;
  upcoming: number;
  // owner-only
  kindWords: KindWord[];
  goal: number | null;
  milesThisWeek: number;
  goalHitThisWeek: boolean;
  weeksHitGoal: number;
  // runner-only
  dogsHelped: number;
  weeksActive: number;
}

function StatCard({ label, value, sub, delay = 0 }: { label: string; value: string | number; sub?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay }}
      className="bg-linen border border-soil/10 rounded-xl p-4"
    >
      <p className="font-display text-[30px] text-soil leading-none mb-1">{value}</p>
      <p className="text-[12px] text-soil/55">{label}</p>
      {sub && <p className="font-data text-[10px] tracking-[0.1em] text-clay mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => {
        if (r.status === 401) { router.push('/browse'); return null; }
        return r.json();
      })
      .then((d) => { if (d) setData(d); });
  }, [router]);

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-soil/50 text-sm">Loading…</div>;
  }

  const isOwner = data.role === 'owner';

  return (
    <div className="min-h-screen bg-oat pt-16 pb-24">
      <div className="max-w-sm mx-auto px-4 space-y-5">
        <div>
          <p className="font-data text-[11px] tracking-[0.2em] text-clay mb-1">YOUR STATS</p>
          <h1 className="font-display text-[24px] text-soil leading-tight">
            {isOwner ? "Your dog's dashboard" : 'Your dashboard'}
          </h1>
          <p className="text-sm text-soil/55 mt-1">
            {isOwner
              ? 'Every run a runner has booked with your dog.'
              : 'Every run you have booked with a dog.'}
          </p>
        </div>

        {/* Runner: a warm line, not a scoreboard */}
        {!isOwner && data.dogsHelped > 0 && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="font-display text-[20px] text-soil leading-snug"
          >
            You&apos;ve helped {data.dogsHelped} {data.dogsHelped === 1 ? 'dog' : 'dogs'} get
            their miles in{data.weeksActive > 1 ? `, across ${data.weeksActive} weeks` : ''}. 🎾
          </motion.p>
        )}

        {/* Owner: this week's goal — a gentle win, not a bar to grind */}
        {isOwner && data.goalHitThisWeek && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="bg-tennis/25 border border-tennis/50 rounded-xl p-4 text-center"
          >
            <p className="font-display text-[18px] text-soil">Weekly goal met this week 🎾</p>
            {data.weeksHitGoal > 1 && (
              <p className="text-[13px] text-soil/60 mt-0.5">{data.weeksHitGoal} weeks running — good stretch.</p>
            )}
          </motion.div>
        )}

        {/* Owner: kind words a runner left about the dog */}
        {isOwner && data.kindWords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.05 }}
          >
            <h2 className="font-data text-[11px] tracking-[0.18em] text-clay mb-2">KIND WORDS ABOUT YOUR DOG</h2>
            <div className="space-y-2.5">
              {data.kindWords.map((kw) => (
                <figure key={kw.created_at} className="bg-linen border border-soil/10 rounded-xl p-4">
                  {kw.photo_url && (
                    <Image
                      src={kw.photo_url}
                      alt="Run photo"
                      width={400}
                      height={260}
                      className="rounded-lg w-full h-auto max-h-[220px] object-cover mb-3"
                    />
                  )}
                  <blockquote className="text-[14px] text-soil/80 leading-relaxed">&ldquo;{kw.comment}&rdquo;</blockquote>
                  <figcaption className="text-[12px] text-soil/50 mt-2 font-bold">
                    — {kw.runner_name ?? 'A runner'}
                  </figcaption>
                </figure>
              ))}
            </div>
          </motion.div>
        )}

        <div>
          <h2 className="font-data text-[11px] tracking-[0.18em] text-soil/45 mb-2">RUNS</h2>
          <div className="grid grid-cols-3 gap-2.5">
            <StatCard label="This week" value={data.runsWeek} delay={0} />
            <StatCard label="This month" value={data.runsMonth} delay={0.05} />
            <StatCard label="This year" value={data.runsYear} delay={0.1} />
          </div>
        </div>

        <div>
          <h2 className="font-data text-[11px] tracking-[0.18em] text-soil/45 mb-2">
            {isOwner ? "MILES YOUR DOG'S RUN" : 'MILES YOU\'VE RUN'}
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            <StatCard label="This week" value={`${Math.round(data.milesWeek * 10) / 10}`} sub="MI" delay={0.15} />
            <StatCard label="This month" value={`${Math.round(data.milesMonth * 10) / 10}`} sub="MI" delay={0.2} />
            <StatCard label="This year" value={`${Math.round(data.milesYear * 10) / 10}`} sub="MI" delay={0.25} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <StatCard
            label={isOwner ? 'Runners booked' : 'Dogs run with'}
            value={data.buddies}
            delay={0.3}
          />
          <StatCard label="Favorited" value={data.favorites} delay={0.35} />
        </div>

        {data.upcoming > 0 && (
          <motion.a
            href="/runs"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.4 }}
            className="block bg-pine text-white rounded-xl p-4 text-center hover:bg-pine-deep transition-colors"
          >
            <p className="font-bold text-[14px]">
              {data.upcoming} run{data.upcoming === 1 ? '' : 's'} on your calendar →
            </p>
          </motion.a>
        )}
      </div>
    </div>
  );
}
