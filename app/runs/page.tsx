'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { spring, press } from '@/components/ux';
import { formatRunLabel } from '@/lib/ics';
import { bostonWeekStart } from '@/lib/dogMiles';
import JoggerDoodle from '@/components/JoggerDoodle';

interface Run {
  id: string;
  conversation_id: string;
  proposer_id: string;
  run_date: string;
  run_time: string;
  location: string;
  miles: number;
  status: string;
  reported_at: string | null;
  i_gave_feedback: boolean;
  other_name: string;
  other_photo: string | null;
  other_kind: 'runner' | 'dog';
}

interface Mine {
  today: string;
  upcoming: Run[];
  awaitingMe: Run[];
  awaitingThem: Run[];
  past: Run[];
}

const d10 = (d: string) => String(d).slice(0, 10);
const mapsUrl = (loc: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;

function WeekStrip({ runDays, today }: { runDays: Set<string>; today: string }) {
  const start = bostonWeekStart();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${start}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const names = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d, i) => {
        const isToday = d === today;
        const hasRun = runDays.has(d);
        return (
          <div
            key={d}
            className={`rounded-xl py-2 text-center border ${
              isToday ? 'border-tennis bg-linen' : 'border-soil/10 bg-linen/60'
            }`}
          >
            <p className="font-data text-[9px] tracking-[0.1em] text-soil/45">{names[i]}</p>
            <p className={`text-[14px] font-bold ${isToday ? 'text-soil' : 'text-soil/60'}`}>
              {Number(d.slice(8, 10))}
            </p>
            <p className="h-3 text-[9px] leading-3">{hasRun ? '🐾' : ' '}</p>
          </div>
        );
      })}
    </div>
  );
}

function Avatar({ run, size = 40 }: { run: Run; size?: number }) {
  return (
    <span
      className="rounded-full bg-moss/30 overflow-hidden shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {run.other_photo ? (
        <Image src={run.other_photo} alt={run.other_name} width={size} height={size} className="object-cover w-full h-full" />
      ) : (
        <span style={{ fontSize: size * 0.5 }}>{run.other_kind === 'dog' ? '🐶' : '🏃'}</span>
      )}
    </span>
  );
}

export default function RunsPage() {
  const router = useRouter();
  const [data, setData] = useState<Mine | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/runs/mine');
    if (res.status === 401) {
      router.push('/browse');
      return;
    }
    setData(await res.json());
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function respond(runId: string, action: 'accept' | 'decline' | 'cancel') {
    if (busy) return;
    setBusy(runId);
    await fetch(`/api/runs/${runId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    await load();
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-soil/50 text-sm">Loading…</div>;
  }

  const next = data.upcoming[0];
  const laterUpcoming = data.upcoming.slice(1);
  const runDays = new Set(data.upcoming.map((r) => d10(r.run_date)));
  const needsAnything =
    data.upcoming.length + data.awaitingMe.length + data.awaitingThem.length + data.past.length > 0;

  return (
    <div className="min-h-screen bg-oat pt-16 pb-28">
      <div className="max-w-sm mx-auto px-4 space-y-5">
        <div>
          <p className="font-data text-[11px] tracking-[0.2em] text-clay mb-1">YOUR WEEK</p>
          <h1 className="font-display text-[24px] text-soil leading-tight">Runs</h1>
        </div>

        <WeekStrip runDays={runDays} today={data.today} />

        {!needsAnything && (
          <div className="text-center py-10 space-y-3">
            <JoggerDoodle className="w-72 mx-auto" />
            <p className="font-display text-[20px] text-soil/70">Nothing booked yet</p>
            <p className="text-soil/50 text-sm">Find a buddy and get something on the calendar.</p>
            <Link
              href="/browse"
              className="inline-block bg-pine hover:bg-pine-deep text-oat font-bold text-[14px] px-6 py-2.5 rounded-lg transition-colors"
            >
              Browse buddies
            </Link>
          </div>
        )}

        {/* Next run — the hero card */}
        {next && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="bg-pine text-white rounded-2xl p-5"
          >
            <p className="font-data text-[10px] tracking-[0.18em] text-tennis mb-2">
              {d10(next.run_date) === data.today ? 'NEXT RUN — TODAY 🎾' : 'NEXT RUN'}
            </p>
            <p className="font-display text-[26px] leading-tight mb-1">
              {formatRunLabel(d10(next.run_date), next.run_time)}
            </p>
            <div className="flex items-center gap-2.5 mb-4">
              <Avatar run={next} size={34} />
              <p className="text-white/80 text-[14px]">
                with <span className="font-bold text-white">{next.other_name}</span> · {next.location.split(',')[0]} ·{' '}
                {next.miles} mi
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={mapsUrl(next.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-oat text-pine font-bold text-[13px] px-4 py-2 rounded-lg hover:bg-linen transition-colors"
              >
                Directions
              </a>
              <a
                href={`/api/runs/${next.id}/ics`}
                className="border border-oat/40 text-oat font-bold text-[13px] px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Add to calendar
              </a>
              <Link
                href={`/messages/${next.conversation_id}`}
                className="border border-oat/40 text-oat font-bold text-[13px] px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Message
              </Link>
              <button
                onClick={() => respond(next.id, 'cancel')}
                disabled={busy === next.id}
                className="text-white/50 text-[12px] hover:text-white/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Waiting on you */}
        {data.awaitingMe.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-data text-[11px] tracking-[0.18em] text-clay">WAITING ON YOU</h2>
            {data.awaitingMe.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
                className="bg-linen border border-soil/10 rounded-xl p-4"
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Avatar run={r} size={32} />
                  <p className="text-[14px] text-soil">
                    <span className="font-bold">{r.other_name}</span> proposed{' '}
                    <span className="font-bold">{formatRunLabel(d10(r.run_date), r.run_time)}</span>
                    <span className="text-soil/55"> · {r.location.split(',')[0]}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    {...press}
                    onClick={() => respond(r.id, 'accept')}
                    disabled={busy === r.id}
                    className="flex-1 bg-pine hover:bg-pine-deep text-oat font-bold text-[13px] py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Book it 🐾
                  </motion.button>
                  <motion.button
                    {...press}
                    onClick={() => respond(r.id, 'decline')}
                    disabled={busy === r.id}
                    className="flex-1 border border-soil/15 text-soil/60 font-medium text-[13px] py-2 rounded-lg hover:bg-oat transition-colors disabled:opacity-50"
                  >
                    Can&apos;t make it
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </section>
        )}

        {/* Later + waiting on them */}
        {(laterUpcoming.length > 0 || data.awaitingThem.length > 0) && (
          <section className="space-y-2">
            <h2 className="font-data text-[11px] tracking-[0.18em] text-soil/45">COMING UP</h2>
            <div className="bg-linen border border-soil/10 rounded-xl divide-y divide-soil/10">
              {laterUpcoming.map((r) => (
                <Link key={r.id} href={`/messages/${r.conversation_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-oat transition-colors">
                  <Avatar run={r} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-soil truncate">
                      {formatRunLabel(d10(r.run_date), r.run_time)} with {r.other_name}
                    </p>
                    <p className="text-[12px] text-soil/50 truncate">{r.location.split(',')[0]} · {r.miles} mi · booked ✓</p>
                  </div>
                </Link>
              ))}
              {data.awaitingThem.map((r) => (
                <Link key={r.id} href={`/messages/${r.conversation_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-oat transition-colors">
                  <Avatar run={r} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-soil/70 truncate">
                      {formatRunLabel(d10(r.run_date), r.run_time)} with {r.other_name}
                    </p>
                    <p className="text-[12px] text-clay truncate">waiting on {r.other_name}…</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent — feedback entry point */}
        {data.past.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-data text-[11px] tracking-[0.18em] text-soil/45">RECENT</h2>
            <div className="bg-linen border border-soil/10 rounded-xl divide-y divide-soil/10">
              {data.past.map((r) => (
                <Link key={r.id} href={`/messages/${r.conversation_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-oat transition-colors">
                  <Avatar run={r} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-soil truncate">
                      {formatRunLabel(d10(r.run_date), r.run_time)} with {r.other_name}
                    </p>
                    <p className="text-[12px] text-soil/50 truncate">
                      {r.i_gave_feedback ? `${r.miles} mi · logged ✓` : 'How did it go? Tap to log it →'}
                    </p>
                  </div>
                  {!r.i_gave_feedback && <span className="text-[16px]" aria-hidden>🏁</span>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
