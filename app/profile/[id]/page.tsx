'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { type Schedule } from '@/components/SchedulePicker';
import LiquidGlassWrapper, { GlassPanel } from '@/components/LiquidGlassWrapper';

interface Profile {
  id: string;
  dog_name?: string;
  breed?: string;
  owner_name?: string;
  runner_name?: string;
  typical_distance?: string;
  pace: string;
  photo_url?: string | null;
  route: string;
  schedule?: Schedule | null;
}

const PACE_LABEL: Record<string, string> = {
  casual: 'Casual (10+ min/mi)',
  moderate: 'Moderate (8–10 min/mi)',
  fast: 'Fast (under 8 min/mi)',
};

const DAYS = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' }, { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const SLOT_LABEL: Record<string, string> = {
  '06:00': '6am', '07:00': '7am', '08:00': '8am', '09:00': '9am',
  '10:00': '10am', '11:00': '11am', '12:00': '12pm', '13:00': '1pm',
  '14:00': '2pm', '15:00': '3pm', '16:00': '4pm', '17:00': '5pm',
  '18:00': '6pm', '19:00': '7pm', '20:00': '8pm',
};

export default function ProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [type, setType] = useState<'dog' | 'runner' | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null);
  const [msgText, setMsgText] = useState('');

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

  async function startConversation(message: string) {
    setMessaging(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: id, message }),
      });
      const data = await res.json();
      if (data.conversationId) {
        router.push(`/messages/${data.conversationId}`);
      }
    } finally {
      setMessaging(false);
    }
  }

  function handleSlotClick(day: string, time: string) {
    const dayLabel = DAYS.find((d) => d.key === day)?.label ?? day;
    const timeLabel = SLOT_LABEL[time] ?? time;
    setSelectedSlot({ day, time });
    setMsgText(`Hi! I'd love to run at Castle Island on ${dayLabel} at ${timeLabel}. Would that work for you?`);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-black/48 text-sm">Loading…</div>;
  if (!profile || !type) return null;

  const name = type === 'dog' ? profile.dog_name! : profile.runner_name!;
  const schedule = profile.schedule ?? {};
  const hasSchedule = Object.values(schedule).some((slots) => slots.length > 0);

  return (
    <div className="min-h-screen bg-light-gray pt-12">
      {/* Hero */}
      <LiquidGlassWrapper
        className="relative h-52 bg-near-black"
        defaults={{
          cornerRadius: 0,
          refraction: 0.01,
          blurAmount: 0.15,
          specular: 0.05,
          shadowOpacity: 0,
          zRadius: 10,
        }}
      >
        {profile.photo_url ? (
          <Image src={profile.photo_url} alt={name} fill className="object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="flex items-center justify-center h-full text-8xl">
            {type === 'dog' ? '🐶' : '🏃'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Glass name badge overlapping bottom of hero */}
        <GlassPanel
          className="absolute bottom-4 left-5 right-5 px-5 py-3"
          config={{
            cornerRadius: 16,
            blurAmount: 0.3,
            refraction: 0.02,
            specular: 0.15,
            tintStrength: 0.05,
          }}
        >
          <h1 className="text-2xl font-semibold text-white leading-tight tracking-tight">{name}</h1>
          {type === 'dog' && <p className="text-white/60 text-sm tracking-[-0.014em]">{profile.breed} · owned by {profile.owner_name}</p>}
          {type === 'runner' && <p className="text-white/60 text-sm tracking-[-0.014em]">Runs {profile.typical_distance}</p>}
        </GlassPanel>
      </LiquidGlassWrapper>

      <div className="px-5 py-5 max-w-sm mx-auto space-y-4">
        {/* Details */}
        <div className="bg-white rounded-lg divide-y divide-black/[0.04]">
          <Row icon="🗺️" label="Route" value="Castle Island, South Boston" />
          <Row icon="👟" label="Pace" value={PACE_LABEL[profile.pace] ?? profile.pace} />
        </div>

        {/* Weekly schedule */}
        {hasSchedule ? (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-near-black tracking-[-0.014em]">
              {type === 'dog' ? 'When they run — tap a slot to request' : 'Available to run — tap a slot to request'}
            </h2>
            <div className="bg-white rounded-lg border border-black/[0.04] overflow-hidden">
              {DAYS.map((day, di) => {
                const slots = schedule[day.key] ?? [];
                if (slots.length === 0) return null;
                return (
                  <div
                    key={day.key}
                    className={`flex items-center gap-2 px-3 py-2 ${di > 0 ? 'border-t border-black/[0.04]' : ''}`}
                  >
                    <span className="w-8 text-xs font-semibold text-black/48 shrink-0">{day.label}</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => handleSlotClick(day.key, slot)}
                          className="px-2.5 py-1 bg-apple-blue/10 text-apple-blue rounded-md text-xs font-semibold hover:bg-apple-blue hover:text-white transition-colors"
                        >
                          {SLOT_LABEL[slot] ?? slot}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-black/48 text-center py-2 tracking-[-0.014em]">No schedule set yet</p>
        )}

        {/* Request a run / message form */}
        {selectedSlot ? (
          <div className="bg-white apple-shadow rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-near-black tracking-[-0.014em]">
              Request a run on {DAYS.find((d) => d.key === selectedSlot.day)?.label} at {SLOT_LABEL[selectedSlot.time]}
            </p>
            <textarea
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              rows={3}
              className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue resize-none text-near-black"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSlot(null)}
                className="flex-1 py-2.5 rounded-lg border border-black/10 text-sm font-medium text-black/60"
              >
                Cancel
              </button>
              <button
                onClick={() => startConversation(msgText)}
                disabled={messaging || !msgText.trim()}
                className="flex-1 py-2.5 rounded-lg bg-apple-blue hover:bg-apple-blue-hover text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {messaging ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => startConversation(`Hi! I came across your profile on DogRun and would love to connect about running at Castle Island together!`)}
            disabled={messaging}
            className="w-full bg-apple-blue hover:bg-apple-blue-hover text-white font-medium py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 text-[17px] transition-colors"
          >
            {messaging ? 'Opening…' : 'Send a message'}
          </button>
        )}

        <Link href="/browse" className="block text-center text-sm text-link-blue font-medium py-1 hover:underline tracking-[-0.014em]">
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
        <p className="text-xs text-black/48 font-medium tracking-[-0.008em]">{label}</p>
        <p className="text-sm text-near-black font-medium tracking-[-0.014em]">{value}</p>
      </div>
    </div>
  );
}
