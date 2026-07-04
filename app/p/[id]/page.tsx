'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface PublicProfile {
  type: 'dog' | 'runner';
  profile: {
    dog_name?: string;
    breed?: string;
    runner_name?: string;
    typical_distance?: string;
    pace: string;
    photo_url?: string | null;
    quirks?: string | null;
    weekly_goal_miles?: number | null;
    miles_this_week?: number;
    solo_pace?: string | null;
    personal_best?: string | null;
  };
  reviews: {
    comment: string;
    created_at: string;
    photo_url?: string | null;
    owner_name?: string | null;
    dog_name?: string | null;
    runner_name?: string | null;
  }[];
  dogsRunWith?: number;
}

const PACE_LABEL: Record<string, string> = {
  casual: 'Casual (10+ min/mi)',
  moderate: 'Moderate (8–10 min/mi)',
  fast: 'Fast (under 8 min/mi)',
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/p/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-oat pt-16 flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-[22px] text-soil/70 mb-2">Couldn&apos;t find that profile</p>
        <Link href="/browse" className="text-pine font-bold text-sm hover:underline">Browse Go Dogs Boston 🎾 →</Link>
      </div>
    );
  }
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-soil/50 text-sm">Loading…</div>;
  }

  const { type, profile, reviews } = data;
  const name = type === 'dog' ? profile.dog_name! : profile.runner_name!;

  return (
    <div className="min-h-screen bg-oat pt-12 pb-16">
      <div className="relative h-52 bg-gradient-to-br from-fern to-pine overflow-hidden">
        {profile.photo_url ? (
          <Image src={profile.photo_url} alt={name} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-8xl">{type === 'dog' ? '🐶' : '🏃'}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-pine-deep/70 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5 px-5 py-3 rounded-xl bg-pine-deep/60 backdrop-blur-md border border-white/10">
          <h1 className="font-display text-[22px] text-white leading-tight">{name}</h1>
          {type === 'dog' && <p className="text-white/70 text-sm">{profile.breed}</p>}
          {type === 'runner' && <p className="text-white/70 text-sm">Runs {profile.typical_distance}</p>}
        </div>
      </div>

      <div className="px-5 py-5 max-w-sm mx-auto space-y-4">
        <div className="bg-linen rounded-xl border border-soil/10 divide-y divide-soil/10">
          <div className="flex items-start gap-3 px-4 py-3">
            <span className="text-xl">👟</span>
            <div>
              <p className="font-data text-[10px] uppercase tracking-[0.1em] text-soil/45">
                {type === 'runner' ? 'Pace with a dog' : 'Pace'}
              </p>
              <p className="text-sm text-soil font-medium">{PACE_LABEL[profile.pace] ?? profile.pace}</p>
            </div>
          </div>
          {type === 'runner' && profile.solo_pace?.trim() && (
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="text-xl">🏃</span>
              <div>
                <p className="font-data text-[10px] uppercase tracking-[0.1em] text-soil/45">Personal pace</p>
                <p className="text-sm text-soil font-medium">{profile.solo_pace}</p>
              </div>
            </div>
          )}
          {type === 'runner' && profile.personal_best?.trim() && (
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="text-xl">🏅</span>
              <div>
                <p className="font-data text-[10px] uppercase tracking-[0.1em] text-soil/45">Personal best</p>
                <p className="text-sm text-soil font-medium">{profile.personal_best}</p>
              </div>
            </div>
          )}
          {type === 'dog' && profile.quirks?.trim() && (
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="text-xl">🐾</span>
              <div>
                <p className="font-data text-[10px] uppercase tracking-[0.1em] text-soil/45">Good to know</p>
                <p className="text-sm text-soil font-medium">{profile.quirks}</p>
              </div>
            </div>
          )}
          {type === 'runner' && (data.dogsRunWith ?? 0) > 0 && (
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="text-xl">🐾</span>
              <div>
                <p className="font-data text-[10px] uppercase tracking-[0.1em] text-soil/45">Track record</p>
                <p className="text-sm text-soil font-medium">
                  Has run with {data.dogsRunWith} Boston {data.dogsRunWith === 1 ? 'dog' : 'dogs'}
                </p>
              </div>
            </div>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-data text-[11px] tracking-[0.18em] text-clay">
              {type === 'runner' ? 'WHAT OWNERS SAY' : 'WHAT RUNNERS SAY'}
            </h2>
            {reviews.map((rv) => (
              <figure key={rv.created_at} className="bg-linen rounded-xl border border-soil/10 p-4">
                {rv.photo_url && (
                  <Image src={rv.photo_url} alt="Run photo" width={400} height={260} className="rounded-lg w-full h-auto max-h-[220px] object-cover mb-3" />
                )}
                <blockquote className="text-[14px] text-soil/80 leading-relaxed">“{rv.comment}”</blockquote>
                <figcaption className="text-[12px] text-soil/50 mt-2 font-bold">
                  {type === 'runner' ? `${rv.owner_name ?? 'An owner'}${rv.dog_name ? ` — ${rv.dog_name}'s owner` : ''}` : (rv.runner_name ?? 'A runner')}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="bg-pine text-white rounded-xl p-5 text-center">
          <p className="font-display text-[18px] mb-1">Want to run with {name}?</p>
          <p className="text-[13px] text-white/70 mb-3">Join Go Dogs Boston 🎾 — free, Boston only.</p>
          <button
            onClick={() => router.push(`/register?meet=${encodeURIComponent(name)}`)}
            className="bg-tennis text-soil font-bold text-[14px] px-6 py-2.5 rounded-lg hover:bg-oat transition-colors"
          >
            Create a profile
          </button>
        </div>
      </div>
    </div>
  );
}
