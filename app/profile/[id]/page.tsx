'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Profile {
  id: string;
  // dog
  dog_name?: string;
  breed?: string;
  owner_name?: string;
  owner_contact?: string;
  // runner
  runner_name?: string;
  typical_distance?: string;
  contact?: string;
  availability?: string;
  // shared
  pace: string;
  photo_url?: string | null;
  route: string;
}

const PACE_LABEL: Record<string, string> = {
  casual: '🚶 Casual (10+ min/mi)',
  moderate: '🏃 Moderate (8–10 min/mi)',
  fast: '⚡ Fast (under 8 min/mi)',
};

export default function ProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [type, setType] = useState<'dog' | 'runner' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { router.push('/browse'); return; }
        setProfile(d.profile);
        setType(d.type);
        setLoading(false);
      });
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
    );
  }

  if (!profile || !type) return null;

  const name = type === 'dog' ? profile.dog_name! : profile.runner_name!;
  const contact = type === 'dog' ? profile.owner_contact! : profile.contact!;
  const isEmail = contact.includes('@');

  return (
    <div className="min-h-screen bg-gray-50 pt-14">
      {/* Hero */}
      <div className="relative h-56 bg-orange-100">
        {profile.photo_url ? (
          <Image src={profile.photo_url} alt={name} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-8xl">
            {type === 'dog' ? '🐶' : '🏃'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="px-5 py-6 max-w-sm mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
          {type === 'dog' && (
            <p className="text-gray-500">{profile.breed} · owned by {profile.owner_name}</p>
          )}
          {type === 'runner' && (
            <p className="text-gray-500">Runs {profile.typical_distance}</p>
          )}
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl divide-y divide-gray-100">
          <Row icon="🗺️" label="Route" value="Castle Island, South Boston" />
          <Row icon="👟" label="Pace" value={PACE_LABEL[profile.pace] ?? profile.pace} />
          {type === 'runner' && profile.availability && (
            <Row icon="🗓️" label="Available" value={profile.availability} />
          )}
        </div>

        {/* Contact CTA */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            Interested in running together?
          </p>
          <a
            href={isEmail ? `mailto:${contact}` : `tel:${contact}`}
            className="block w-full bg-orange-500 text-white text-center font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors"
          >
            {isEmail ? `📧 Email ${type === 'dog' ? profile.owner_name : profile.runner_name}` : `📞 Call ${contact}`}
          </a>
          <p className="text-xs text-gray-400 text-center">{contact}</p>
        </div>

        <Link href="/browse" className="block text-center text-sm text-orange-500 font-medium py-2">
          ← Back to browse
        </Link>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  );
}
