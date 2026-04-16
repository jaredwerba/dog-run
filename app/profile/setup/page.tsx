'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SchedulePicker, { type Schedule } from '@/components/SchedulePicker';

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

  // Dog owner fields
  const [dogName, setDogName] = useState('');
  const [breed, setBreed] = useState('');
  const [pace, setPace] = useState('');
  const [ownerName, setOwnerName] = useState('');

  // Runner fields
  const [runnerName, setRunnerName] = useState('');
  const [runnerPace, setRunnerPace] = useState('');
  const [typicalDistance, setTypicalDistance] = useState('');

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.user) { router.push('/login'); return; }
        setRole(d.user.role);
        // Pre-fill existing profile
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
        } else {
          setRunnerName(p.runner_name ?? '');
          setRunnerPace(p.pace ?? '');
          setTypicalDistance(p.typical_distance ?? '');
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
          ? { dogName, breed, pace, ownerName, photoUrl, schedule }
          : { runnerName, pace: runnerPace, typicalDistance, photoUrl, schedule };

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
    <div className="min-h-screen bg-orange-50 pt-20 px-6 pb-12">
      <div className="max-w-sm mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {role === 'owner' ? 'Your dog\'s profile' : 'Your runner profile'}
        </h1>

        {/* Photo */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-24 h-24 rounded-full bg-orange-100 overflow-hidden cursor-pointer border-2 border-dashed border-orange-300 flex items-center justify-center"
            onClick={() => fileRef.current?.click()}
          >
            {photoUrl ? (
              <Image src={photoUrl} alt="profile" width={96} height={96} className="object-cover w-full h-full" />
            ) : (
              <span className="text-3xl">{role === 'owner' ? '🐶' : '🏃'}</span>
            )}
          </div>
          <button onClick={() => fileRef.current?.click()} className="text-sm text-orange-500 font-medium" disabled={uploading}>
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
              <select value={breed} onChange={(e) => setBreed(e.target.value)} className={inputCls}>
                <option value="">Select breed</option>
                {BREEDS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Pace">
              <PacePicker value={pace} onChange={setPace} />
            </Field>
            <Field label="Your name">
              <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputCls} placeholder="e.g. Sarah K." />
            </Field>
          </>
        ) : (
          <>
            <Field label="Your name">
              <input value={runnerName} onChange={(e) => setRunnerName(e.target.value)} className={inputCls} placeholder="e.g. Tom W." />
            </Field>
            <Field label="Pace">
              <PacePicker value={runnerPace} onChange={setRunnerPace} />
            </Field>
            <Field label="Typical distance">
              <div className="flex flex-wrap gap-2">
                {DISTANCES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setTypicalDistance(d)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      typicalDistance === d ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        {/* Weekly Schedule — both roles */}
        <Field label="Your weekly availability">
          <SchedulePicker value={schedule} onChange={setSchedule} />
        </Field>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save profile →'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function PacePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { key: 'casual', label: '🚶 Casual', desc: '10+ min/mi' },
    { key: 'moderate', label: '🏃 Moderate', desc: '8–10 min/mi' },
    { key: 'fast', label: '⚡ Fast', desc: '<8 min/mi' },
  ];
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`flex-1 py-2 px-1 rounded-xl border text-xs font-semibold text-center transition-colors ${
            value === o.key ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200'
          }`}
        >
          <div>{o.label}</div>
          <div className="font-normal opacity-75">{o.desc}</div>
        </button>
      ))}
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-orange-400';
