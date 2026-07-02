/* Calendar-invite (.ics) generation for booked runs. All runs are in Boston. */

const TZ = 'America/New_York';

/* Convert a Boston-local date + time ('YYYY-MM-DD', 'HH:MM') to a UTC Date */
export function bostonToUtc(date: string, time: string): Date {
  const pretendUtc = new Date(`${date}T${time}:00Z`);
  const inTz = new Date(pretendUtc.toLocaleString('en-US', { timeZone: TZ }));
  const inUtc = new Date(pretendUtc.toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(pretendUtc.getTime() + (inUtc.getTime() - inTz.getTime()));
}

/* 'Tue, Jul 7 · 6:30 AM' */
export function formatRunLabel(date: string, time: string): string {
  const utc = bostonToUtc(date, time);
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(utc);
  const clock = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
  }).format(utc);
  return `${day} · ${clock}`;
}

function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function esc(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export interface RunInvite {
  uid: string;
  date: string; // YYYY-MM-DD (Boston)
  time: string; // HH:MM 24h (Boston)
  durationMinutes?: number;
  location: string;
  summary: string;
  description: string;
  organizer: { name: string; email: string };
  attendee: { name: string; email: string };
}

export function buildIcs(invite: RunInvite): string {
  const start = bostonToUtc(invite.date, invite.time);
  const end = new Date(start.getTime() + (invite.durationMinutes ?? 60) * 60_000);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Go Dogs Boston//Run//EN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${invite.uid}@godogsboston`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${esc(invite.summary)}`,
    `DESCRIPTION:${esc(invite.description)}`,
    `LOCATION:${esc(invite.location)}`,
    `ORGANIZER;CN=${esc(invite.organizer.name)}:mailto:${invite.organizer.email}`,
    `ATTENDEE;CN=${esc(invite.attendee.name)};RSVP=TRUE;PARTSTAT=ACCEPTED:mailto:${invite.attendee.email}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Run reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}
