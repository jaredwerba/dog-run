'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { spring, springBouncy, press, pressFirm } from '@/components/ux';
import { formatRunLabel } from '@/lib/ics';
import { MILES_OPTIONS, defaultMilesFor } from '@/lib/dogMiles';
import MatchCelebration from '@/components/MatchCelebration';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  photo_url: string | null;
  created_at: string;
  read_at: string | null;
}

type Schedule = Record<string, string[]>;

interface ConvRow {
  id: string;
  owner_id: string;
  runner_id: string;
  dog_name: string;
  owner_photo: string | null;
  runner_name: string;
  runner_photo: string | null;
  owner_schedule?: Schedule | null;
  runner_schedule?: Schedule | null;
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABEL: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

/* Next 3 day+time slots both schedules share, soonest first */
function sharedSlots(a?: Schedule | null, b?: Schedule | null): { day: string; time: string; date: string }[] {
  if (!a || !b) return [];
  const now = new Date();
  const out: { day: string; time: string; date: string; dist: number }[] = [];
  for (const day of Object.keys(a)) {
    const theirs = new Set(b[day] ?? []);
    for (const time of a[day] ?? []) {
      if (!theirs.has(time)) continue;
      const idx = DAY_KEYS.indexOf(day);
      if (idx < 0) continue;
      const dist = (idx - now.getDay() + 7) % 7 || 7;
      const d = new Date(now);
      d.setDate(d.getDate() + dist);
      out.push({ day, time, date: d.toISOString().slice(0, 10), dist });
    }
  }
  return out.sort((x, y) => x.dist - y.dist || x.time.localeCompare(y.time)).slice(0, 3);
}

interface Run {
  id: string;
  proposer_id: string;
  run_date: string;
  run_time: string;
  location: string;
  miles: number;
  reported_at: string | null;
  status: 'proposed' | 'confirmed' | 'declined' | 'cancelled';
}

interface Feedback {
  run_id: string;
  author_id: string;
  wants_rebook: boolean;
}

interface ThreadData {
  conversation: ConvRow;
  messages: Message[];
  runs: Run[];
  feedback: Feedback[];
}

const TIMES = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '17:30', '18:00', '18:30',
  '19:00', '20:00',
];

/* Pinned card: propose → accept → booked, with calendar invite */
function RunPlanner({
  conversationId,
  myId,
  isOwner,
  otherName,
  runs,
  feedback,
  suggestions,
  onChanged,
}: {
  conversationId: string;
  myId: string;
  isOwner: boolean;
  otherName: string;
  runs: Run[];
  feedback: Feedback[];
  suggestions: { day: string; time: string; date: string }[];
  onChanged: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('07:00');
  const [location, setLocation] = useState('Castle Island, South Boston');
  const [miles, setMiles] = useState<number>(defaultMilesFor('Castle Island, South Boston'));
  const [reportMiles, setReportMiles] = useState('');
  const [reportNote, setReportNote] = useState('');
  const [wantRebook, setWantRebook] = useState(true);
  const [shareReview, setShareReview] = useState(true);
  const [reportPhotoUrl, setReportPhotoUrl] = useState('');
  const [uploadingReportPhoto, setUploadingReportPhoto] = useState(false);

  const active = runs.find(
    (r) =>
      r.status === 'proposed' ||
      (r.status === 'confirmed' && String(r.run_date).slice(0, 10) >= today)
  );

  // Most recent completed run — powers the post-run report + "book it again"
  const lastCompleted = !active
    ? runs.find((r) => r.status === 'confirmed' && String(r.run_date).slice(0, 10) < today)
    : undefined;
  const needsReport = Boolean(
    lastCompleted && !feedback.some((f) => f.run_id === lastCompleted.id && f.author_id === myId)
  );

  async function proposeRun(d: string, t: string, loc: string, mi: number) {
    if (!d || busy) return;
    setBusy(true);
    await fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, date: d, time: t, location: loc, miles: mi }),
    });
    setShowForm(false);
    setBusy(false);
    await onChanged();
  }

  function rebook() {
    if (!lastCompleted) return;
    // Same weekday/time/place, first occurrence after today
    const next = new Date(`${String(lastCompleted.run_date).slice(0, 10)}T12:00:00`);
    while (next.toISOString().slice(0, 10) <= today) next.setDate(next.getDate() + 7);
    void proposeRun(
      next.toISOString().slice(0, 10),
      lastCompleted.run_time,
      lastCompleted.location,
      Number(lastCompleted.miles) || defaultMilesFor(lastCompleted.location)
    );
  }

  async function respond(runId: string, action: 'accept' | 'decline' | 'cancel') {
    if (busy) return;
    setBusy(true);
    await fetch(`/api/runs/${runId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    await onChanged();
  }

  async function handleReportPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReportPhoto(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.url) setReportPhotoUrl(data.url);
    setUploadingReportPhoto(false);
  }

  async function submitReport() {
    if (!lastCompleted || busy) return;
    setBusy(true);
    // Rebook happens server-side: proposal normally, auto-booked when both
    // sides toggled "run again" for the same run.
    await fetch(`/api/runs/${lastCompleted.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'feedback',
        comment: reportNote,
        wantsRebook: wantRebook,
        milesActual: isOwner ? undefined : (reportMiles || lastCompleted.miles),
        shareAsReview: shareReview,
        photoUrl: reportPhotoUrl || undefined,
      }),
    });
    setReportNote('');
    setReportMiles('');
    setReportPhotoUrl('');
    setBusy(false);
    await onChanged();
  }

  return (
    <div className="px-4 pt-3">
      <AnimatePresence mode="wait" initial={false}>
        {active?.status === 'confirmed' ? (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={spring}
            className="bg-pine text-white rounded-xl p-4"
          >
            <p className="font-data text-[10px] tracking-[0.18em] text-tennis mb-1.5">RUN BOOKED ✓</p>
            <p className="font-bold text-[16px]">
              {formatRunLabel(String(active.run_date).slice(0, 10), active.run_time)}
            </p>
            <p className="text-white/70 text-[13px] mb-3">{active.location}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={`/api/runs/${active.id}/ics`}
                className="bg-oat text-pine font-bold text-[13px] px-4 py-2 rounded-lg hover:bg-linen transition-colors"
              >
                Add to calendar
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(active.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-oat/40 text-oat font-bold text-[13px] px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Directions
              </a>
              <button
                onClick={() => respond(active.id, 'cancel')}
                disabled={busy}
                className="text-white/50 text-[12px] hover:text-white/80 transition-colors"
              >
                Cancel run
              </button>
            </div>
            <p className="text-white/45 text-[11px] mt-2.5">Calendar invites emailed to both of you ✉️</p>
          </motion.div>
        ) : active?.status === 'proposed' && active.proposer_id === myId ? (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={spring}
            className="bg-linen border border-soil/10 rounded-xl p-4"
          >
            <p className="font-data text-[10px] tracking-[0.18em] text-clay mb-1.5">RUN PROPOSED — WAITING ON {otherName.toUpperCase()}</p>
            <p className="font-bold text-[15px] text-soil">
              {formatRunLabel(String(active.run_date).slice(0, 10), active.run_time)}
              <span className="font-normal text-soil/55"> · {active.location}</span>
            </p>
            <button
              onClick={() => respond(active.id, 'cancel')}
              disabled={busy}
              className="text-clay-deep text-[12px] font-medium mt-2 hover:underline"
            >
              Cancel proposal
            </button>
          </motion.div>
        ) : active?.status === 'proposed' ? (
          <motion.div
            key="respond"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={spring}
            className="bg-linen border border-soil/10 rounded-xl p-4"
          >
            <p className="font-data text-[10px] tracking-[0.18em] text-clay mb-1.5">{otherName.toUpperCase()} PROPOSED A RUN</p>
            <p className="font-bold text-[15px] text-soil mb-3">
              {formatRunLabel(String(active.run_date).slice(0, 10), active.run_time)}
              <span className="font-normal text-soil/55"> · {active.location}</span>
            </p>
            <div className="flex gap-2">
              <motion.button
                {...press}
                onClick={() => respond(active.id, 'accept')}
                disabled={busy}
                className="flex-1 bg-pine hover:bg-pine-deep text-oat font-bold text-[13px] py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Book it 🐾
              </motion.button>
              <motion.button
                {...press}
                onClick={() => respond(active.id, 'decline')}
                disabled={busy}
                className="flex-1 border border-soil/15 text-soil/60 font-medium text-[13px] py-2.5 rounded-lg hover:bg-oat transition-colors disabled:opacity-50"
              >
                Can&apos;t make it
              </motion.button>
            </div>
          </motion.div>
        ) : showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={spring}
            className="bg-linen border border-soil/10 rounded-xl p-4 space-y-2.5"
          >
            <p className="font-data text-[10px] tracking-[0.18em] text-clay">PLAN A RUN WITH {otherName.toUpperCase()}</p>
            <div className="flex gap-2">
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 border border-soil/15 rounded-lg px-3 py-2 text-[13px] bg-white text-soil focus:outline-none focus:ring-2 focus:ring-pine"
              />
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border border-soil/15 rounded-lg px-2 py-2 text-[13px] bg-white text-soil focus:outline-none focus:ring-2 focus:ring-pine"
              >
                {TIMES.map((t) => (
                  <option key={t} value={t}>
                    {formatRunLabel(today, t).split('· ')[1]}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setMiles(defaultMilesFor(e.target.value));
              }}
              placeholder="Where?"
              className="w-full border border-soil/15 rounded-lg px-3 py-2 text-[13px] bg-white text-soil focus:outline-none focus:ring-2 focus:ring-pine"
            />
            <div>
              <p className="font-data text-[10px] tracking-[0.15em] text-soil/45 mb-1.5">DISTANCE</p>
              <div className="flex flex-wrap gap-1.5">
                {MILES_OPTIONS.map((m) => (
                  <motion.button
                    key={m}
                    {...pressFirm}
                    onClick={() => setMiles(m)}
                    className={`px-2.5 py-1 rounded-md text-[12px] font-bold transition-colors ${
                      miles === m
                        ? 'bg-pine text-oat'
                        : 'bg-oat text-soil/60 border border-soil/10 hover:border-pine/40'
                    }`}
                  >
                    {m} mi
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                {...press}
                onClick={() => void proposeRun(date, time, location, miles)}
                disabled={!date || busy}
                className="flex-1 bg-pine hover:bg-pine-deep text-oat font-bold text-[13px] py-2.5 rounded-lg transition-colors disabled:opacity-40"
              >
                {busy ? 'Proposing…' : 'Propose run'}
              </motion.button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 border border-soil/15 text-soil/60 text-[13px] rounded-lg hover:bg-oat transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {needsReport && lastCompleted ? (
              <div className="bg-linen border border-soil/10 rounded-xl p-4 space-y-2.5">
                <p className="font-data text-[10px] tracking-[0.18em] text-clay">
                  HOW&apos;D THE RUN GO? — {formatRunLabel(String(lastCompleted.run_date).slice(0, 10), lastCompleted.run_time)}
                </p>
                {!isOwner && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      step={0.1}
                      value={reportMiles}
                      onChange={(e) => setReportMiles(e.target.value)}
                      placeholder={String(lastCompleted.miles)}
                      className="w-24 border border-soil/15 rounded-lg px-3 py-2 text-[13px] bg-white text-soil focus:outline-none focus:ring-2 focus:ring-pine"
                    />
                    <span className="text-[13px] text-soil/55">miles actually run</span>
                  </div>
                )}
                <input
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder={isOwner ? `How was ${otherName} with your dog?` : 'How was it? e.g. Tank crushed it, zero pulling'}
                  className="w-full border border-soil/15 rounded-lg px-3 py-2 text-[13px] bg-white text-soil focus:outline-none focus:ring-2 focus:ring-pine"
                />
                <div className="flex items-center gap-3">
                  {reportPhotoUrl && (
                    <Image src={reportPhotoUrl} alt="Attached" width={44} height={44} className="rounded-lg w-11 h-11 object-cover" />
                  )}
                  <label className="text-[13px] text-pine font-bold hover:underline cursor-pointer">
                    {uploadingReportPhoto ? 'Uploading…' : reportPhotoUrl ? 'Change photo' : '📷 Add a photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleReportPhoto} disabled={uploadingReportPhoto} />
                  </label>
                </div>
                <button
                  onClick={() => setWantRebook(!wantRebook)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[13px] font-medium transition-colors ${
                    wantRebook ? 'border-pine bg-pine/10 text-pine' : 'border-soil/15 text-soil/55'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${wantRebook ? 'border-pine bg-pine' : 'border-soil/30'}`}>
                    {wantRebook && <span className="text-oat text-[9px] leading-none">✓</span>}
                  </span>
                  🔁 Book the same run next week
                </button>
                <button
                  onClick={() => setShareReview(!shareReview)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[13px] font-medium transition-colors ${
                    shareReview ? 'border-pine bg-pine/10 text-pine' : 'border-soil/15 text-soil/55'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${shareReview ? 'border-pine bg-pine' : 'border-soil/30'}`}>
                    {shareReview && <span className="text-oat text-[9px] leading-none">✓</span>}
                  </span>
                  💬 Share my comment on {otherName}&apos;s profile
                </button>
                <motion.button
                  {...press}
                  onClick={() => void submitReport()}
                  disabled={busy}
                  className="w-full bg-pine hover:bg-pine-deep text-oat font-bold text-[13px] py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {busy ? 'Logging…' : '🏁 Log the run'}
                </motion.button>
              </div>
            ) : lastCompleted ? (
              <motion.button
                {...press}
                onClick={rebook}
                disabled={busy}
                className="w-full bg-pine text-oat font-bold text-[13px] py-2.5 rounded-xl hover:bg-pine-deep transition-colors disabled:opacity-50"
              >
                {busy
                  ? 'Booking…'
                  : `🔁 Book the same run next week — ${formatRunLabel(String(lastCompleted.run_date).slice(0, 10), lastCompleted.run_time).split(' · ')[1]} at ${lastCompleted.location.split(',')[0]}`}
              </motion.button>
            ) : null}
            {suggestions.length > 0 && (
              <div className="bg-linen border border-soil/10 rounded-xl p-3">
                <p className="font-data text-[10px] tracking-[0.15em] text-clay mb-2">
                  YOU BOTH HAVE TIME —
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <motion.button
                      key={`${s.day}-${s.time}`}
                      {...pressFirm}
                      onClick={() => {
                        setDate(s.date);
                        setTime(s.time);
                        setShowForm(true);
                      }}
                      className="bg-pine/10 text-pine font-bold text-[12px] px-3 py-1.5 rounded-md hover:bg-pine hover:text-oat transition-colors"
                    >
                      {DAY_LABEL[s.day]} {formatRunLabel(s.date, s.time).split('· ')[1]}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            <motion.button
              {...press}
              onClick={() => setShowForm(true)}
              className="w-full bg-linen border border-dashed border-pine/40 text-pine font-bold text-[13px] py-2.5 rounded-xl hover:bg-white transition-colors"
            >
              📅 Plan a run — pick a time &amp; place
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ThreadPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ThreadData | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // The match moment: first time this browser sees a run confirmed, celebrate.
  // Works for both sides — accepter via reload after tapping accept, proposer
  // via the 3s poll picking up the status change.
  useEffect(() => {
    if (!data?.runs) return;
    const today = new Date().toISOString().slice(0, 10);
    for (const r of data.runs) {
      if (r.status === 'confirmed' && String(r.run_date).slice(0, 10) >= today) {
        const key = `gdb-match-seen-${r.id}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, '1');
          setCelebrate(true);
          break;
        }
      }
    }
  }, [data]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) { router.push('/messages'); return; }
    const d = await res.json();
    setData(d);
  }, [id, router]);

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then((d) => {
      if (!d.user) { router.push('/login'); return; }
      setMyId(d.user.id);
      load();
    });
  }, [load, router]);

  useEffect(() => {
    pollRef.current = setInterval(load, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages.length]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    await fetch(`/api/conversations/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.trim() }),
    });
    setText('');
    setSending(false);
    await load();
  }

  async function sendPhoto(file: File) {
    if (uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.url) {
        await fetch(`/api/conversations/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: '', photoUrl: data.url }),
        });
        await load();
      }
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
  }

  if (!data || !myId) return <div className="min-h-screen flex items-center justify-center text-soil/50 text-sm">Loading…</div>;

  const conv = data.conversation;
  const isOwner = conv.owner_id === myId;
  const otherName = isOwner ? conv.runner_name : conv.dog_name;
  const otherPhoto = isOwner ? conv.runner_photo : conv.owner_photo;
  const otherEmoji = isOwner ? '🏃' : '🐶';

  // Trust ledger: completed runs between this pair
  const todayStr = new Date().toISOString().slice(0, 10);
  const runsTogether = (data.runs ?? []).filter(
    (r) => r.status === 'confirmed' && String(r.run_date).slice(0, 10) < todayStr
  );
  const milesTogether = Math.round(runsTogether.reduce((sum, r) => sum + (Number(r.miles) || 0), 0) * 10) / 10;

  return (
    <div className="min-h-screen bg-oat flex flex-col pt-12 pb-16">
      <MatchCelebration show={celebrate} onDone={() => setCelebrate(false)} />

      {/* Header */}
      <div className="bg-linen border-b border-soil/10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/messages')} className="text-pine font-bold text-sm hover:underline pr-1">←</button>
        <div className="w-9 h-9 rounded-full bg-moss/30 overflow-hidden shrink-0 flex items-center justify-center">
          {otherPhoto ? (
            <Image src={otherPhoto} alt={otherName} width={36} height={36} className="object-cover w-full h-full" />
          ) : (
            <span className="text-lg">{otherEmoji}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-soil truncate">{otherName}</p>
          {runsTogether.length > 0 && (
            <p className="font-data text-[10px] tracking-[0.12em] text-pine">
              🐾 {runsTogether.length} RUN{runsTogether.length === 1 ? '' : 'S'} TOGETHER · {milesTogether} MI
            </p>
          )}
        </div>
      </div>

      {/* Run planner — propose, accept, booked */}
      <RunPlanner
        conversationId={conv.id}
        myId={myId}
        isOwner={isOwner}
        otherName={otherName}
        runs={data.runs ?? []}
        feedback={data.feedback ?? []}
        suggestions={sharedSlots(conv.owner_schedule, conv.runner_schedule)}
        onChanged={load}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {data.messages.length === 0 && (
          <p className="text-center text-soil/50 text-sm py-8">No messages yet. Say hi!</p>
        )}
        {data.messages.map((msg) => {
          const mine = msg.sender_id === myId;
          return (
            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={springBouncy}
                style={{ originX: mine ? 1 : 0, originY: 1 }}
                className={`max-w-[78%] rounded-2xl overflow-hidden text-sm ${
                  msg.photo_url ? 'p-1.5' : 'px-3.5 py-2'
                } ${
                  mine
                    ? 'bg-pine text-oat rounded-br-sm'
                    : 'bg-linen text-soil border border-soil/10 rounded-bl-sm'
                }`}
              >
                {msg.photo_url && (
                  <a href={msg.photo_url} target="_blank" rel="noopener noreferrer" className="block">
                    <Image
                      src={msg.photo_url}
                      alt="Shared photo"
                      width={260}
                      height={260}
                      className="rounded-xl w-full h-auto max-h-[280px] object-cover"
                    />
                  </a>
                )}
                {msg.content && (
                  <p className={`whitespace-pre-wrap break-words ${msg.photo_url ? 'px-2 pt-1.5' : ''}`}>{msg.content}</p>
                )}
                <p className={`font-data text-[9px] mt-0.5 ${msg.photo_url ? 'px-2 pb-0.5' : ''} ${mine ? 'text-oat/60' : 'text-soil/40'}`}>
                  {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </p>
              </motion.div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-linen border-t border-soil/10 px-4 py-3 flex gap-2 items-end">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void sendPhoto(file);
            e.target.value = '';
          }}
        />
        <motion.button
          {...pressFirm}
          onClick={() => fileRef.current?.click()}
          disabled={uploadingPhoto}
          aria-label="Attach a photo"
          className="border border-soil/15 text-soil/60 hover:text-pine hover:border-pine/40 rounded-full w-10 h-10 flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors bg-white"
        >
          {uploadingPhoto ? (
            <span className="text-[11px]">…</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="15" rx="2" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="M21 16l-5.5-5.5a2 2 0 0 0-2.83 0L4 19" />
            </svg>
          )}
        </motion.button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Message…"
          className="flex-1 border border-soil/15 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pine max-h-28 overflow-y-auto bg-white text-soil placeholder:text-soil/30"
        />
        <motion.button
          {...pressFirm}
          onClick={() => void send()}
          disabled={!text.trim() || sending}
          className="bg-pine hover:bg-pine-deep text-oat rounded-full w-10 h-10 flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
