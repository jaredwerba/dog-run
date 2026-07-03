'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { spring } from '@/components/ux';

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
