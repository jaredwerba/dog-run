'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import ProfileCard from '@/components/ProfileCard';
import JoggerDoodle from '@/components/JoggerDoodle';
import { spring } from '@/components/ux';
import { formatRunLabel } from '@/lib/ics';

interface MatchInfo {
  overlap: number;
  pace_match: boolean;
  runs_completed?: number;
  days?: string[];
}

const DAY_CHIPS = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

interface DogProfile extends MatchInfo {
  id: string;
  dog_name: string;
  breed: string;
  pace: string;
  owner_name: string;
  photo_url?: string | null;
  weekly_goal_miles?: number | null;
  miles_this_week?: number;
  review_count?: number;
}

function ledgerBadge(p: DogProfile): string | null {
  if (!p.weekly_goal_miles) return null;
  const remaining = Math.round((p.weekly_goal_miles - (p.miles_this_week ?? 0)) * 10) / 10;
  return remaining > 0 ? `Needs ${remaining} mi this week` : 'Weekly goal met 🎾';
}

function dogBadges(p: DogProfile): string[] {
  const badges = matchBadges(p);
  if (p.review_count) {
    badges.push(`${p.review_count} runner comment${p.review_count === 1 ? '' : 's'}`);
  }
  return badges;
}

interface RunnerProfile extends MatchInfo {
  id: string;
  runner_name: string;
  pace: string;
  typical_distance: string;
  availability: string;
  photo_url?: string | null;
  review_count?: number;
}

function runnerBadges(p: RunnerProfile): string[] {
  const badges = matchBadges(p);
  if (p.review_count) {
    badges.push(`${p.review_count} owner comment${p.review_count === 1 ? '' : 's'}`);
  }
  return badges;
}

function matchBadges(p: MatchInfo): string[] {
  const badges: string[] = [];
  if (p.runs_completed) badges.push(`${p.runs_completed} run${p.runs_completed === 1 ? '' : 's'} completed`);
  if (p.overlap > 0) badges.push(`${p.overlap} shared time${p.overlap === 1 ? '' : 's'}`);
  if (p.pace_match) badges.push('Same pace');
  return badges;
}

type Profile = DogProfile | RunnerProfile;

function isDog(p: Profile, viewing: string): p is DogProfile {
  return viewing === 'dogs';
}

const PACE_LABELS: Record<string, string> = { casual: 'Casual', moderate: 'Moderate', fast: 'Fast' };

export default function BrowsePage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [viewing, setViewing] = useState<'runners' | 'dogs'>('runners');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [needsPhoto, setNeedsPhoto] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [shared, setShared] = useState(false);
  const [myLedger, setMyLedger] = useState<{ dogName: string; goal: number; miles: number } | null>(null);
  const [nextRun, setNextRun] = useState<{ label: string; location: string } | null>(null);
  // Logged-out guests can browse both sides; clicking a profile funnels to signup
  const [publicMode, setPublicMode] = useState(false);
  const [publicView, setPublicView] = useState<'dogs' | 'runners'>('dogs');
  const [loadError, setLoadError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/favorites')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.ids) setFavoriteIds(new Set(d.ids)); })
      .catch(() => {});
  }, []);

  async function toggleFavorite(targetId: string) {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) next.delete(targetId); else next.add(targetId);
      return next;
    });
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId }),
    }).catch(() => {});
  }

  // Restore the guest toggle from the URL (?view=runners survives back-button)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('view') === 'runners') {
      setPublicView('runners');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(false);
      // One request; the server decides mode from the session. Authed
      // responses ignore ?view and never 401 — guests get `public: true`.
      const d = await fetch(`/api/browse?view=${publicView}`)
        .then((r) => r.json())
        .catch(() => ({ error: true }));
      if (cancelled) return;
      if (d.error) {
        setLoadError(true);
        setLoading(false);
        return;
      }

      const isPublic = Boolean(d.public);
      setPublicMode(isPublic);
      setProfiles(d.profiles);
      setViewing(d.viewing);
      if (!isPublic) {
        setNeedsPhoto(Boolean(d.me?.hasProfile) && !d.me?.hasPhoto);
        if (d.me?.weeklyGoalMiles && d.me?.dogName) {
          setMyLedger({ dogName: d.me.dogName, goal: d.me.weeklyGoalMiles, miles: d.me.milesThisWeek ?? 0 });
        }
        // Surface the next booked run everywhere
        fetch('/api/runs/mine')
          .then((r) => r.json())
          .then((mine) => {
            const next = mine?.upcoming?.[0];
            if (next && !cancelled) {
              setNextRun({
                label: formatRunLabel(String(next.run_date).slice(0, 10), next.run_time),
                location: String(next.location).split(',')[0],
              });
            }
          })
          .catch(() => {});
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [publicView, retryTick]);

  function switchPublicView(v: 'dogs' | 'runners') {
    setPublicView(v);
    window.history.replaceState(null, '', v === 'runners' ? '/browse?view=runners' : '/browse');
  }

  async function share() {
    const data = {
      title: 'Go Dogs Boston 🎾',
      text: 'Boston runners + high-energy dogs, matched for runs. Free to join.',
      url: 'https://www.rundog.boston',
    };
    if (navigator.share) {
      try { await navigator.share(data); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(data.url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  const filtered = profiles
    .filter((p) => filter === 'all' || p.pace === filter)
    .filter((p) => !dayFilter || (p.days ?? []).includes(dayFilter));

  return (
    <div className="min-h-screen bg-oat pt-16 pb-28 max-w-2xl mx-auto">
      {/* Header — in public mode, track the toggle instantly */}
      <div className="px-4 mb-4">
        <p className="font-data text-[11px] tracking-[0.2em] text-clay mb-1">
          {publicMode ? 'BOSTON ONLY · CASTLE ISLAND & NEARBY' : 'CASTLE ISLAND · SOUTH BOSTON'}
        </p>
        <h1 className="font-display text-[24px] text-soil leading-tight mb-1">
          {publicMode
            ? publicView === 'dogs' ? 'Boston Dogs Near You' : 'Boston Runners Near You'
            : viewing === 'dogs' ? 'Boston Dogs Near You' : 'Boston Runners Near You'}
        </h1>
        <p className="text-sm text-soil/55">
          {publicMode
            ? 'Have a look around — join free to say hi.'
            : viewing === 'dogs'
              ? 'Dog owners looking for a running buddy'
              : 'Runners who love running with dogs'}
        </p>
      </div>

      {/* Guest toggle: dogs ↔ runners */}
      {publicMode && (
        <div className="px-4 mb-4">
          <div className="inline-flex bg-linen border border-soil/10 rounded-full p-1">
            {(['dogs', 'runners'] as const).map((v) => (
              <button
                key={v}
                onClick={() => switchPublicView(v)}
                className={`relative shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  publicView === v ? 'text-oat' : 'text-soil/60 hover:text-soil'
                }`}
              >
                {publicView === v && (
                  <motion.span
                    layoutId="public-view-indicator"
                    transition={spring}
                    className="absolute inset-0 bg-clay rounded-full"
                  />
                )}
                <span className="relative z-10">{v === 'dogs' ? '🐶 Dogs' : '🏃 Runners'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Load failure — never bounce anyone to signup over a network blip */}
      {loadError && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-soil/50 text-sm gap-3 px-6 text-center">
          <p className="font-display text-[20px] text-soil/70">Lost the trail for a second</p>
          <p>Couldn&apos;t load profiles — give it another go.</p>
          <button
            onClick={() => setRetryTick((t) => t + 1)}
            className="bg-pine hover:bg-pine-deep text-oat font-bold text-[14px] px-6 py-2.5 rounded-lg transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Next booked run — always in sight */}
      {nextRun && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="mx-4 mb-4">
          <Link
            href="/runs"
            className="flex items-center gap-2.5 bg-pine text-white rounded-xl px-4 py-2.5 hover:bg-pine-deep transition-colors"
          >
            <span aria-hidden>🎾</span>
            <span className="text-[13px] flex-1">
              <span className="font-data text-[10px] tracking-[0.15em] text-tennis mr-2">NEXT RUN</span>
              <span className="font-bold">{nextRun.label}</span>
              <span className="text-white/70"> · {nextRun.location}</span>
            </span>
            <span className="text-white/60" aria-hidden>→</span>
          </Link>
        </motion.div>
      )}

      {/* My dog's weekly ledger (owners) */}
      {myLedger && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="mx-4 mb-4 bg-linen border border-soil/10 rounded-xl px-4 py-3"
        >
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="text-[13px] font-bold text-soil">{myLedger.dogName}&apos;s week</p>
            <p className="font-data text-[11px] text-soil/55">
              {Math.round(myLedger.miles * 10) / 10} / {myLedger.goal} MI
            </p>
          </div>
          <div className="h-2 bg-oat rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (myLedger.miles / myLedger.goal) * 100)}%` }}
              transition={{ ...spring, delay: 0.2 }}
              className={`h-full rounded-full ${myLedger.miles >= myLedger.goal ? 'bg-tennis' : 'bg-fern'}`}
            />
          </div>
          {myLedger.miles < myLedger.goal && (
            <p className="text-[12px] text-soil/50 mt-1.5">
              {Math.round((myLedger.goal - myLedger.miles) * 10) / 10} miles to go — book a runner below.
            </p>
          )}
        </motion.div>
      )}

      {/* Profile-completeness nudge */}
      {needsPhoto && !nudgeDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="mx-4 mb-4 bg-linen border border-sunlight/60 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <span className="text-xl" aria-hidden>📸</span>
          <p className="flex-1 text-[13px] text-soil/75 leading-snug">
            <span className="font-bold text-soil">Add a photo to your profile</span> — profiles
            with photos get far more run requests.
          </p>
          <button
            onClick={() => router.push('/profile/setup')}
            className="shrink-0 bg-pine text-oat text-[12px] font-bold px-3 py-1.5 rounded-lg hover:bg-pine-deep transition-colors"
          >
            Add photo
          </button>
          <button
            onClick={() => setNudgeDismissed(true)}
            aria-label="Dismiss"
            className="shrink-0 text-soil/40 hover:text-soil/70 text-[16px] leading-none"
          >
            ×
          </button>
        </motion.div>
      )}

      {/* Pace filter — iOS segmented control */}
      <div className="px-4 mb-5">
        <div className="inline-flex bg-linen border border-soil/10 rounded-full p-1">
          {['all', 'casual', 'moderate', 'fast'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f ? 'text-oat' : 'text-soil/60 hover:text-soil'
              }`}
            >
              {filter === f && (
                <motion.span
                  layoutId="pace-indicator"
                  transition={spring}
                  className="absolute inset-0 bg-pine rounded-full"
                />
              )}
              <span className="relative z-10">{f === 'all' ? 'All paces' : PACE_LABELS[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Day filter — "who's free on…" (schedules aren't public, so members only) */}
      {!publicMode && (
        <div className="px-4 mb-5 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="font-data text-[10px] tracking-[0.15em] text-soil/45 shrink-0 mr-1">FREE ON</span>
          {DAY_CHIPS.map((d) => (
            <button
              key={d.key}
              onClick={() => setDayFilter(dayFilter === d.key ? null : d.key)}
              className={`shrink-0 px-2.5 py-1 rounded-md text-[12px] font-bold transition-colors ${
                dayFilter === d.key
                  ? 'bg-clay text-white'
                  : 'bg-linen text-soil/55 border border-soil/10 hover:border-clay/40'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {loadError ? null : loading ? (
        <div className="flex items-center justify-center py-20 text-soil/50 text-sm">Loading…</div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-soil/50 text-sm gap-2 px-6 text-center">
          <JoggerDoodle className="w-72 mb-2" />
          <p className="font-display text-[20px] text-soil/70">You&apos;re early — nice.</p>
          <p className="max-w-xs">
            No {viewing === 'dogs' ? 'dogs' : 'runners'} nearby yet.{' '}
            {publicMode
              ? 'Be the first — it takes about a minute.'
              : `Know someone with ${viewing === 'dogs' ? 'a high-energy dog' : 'running shoes'}? Send them this way.`}
          </p>
          {publicMode ? (
            <button
              onClick={() => router.push('/register')}
              className="mt-3 bg-pine hover:bg-pine-deep text-oat font-bold text-[14px] px-6 py-2.5 rounded-lg transition-colors"
            >
              Create a profile
            </button>
          ) : (
            <button
              onClick={share}
              className="mt-3 bg-pine hover:bg-pine-deep text-oat font-bold text-[14px] px-6 py-2.5 rounded-lg transition-colors"
            >
              {shared ? 'Link copied ✓' : 'Share Go Dogs Boston 🎾'}
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-soil/50 text-sm gap-2">
          <JoggerDoodle className="w-72 mb-2" />
          <p className="font-display text-[20px] text-soil/70">Nobody on the trail yet</p>
          <p>No {viewing === 'dogs' ? 'dogs' : 'runners'} at this pace — try another.</p>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-2 gap-3">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...spring, delay: Math.min(i * 0.045, 0.4) }}
            >
              {isDog(p, viewing) ? (
                <ProfileCard
                  id={p.id}
                  photoUrl={p.photo_url}
                  title={p.dog_name}
                  subtitle={p.breed}
                  tags={[{ label: 'Pace', value: PACE_LABELS[p.pace] ?? p.pace }]}
                  viewing="dogs"
                  badges={[...(ledgerBadge(p) ? [ledgerBadge(p)!] : []), ...dogBadges(p)]}
                  href={publicMode ? `/register?meet=${encodeURIComponent(p.dog_name)}&side=dogs` : undefined}
                  favorited={favoriteIds.has(p.id)}
                  onToggleFavorite={publicMode ? undefined : () => toggleFavorite(p.id)}
                />
              ) : (
                <ProfileCard
                  id={(p as RunnerProfile).id}
                  photoUrl={(p as RunnerProfile).photo_url}
                  title={(p as RunnerProfile).runner_name}
                  subtitle={(p as RunnerProfile).typical_distance}
                  tags={[
                    { label: 'Pace', value: PACE_LABELS[(p as RunnerProfile).pace] ?? (p as RunnerProfile).pace },
                    { label: 'When', value: (p as RunnerProfile).availability },
                  ]}
                  viewing="runners"
                  badges={runnerBadges(p as RunnerProfile)}
                  href={publicMode ? `/register?meet=${encodeURIComponent((p as RunnerProfile).runner_name)}&side=runners` : undefined}
                  favorited={favoriteIds.has((p as RunnerProfile).id)}
                  onToggleFavorite={publicMode ? undefined : () => toggleFavorite((p as RunnerProfile).id)}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Guest signup funnel */}
      {publicMode && !loading && profiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.3 }}
          className="mx-4 mt-6 bg-pine text-white rounded-xl px-5 py-4 text-center"
        >
          <p className="font-display text-[18px] mb-1">See someone you&apos;d run with?</p>
          <p className="text-[13px] text-white/70 mb-3">
            Free to join · Boston only · takes about a minute with a passkey
          </p>
          <button
            onClick={() => router.push('/register')}
            className="bg-tennis text-soil font-bold text-[14px] px-6 py-2.5 rounded-lg hover:bg-oat transition-colors"
          >
            Create a profile
          </button>
        </motion.div>
      )}
    </div>
  );
}
