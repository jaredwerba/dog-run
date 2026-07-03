'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { type Schedule } from '@/components/SchedulePicker';
import { spring, press, pressFirm } from '@/components/ux';

const ScruffyDog = dynamic(() => import('@/components/ScruffyDog'), { ssr: false });
const RunnerLegs = dynamic(() => import('@/components/RunnerLegs'), { ssr: false });

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
  quirks?: string | null;
  weekly_goal_miles?: number | null;
  miles_this_week?: number;
  solo_pace?: string | null;
  personal_best?: string | null;
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

const LOCATIONS = [
  'Castle Island, South Boston',
  'Charles River Esplanade',
  'Boston Common & Public Garden',
  'Jamaica Pond',
];

interface Review {
  comment: string;
  created_at: string;
  photo_url?: string | null;
  owner_name?: string | null;
  dog_name?: string | null;
  runner_name?: string | null;
  runs_together: number;
  mine: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [type, setType] = useState<'dog' | 'runner' | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [msgText, setMsgText] = useState('');
  const [msgEdited, setMsgEdited] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mySchedule, setMySchedule] = useState<Schedule | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewDraft, setReviewDraft] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewPhotoUrl, setReviewPhotoUrl] = useState('');
  const [uploadingReviewPhoto, setUploadingReviewPhoto] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    fetch('/api/favorites')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.ids?.includes(id)) setFavorited(true); })
      .catch(() => {});
  }, [id]);

  async function toggleFavorite() {
    setFavorited((f) => !f);
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: id }),
    }).catch(() => {});
  }

  async function shareProfile() {
    const url = `${window.location.origin}/p/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Go Dogs Boston 🎾', url }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  const load = useCallback(() => {
    fetch(`/api/profile/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { router.push('/browse'); return; }
        setProfile(d.profile);
        setType(d.type);
        setReviews(d.reviews ?? []);
        setCanReview(Boolean(d.canReview));
        setReviewDraft(d.myReview ?? '');
        setMySchedule(d.mySchedule ?? null);
        setLoading(false);
      });
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReviewPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReviewPhoto(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.url) setReviewPhotoUrl(data.url);
    setUploadingReviewPhoto(false);
  }

  async function saveReview() {
    if (savingReview) return;
    setSavingReview(true);
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: id, comment: reviewDraft, photoUrl: reviewPhotoUrl || undefined }),
    });
    setSavingReview(false);
    setReviewOpen(false);
    load();
  }

  async function startConversation(message: string, run?: { date: string; time: string; location: string }) {
    setMessaging(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: id, message }),
      });
      const data = await res.json();
      if (data.conversationId) {
        if (run) {
          // Also file a real run proposal the other side can accept
          await fetch('/api/runs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId: data.conversationId,
              date: run.date,
              time: run.time,
              location: run.location,
            }),
          });
        }
        router.push(`/messages/${data.conversationId}`);
      }
    } finally {
      setMessaging(false);
    }
  }

  /* Next calendar date for a weekday key like 'tue' (skips today → next week) */
  function nextDateFor(dayKey: string): string {
    const idx = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(dayKey);
    const d = new Date();
    const diff = (idx - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }

  function requestMessage(day: string, time: string, loc: string): string {
    const dayLabel = DAYS.find((d) => d.key === day)?.label ?? day;
    const timeLabel = SLOT_LABEL[time] ?? time;
    return `Hi! I'd love to run at ${loc} on ${dayLabel} at ${timeLabel}. Would that work for you?`;
  }

  function handleSlotClick(day: string, time: string) {
    setSelectedSlot({ day, time });
    setMsgEdited(false);
    setMsgText(requestMessage(day, time, location));
  }

  function handleLocationChange(loc: string) {
    setLocation(loc);
    // Keep the drafted message in sync unless the user already edited it
    if (selectedSlot && !msgEdited) {
      setMsgText(requestMessage(selectedSlot.day, selectedSlot.time, loc));
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-soil/50 text-sm">Loading…</div>;
  if (!profile || !type) return null;

  const name = type === 'dog' ? profile.dog_name! : profile.runner_name!;
  const schedule = profile.schedule ?? {};
  const hasSchedule = Object.values(schedule).some((slots) => slots.length > 0);

  return (
    <div className="min-h-screen bg-oat pt-12 pb-24">
      {/* Hero */}
      <div className="relative h-52 bg-gradient-to-br from-fern to-pine overflow-hidden">
        {profile.photo_url ? (
          <Image src={profile.photo_url} alt={name} fill className="object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="flex items-center justify-center h-full text-8xl">
            {type === 'dog' ? '🐶' : '🏃'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-pine-deep/70 to-transparent" />

        {/* Heart + share — top right */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={shareProfile}
            aria-label="Share profile"
            className="w-9 h-9 rounded-full bg-soil/40 backdrop-blur-sm flex items-center justify-center hover:bg-soil/55 transition-colors"
          >
            {shareCopied ? (
              <span className="text-oat text-[10px] font-bold">✓</span>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f6eedd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
              </svg>
            )}
          </button>
          <button
            onClick={toggleFavorite}
            aria-label={favorited ? 'Remove favorite' : 'Add favorite'}
            className="w-9 h-9 rounded-full bg-soil/40 backdrop-blur-sm flex items-center justify-center hover:bg-soil/55 transition-colors"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill={favorited ? '#bd6b44' : 'none'}
              stroke={favorited ? '#bd6b44' : '#f6eedd'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </button>
        </div>

        {/* Name badge overlapping bottom of hero */}
        <div className="absolute bottom-4 left-5 right-5 px-5 py-3 rounded-xl bg-pine-deep/60 backdrop-blur-md border border-white/10">
          <h1 className="font-display text-[22px] text-white leading-tight">{name}</h1>
          {type === 'dog' && <p className="text-white/70 text-sm">{profile.breed} · owned by {profile.owner_name}</p>}
          {type === 'runner' && <p className="text-white/70 text-sm">Runs {profile.typical_distance}</p>}
        </div>
      </div>

      <div className="px-5 py-5 max-w-sm mx-auto space-y-4">
        {/* A little life on the page */}
        <div className="flex justify-center py-2">
          {type === 'dog' ? (
            <ScruffyDog className="w-[130px]" />
          ) : (
            <RunnerLegs className="w-[90px]" />
          )}
        </div>

        {/* Weekly mileage ledger */}
        {type === 'dog' && profile.weekly_goal_miles ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="bg-linen rounded-xl border border-soil/10 px-4 py-3"
          >
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="font-data text-[10px] tracking-[0.15em] text-clay">THIS WEEK&apos;S MILES</p>
              <p className="font-data text-[11px] text-soil/55">
                {Math.round((profile.miles_this_week ?? 0) * 10) / 10} / {profile.weekly_goal_miles} MI
              </p>
            </div>
            <div className="h-2 bg-oat rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, ((profile.miles_this_week ?? 0) / profile.weekly_goal_miles) * 100)}%`,
                }}
                transition={{ ...spring, delay: 0.2 }}
                className={`h-full rounded-full ${
                  (profile.miles_this_week ?? 0) >= profile.weekly_goal_miles ? 'bg-tennis' : 'bg-fern'
                }`}
              />
            </div>
            {(profile.miles_this_week ?? 0) < profile.weekly_goal_miles && (
              <p className="text-[12px] text-soil/55 mt-1.5">
                {name} needs{' '}
                <span className="font-bold text-soil/75">
                  {Math.round((profile.weekly_goal_miles - (profile.miles_this_week ?? 0)) * 10) / 10} more miles
                </span>{' '}
                this week — that&apos;s where you come in.
              </p>
            )}
          </motion.div>
        ) : null}

        {/* Details */}
        <div className="bg-linen rounded-xl border border-soil/10 divide-y divide-soil/10">
          <Row icon="🗺️" label="Route" value="Castle Island, South Boston" />
          <Row icon="👟" label={type === 'runner' ? 'Pace with a dog' : 'Pace'} value={PACE_LABEL[profile.pace] ?? profile.pace} />
          {type === 'runner' && profile.solo_pace?.trim() && (
            <Row icon="🏃" label="Personal pace" value={profile.solo_pace.trim()} />
          )}
          {type === 'runner' && profile.personal_best?.trim() && (
            <Row icon="🏅" label="Personal best" value={profile.personal_best.trim()} />
          )}
          {type === 'dog' && profile.quirks?.trim() && (
            <Row icon="🐾" label="Good to know" value={profile.quirks.trim()} />
          )}
        </div>

        {/* Weekly schedule */}
        {hasSchedule ? (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-soil">
              {type === 'dog' ? 'When they run — tap a slot to request' : 'Available to run — tap a slot to request'}
            </h2>
            <div className="bg-linen rounded-xl border border-soil/10 overflow-hidden">
              {DAYS.map((day, di) => {
                const slots = schedule[day.key] ?? [];
                if (slots.length === 0) return null;
                return (
                  <div
                    key={day.key}
                    className={`flex items-center gap-2 px-3 py-2 ${di > 0 ? 'border-t border-soil/10' : ''}`}
                  >
                    <span className="font-data w-8 text-[10px] uppercase font-semibold text-soil/50 shrink-0">{day.label}</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {slots.map((slot) => {
                        const shared = Boolean(mySchedule?.[day.key]?.includes(slot));
                        return (
                          <motion.button
                            key={slot}
                            {...pressFirm}
                            onClick={() => handleSlotClick(day.key, slot)}
                            title={shared ? 'You both have this time free' : undefined}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                              selectedSlot?.day === day.key && selectedSlot?.time === slot
                                ? 'bg-pine text-oat'
                                : 'bg-pine/10 text-pine hover:bg-pine hover:text-oat'
                            } ${shared ? 'ring-2 ring-tennis' : ''}`}
                          >
                            {SLOT_LABEL[slot] ?? slot}
                            {shared ? ' ✦' : ''}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-soil/50 text-center py-2">No schedule set yet</p>
        )}

        {/* Request a run / message form — slides up like an iOS sheet */}
        <AnimatePresence mode="wait" initial={false}>
          {selectedSlot ? (
            <motion.div
              key="sheet"
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={spring}
              className="bg-linen border border-soil/10 shadow-sm rounded-xl p-4 space-y-3"
            >
              <p className="text-sm font-bold text-soil">
                Request a run on {DAYS.find((d) => d.key === selectedSlot.day)?.label} at {SLOT_LABEL[selectedSlot.time]}
              </p>
              <div>
                <p className="font-data text-[10px] tracking-[0.15em] text-soil/45 mb-1.5">WHERE</p>
                <div className="flex flex-wrap gap-1.5">
                  {LOCATIONS.map((loc) => (
                    <motion.button
                      key={loc}
                      {...pressFirm}
                      onClick={() => handleLocationChange(loc)}
                      className={`px-2.5 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                        location === loc
                          ? 'bg-pine text-oat'
                          : 'bg-oat text-soil/60 border border-soil/10 hover:border-pine/40'
                      }`}
                    >
                      {loc.split(',')[0]}
                    </motion.button>
                  ))}
                </div>
              </div>
              <textarea
                value={msgText}
                onChange={(e) => { setMsgText(e.target.value); setMsgEdited(true); }}
                rows={3}
                className="w-full border border-soil/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine resize-none bg-white text-soil"
              />
              <div className="flex gap-2">
                <motion.button
                  {...press}
                  onClick={() => setSelectedSlot(null)}
                  className="flex-1 py-2.5 rounded-lg border border-soil/15 text-sm font-medium text-soil/60 hover:bg-oat transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  {...press}
                  onClick={() =>
                    startConversation(msgText, {
                      date: nextDateFor(selectedSlot.day),
                      time: selectedSlot.time,
                      location,
                    })
                  }
                  disabled={messaging || !msgText.trim()}
                  className="flex-1 py-2.5 rounded-lg bg-pine hover:bg-pine-deep text-oat text-sm font-bold disabled:opacity-50 transition-colors"
                >
                  {messaging ? 'Sending…' : 'Send request'}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="cta"
              {...press}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => startConversation(`Hi! I came across your profile on Go Dogs Boston 🎾 and would love to plan a run together!`)}
              disabled={messaging}
              className="w-full bg-pine hover:bg-pine-deep text-oat font-bold py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 text-[16px] transition-colors"
            >
              {messaging ? 'Opening…' : 'Send a message'}
            </motion.button>
          )}
        </AnimatePresence>

        {/* What the other side says — comments (+ optional photo), never scores */}
        {(reviews.length > 0 || canReview) && (
          <div className="space-y-2 pt-2">
            <h2 className="font-data text-[11px] tracking-[0.18em] text-clay">
              {type === 'runner' ? 'WHAT OWNERS SAY' : 'WHAT RUNNERS SAY'}
            </h2>
            {reviews.map((rv) => (
              <figure key={`${rv.owner_name ?? rv.runner_name}-${rv.created_at}`} className="bg-linen rounded-xl border border-soil/10 p-4">
                {rv.photo_url && (
                  <Image
                    src={rv.photo_url}
                    alt="Run photo"
                    width={400}
                    height={260}
                    className="rounded-lg w-full h-auto max-h-[220px] object-cover mb-3"
                  />
                )}
                <blockquote className="text-[14px] text-soil/80 leading-relaxed">“{rv.comment}”</blockquote>
                <figcaption className="text-[12px] text-soil/50 mt-2">
                  <span className="font-bold text-soil/70">
                    {type === 'runner'
                      ? `${rv.owner_name ?? 'An owner'}${rv.dog_name ? ` — ${rv.dog_name}'s owner` : ''}`
                      : `${rv.runner_name ?? 'A runner'}`}
                  </span>
                  {rv.runs_together > 0 && <> · {rv.runs_together} run{rv.runs_together === 1 ? '' : 's'} together</>}
                  {rv.mine && <span className="text-clay"> · yours</span>}
                </figcaption>
              </figure>
            ))}
            {canReview && !reviewOpen && (
              <button
                onClick={() => setReviewOpen(true)}
                className="w-full bg-linen border border-dashed border-pine/40 text-pine font-bold text-[13px] py-2.5 rounded-xl hover:bg-white transition-colors"
              >
                {reviewDraft ? 'Edit your comment' : `💬 Leave a comment about ${name}`}
              </button>
            )}
            {reviewOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
                className="bg-linen border border-soil/10 rounded-xl p-4 space-y-2.5"
              >
                <textarea
                  value={reviewDraft}
                  onChange={(e) => setReviewDraft(e.target.value)}
                  rows={3}
                  placeholder={
                    type === 'runner'
                      ? `How was running with ${name}? Other owners will read this.`
                      : `How was ${name} on the run? Other runners will read this.`
                  }
                  className="w-full border border-soil/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine resize-none bg-white text-soil"
                />
                <div className="flex items-center gap-3">
                  {reviewPhotoUrl && (
                    <Image src={reviewPhotoUrl} alt="Attached" width={48} height={48} className="rounded-lg w-12 h-12 object-cover" />
                  )}
                  <label className="text-sm text-pine font-bold hover:underline cursor-pointer">
                    {uploadingReviewPhoto ? 'Uploading…' : reviewPhotoUrl ? 'Change photo' : '📷 Add a photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleReviewPhoto} disabled={uploadingReviewPhoto} />
                  </label>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    {...press}
                    onClick={saveReview}
                    disabled={savingReview}
                    className="flex-1 bg-pine hover:bg-pine-deep text-oat text-sm font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {savingReview ? 'Saving…' : 'Post comment'}
                  </motion.button>
                  <button
                    onClick={() => setReviewOpen(false)}
                    className="px-4 border border-soil/15 text-soil/60 text-sm rounded-lg hover:bg-oat transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        <Link href="/browse" className="block text-center text-sm text-pine font-bold py-1 hover:underline">
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
        <p className="font-data text-[10px] uppercase tracking-[0.1em] text-soil/45">{label}</p>
        <p className="text-sm text-soil font-medium">{value}</p>
      </div>
    </div>
  );
}
