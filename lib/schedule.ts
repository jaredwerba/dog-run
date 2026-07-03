/* Pure schedule helpers — safe to import from both server routes and client components */

export type Schedule = Record<string, string[]>;

export const SCHEDULE_DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

export const SCHEDULE_SLOTS = [
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

/* Full text: 'Mon 6am, 7am · Tue 6am · …' */
export function scheduleToText(schedule: Schedule): string {
  const parts: string[] = [];
  for (const day of SCHEDULE_DAYS) {
    const slots = schedule[day.key];
    if (!slots || slots.length === 0) continue;
    const times = slots.map((s) => SCHEDULE_SLOTS.find((sl) => sl.key === s)?.label ?? s);
    parts.push(`${day.label} ${times.join(', ')}`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'No schedule set';
}

/* Chip-sized summary: 'Sat, Sun mornings' / '5 days/wk · mornings & evenings' */
export function compactScheduleText(schedule: Schedule | null | undefined): string {
  if (!schedule) return '';
  const days = SCHEDULE_DAYS.filter((d) => (schedule[d.key] ?? []).length > 0);
  if (days.length === 0) return '';

  const allSlots = days.flatMap((d) => schedule[d.key] ?? []);
  const periods = new Set<string>();
  for (const slot of allSlots) {
    const h = Number(slot.slice(0, 2));
    if (h < 12) periods.add('mornings');
    else if (h < 17) periods.add('afternoons');
    else periods.add('evenings');
  }
  const period = ['mornings', 'afternoons', 'evenings'].filter((p) => periods.has(p)).join(' & ');

  const dayPart =
    days.length === 7 ? 'Every day' : days.length > 3 ? `${days.length} days/wk` : days.map((d) => d.label).join(', ');
  return `${dayPart} · ${period}`;
}
