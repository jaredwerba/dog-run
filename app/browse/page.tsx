'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileCard from '@/components/ProfileCard';

interface DogProfile {
  id: string;
  dog_name: string;
  breed: string;
  pace: string;
  owner_name: string;
  photo_url?: string | null;
}

interface RunnerProfile {
  id: string;
  runner_name: string;
  pace: string;
  typical_distance: string;
  availability: string;
  photo_url?: string | null;
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
        setLoading(false);
      });
  }, [router]);

  const filtered = filter === 'all'
    ? profiles
    : profiles.filter((p) => p.pace === filter);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      {/* Header */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{viewing === 'dogs' ? '🐶' : '🏃'}</span>
          <h1 className="text-xl font-bold text-gray-900">
            {viewing === 'dogs' ? 'Dogs at Castle Island' : 'Runners at Castle Island'}
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          {viewing === 'dogs'
            ? 'Dog owners looking for a running buddy'
            : 'Runners who love running with dogs'}
        </p>
      </div>

      {/* Pace filter */}
      <div className="px-4 flex gap-2 mb-5 overflow-x-auto pb-1">
        {['all', 'casual', 'moderate', 'fast'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === f
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {f === 'all' ? 'All paces' : PACE_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-sm gap-2">
          <span className="text-4xl">🔍</span>
          <p>No {viewing === 'dogs' ? 'dogs' : 'runners'} found</p>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-2 gap-3">
          {filtered.map((p) =>
            isDog(p, viewing) ? (
              <ProfileCard
                key={p.id}
                id={p.id}
                photoUrl={p.photo_url}
                title={p.dog_name}
                subtitle={p.breed}
                tags={[{ label: 'Pace', value: PACE_LABELS[p.pace] ?? p.pace }]}
                viewing="dogs"
              />
            ) : (
              <ProfileCard
                key={(p as RunnerProfile).id}
                id={(p as RunnerProfile).id}
                photoUrl={(p as RunnerProfile).photo_url}
                title={(p as RunnerProfile).runner_name}
                subtitle={(p as RunnerProfile).typical_distance}
                tags={[
                  { label: 'Pace', value: PACE_LABELS[(p as RunnerProfile).pace] ?? (p as RunnerProfile).pace },
                  { label: 'When', value: (p as RunnerProfile).availability },
                ]}
                viewing="runners"
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
