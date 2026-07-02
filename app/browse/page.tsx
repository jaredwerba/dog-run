'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import ProfileCard from '@/components/ProfileCard';
import JoggerDoodle from '@/components/JoggerDoodle';
import { spring } from '@/components/ux';

interface MatchInfo {
  overlap: number;
  pace_match: boolean;
}

interface DogProfile extends MatchInfo {
  id: string;
  dog_name: string;
  breed: string;
  pace: string;
  owner_name: string;
  photo_url?: string | null;
}

interface RunnerProfile extends MatchInfo {
  id: string;
  runner_name: string;
  pace: string;
  typical_distance: string;
  availability: string;
  photo_url?: string | null;
}

function matchBadges(p: MatchInfo): string[] {
  const badges: string[] = [];
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
  const [needsPhoto, setNeedsPhoto] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) { router.push('/register'); return; }
      });

    fetch('/api/browse')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { router.push('/register'); return; }
        setProfiles(d.profiles);
        setViewing(d.viewing);
        setNeedsPhoto(Boolean(d.me?.hasProfile) && !d.me?.hasPhoto);
        setLoading(false);
      });
  }, [router]);

  async function share() {
    const data = {
      title: 'Go Dogs Boston',
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

  const filtered = filter === 'all'
    ? profiles
    : profiles.filter((p) => p.pace === filter);

  return (
    <div className="min-h-screen bg-oat pt-16 pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 mb-4">
        <p className="font-data text-[11px] tracking-[0.2em] text-clay mb-1">CASTLE ISLAND · SOUTH BOSTON</p>
        <h1 className="font-display text-[24px] text-soil leading-tight mb-1">
          {viewing === 'dogs' ? 'Dogs near you' : 'Runners near you'}
        </h1>
        <p className="text-sm text-soil/55">
          {viewing === 'dogs'
            ? 'Dog owners looking for a running buddy'
            : 'Runners who love running with dogs'}
        </p>
      </div>

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

      {loading ? (
        <div className="flex items-center justify-center py-20 text-soil/50 text-sm">Loading…</div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-soil/50 text-sm gap-2 px-6 text-center">
          <JoggerDoodle className="w-72 mb-2" />
          <p className="font-display text-[20px] text-soil/70">You&apos;re early — nice.</p>
          <p className="max-w-xs">
            No {viewing === 'dogs' ? 'dogs' : 'runners'} nearby yet. Know someone with
            {viewing === 'dogs' ? ' a high-energy dog' : ' running shoes'}? Send them this way.
          </p>
          <button
            onClick={share}
            className="mt-3 bg-pine hover:bg-pine-deep text-oat font-bold text-[14px] px-6 py-2.5 rounded-lg transition-colors"
          >
            {shared ? 'Link copied ✓' : 'Share Go Dogs Boston'}
          </button>
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
                  badges={matchBadges(p)}
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
                  badges={matchBadges(p as RunnerProfile)}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
