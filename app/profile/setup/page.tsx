'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import SchedulePicker, { type Schedule } from '@/components/SchedulePicker';
import { press, pressFirm } from '@/components/ux';
import { suggestedWeeklyMiles } from '@/lib/dogMiles';

const BREEDS = [
  'Mixed breed', 'Labrador', 'Golden Retriever', 'French Bulldog', 'German Shepherd',
  'Poodle', 'Bulldog', 'Beagle', 'Rottweiler', 'Dachshund', 'Yorkshire Terrier',
  'Boxer', 'Shih Tzu', 'Siberian Husky', 'Greyhound', 'Shiba Inu', 'Border Collie',
  'Australian Shepherd', 'Cavalier King Charles', 'Doberman', 'Other',
];

const DISTANCES = ['2–3 mi', '3–5 mi', '4–6 mi', '5–8 mi', '6–10 mi', '10+ mi'];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [role, setRole] = useState<'owner' | 'runner' | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [schedule, setSchedule] = useState<Schedule>({});

  const [dogName, setDogName] = useState('');
  const [breed, setBreed] = useState('');
  const [pace, setPace] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [quirks, setQuirks] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState('');

  function handleBreedChange(next: string) {
    setBreed(next);
    // Prefill the exercise goal from breed guidance unless the owner already set one
    if (next && !weeklyGoal) setWeeklyGoal(String(suggestedWeeklyMiles(next)));
  }

  const [runnerName, setRunnerName] = useState('');
  const [runnerPace, setRunnerPace] = useState('');
  const [typicalDistance, setTypicalDistance] = useState('');
  const [soloPace, setSoloPace] = useState('');
  const [personalBest, setPersonalBest] = useState('');

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.user) { router.push('/login'); return; }
        setRole(d.user.role);
        const pr = await fetch('/api/profile').then((r) => r.json());
        const p = pr.profile;
        if (!p) return;
        setPhotoUrl(p.photo_url ?? '');
        setSchedule(p.schedule ?? {});
        if (d.user.role === 'owner') {
          setDogName(p.dog_name ?? '');
          setBreed(p.breed ?? '');
          setPace(p.pace ?? '');
          setOwnerName(p.owner_name ?? '');
          setQuirks(p.quirks ?? '');
          setWeeklyGoal(p.weekly_goal_miles ? String(p.weekly_goal_miles) : '');
        } else {
          setRunnerName(p.runner_name ?? '');
          setRunnerPace(p.pace ?? '');
          setTypicalDistance(p.typical_distance ?? '');
          setSoloPace(p.solo_pace ?? '');
          setPersonalBest(p.personal_best ?? '');
        }
      });
  }, [router]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.url) setPhotoUrl(data.url);
    setUploading(false);
  }

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const body =
        role === 'owner'
          ? { dogName, breed, pace, ownerName, photoUrl, schedule, quirks, weeklyGoalMiles: weeklyGoal }
          : { runnerName, pace: runnerPace, typicalDistance, photoUrl, schedule, soloPace, personalBest };

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      router.push('/browse');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (!role) return null;

  return (
    <div className="min-h-screen bg-oat pt-16 px-6 pb-28">
      <div className="max-w-sm mx-auto space-y-6">
        <h1 className="font-display text-[26px] text-soil leading-tight">
          {role === 'owner' ? 'Your dog\'s profile' : 'Your runner profile'}
        </h1>

        {/* Photo */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-24 h-24 rounded-full bg-moss/25 overflow-hidden cursor-pointer border-2 border-dashed border-bark/30 flex items-center justify-center"
            onClick={() => fileRef.current?.click()}
          >
            {photoUrl ? (
              <Image src={photoUrl} alt="profile" width={96} height={96} className="object-cover w-full h-full" />
            ) : (
              <span className="text-3xl">{role === 'owner' ? '🐶' : '🏃'}</span>
            )}
          </div>
          <button onClick={() => fileRef.current?.click()} className="text-sm text-pine font-bold hover:underline" disabled={uploading}>
            {uploading ? 'Uploading…' : photoUrl ? 'Change photo' : 'Add photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        {role === 'owner' ? (
          <>
            <Field label="Dog's name">
              <input value={dogName} onChange={(e) => setDogName(e.target.value)} className={inputCls} placeholder="e.g. Biscuit" />
            </Field>
            <Field label="Breed">
              <select value={breed} onChange={(e) => handleBreedChange(e.target.value)} className={inputCls}>
                <option value="">Select breed</option>
                {BREEDS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Weekly exercise goal (miles)">
              <input
                type="number"
                min={1}
                max={100}
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(e.target.value)}
                className={inputCls}
                placeholder="e.g. 25"
              />
              <p className="text-xs text-soil/45">
                {breed
                  ? `Suggested for a ${breed}: ~${suggestedWeeklyMiles(breed)} mi/week. `
                  : ''}
                Runners see how many miles your dog still needs each week.
              </p>
            </Field>
            <Field label="Pace">
              <PacePicker value={pace} onChange={setPace} />
            </Field>
            <Field label="Your name">
              <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputCls} placeholder="e.g. Sarah K." />
            </Field>
            <Field label="Quirks & notes">
              <textarea
                value={quirks}
                onChange={(e) => setQuirks(e.target.value)}
                rows={2}
                className={`${inputCls} resize-none text-[15px]`}
                placeholder="Pulls a little, loves tennis balls, afraid of skateboards…"
              />
              <p className="text-xs text-soil/45">Runners read this before the first run — the more honest, the better.</p>
            </Field>
          </>
        ) : (
          <>
            <Field label="Your name">
              <input value={runnerName} onChange={(e) => setRunnerName(e.target.value)} className={inputCls} placeholder="e.g. Tom W." />
            </Field>
            <Field label="Pace running with a dog">
              <PacePicker value={runnerPace} onChange={setRunnerPace} />
              <p className="text-xs text-soil/45">This is what owners see when matching — your realistic pace with a dog alongside.</p>
            </Field>
            <Field label="Your personal running pace">
              <input
                value={soloPace}
                onChange={(e) => setSoloPace(e.target.value)}
                className={inputCls}
                placeholder="e.g. 7:45 /mi"
              />
            </Field>
            <Field label="Personal best">
              <input
                value={personalBest}
                onChange={(e) => setPersonalBest(e.target.value)}
                className={inputCls}
                placeholder="e.g. 3:42 marathon, 18:30 5K"
              />
            </Field>
            <Field label="Typical distance">
              <div className="flex flex-wrap gap-2">
                {DISTANCES.map((d) => (
                  <motion.button
                    key={d}
                    {...pressFirm}
                    onClick={() => setTypicalDistance(d)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      typicalDistance === d ? 'bg-pine text-oat' : 'bg-linen text-soil border border-soil/15 hover:border-pine/40'
                    }`}
                  >
                    {d}
                  </motion.button>
                ))}
              </div>
            </Field>
          </>
        )}

        <Field label="Your weekly availability">
          <SchedulePicker value={schedule} onChange={setSchedule} />
        </Field>

        {error && <p className="text-clay-deep text-sm font-medium">{error}</p>}

        <motion.button
          {...press}
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-pine hover:bg-pine-deep text-oat font-bold py-3 rounded-lg disabled:opacity-50 text-[16px] transition-colors"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </motion.button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-soil">{label}</label>
      {children}
    </div>
  );
}

function PacePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { key: 'casual', label: 'Casual', desc: '10+ min/mi' },
    { key: 'moderate', label: 'Moderate', desc: '8–10 min/mi' },
    { key: 'fast', label: 'Fast', desc: '<8 min/mi' },
  ];
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <motion.button
          key={o.key}
          {...pressFirm}
          onClick={() => onChange(o.key)}
          className={`flex-1 py-2 px-1 rounded-lg border text-xs font-bold text-center transition-colors ${
            value === o.key ? 'bg-pine text-oat border-pine' : 'bg-linen text-soil border-soil/15 hover:border-pine/40'
          }`}
        >
          <div>{o.label}</div>
          <div className={`font-normal ${value === o.key ? 'text-oat/70' : 'text-soil/50'}`}>{o.desc}</div>
        </motion.button>
      ))}
    </div>
  );
}

const inputCls = 'w-full border border-soil/15 rounded-lg px-4 py-3 text-[17px] bg-white text-soil focus:outline-none focus:ring-2 focus:ring-pine placeholder:text-soil/30';
