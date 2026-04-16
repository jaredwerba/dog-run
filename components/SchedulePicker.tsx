'use client';

export type Schedule = Record<string, string[]>;

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const SLOTS = [
  { key: '06:00', label: '6am' },
  { key: '07:00', label: '7am' },
  { key: '08:00', label: '8am' },
  { key: '09:00', label: '9am' },
  { key: '10:00', label: '10am' },
  { key: '11:00', label: '11am' },
  { key: '12:00', label: '12pm' },
  { key: '13:00', label: '1pm' },
  { key: '14:00', label: '2pm' },
  { key: '15:00', label: '3pm' },
  { key: '16:00', label: '4pm' },
  { key: '17:00', label: '5pm' },
  { key: '18:00', label: '6pm' },
  { key: '19:00', label: '7pm' },
  { key: '20:00', label: '8pm' },
];

interface Props {
  value: Schedule;
  onChange: (s: Schedule) => void;
}

export default function SchedulePicker({ value, onChange }: Props) {
  function toggle(day: string, slot: string) {
    const current = value[day] ?? [];
    const next = current.includes(slot)
      ? current.filter((t) => t !== slot)
      : [...current, slot].sort();
    onChange({ ...value, [day]: next });
  }

  const totalSelected = Object.values(value).reduce((acc, slots) => acc + slots.length, 0);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">
        Tap your available time slots · {totalSelected} selected
      </p>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {DAYS.map((day, di) => {
          const selected = value[day.key] ?? [];
          return (
            <div
              key={day.key}
              className={`flex items-center gap-2 px-3 py-2 ${di < DAYS.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <span className="w-8 text-xs font-bold text-gray-500 shrink-0">{day.label}</span>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1 scrollbar-none">
                {SLOTS.map((slot) => {
                  const active = selected.includes(slot.key);
                  return (
                    <button
                      key={slot.key}
                      type="button"
                      onClick={() => toggle(day.key, slot.key)}
                      className={`shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        active
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Utility: format a schedule into a human-readable summary
export function scheduleToText(schedule: Schedule): string {
  const parts: string[] = [];
  for (const day of DAYS) {
    const slots = schedule[day.key];
    if (!slots || slots.length === 0) continue;
    const times = slots.map((s) => SLOTS.find((sl) => sl.key === s)?.label ?? s);
    parts.push(`${day.label} ${times.join(', ')}`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'No schedule set';
}
