import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

type Schedule = Record<string, string[]>;

/* Count of day+time slots both schedules share */
function scheduleOverlap(a: Schedule | null, b: Schedule | null): number {
  if (!a || !b) return 0;
  let count = 0;
  for (const day of Object.keys(a)) {
    const mine = a[day] ?? [];
    const theirs = new Set(b[day] ?? []);
    for (const slot of mine) if (theirs.has(slot)) count++;
  }
  return count;
}

export async function GET() {
  const session = await getSession();
  if (!session.userId || !session.role) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const sql = db();
  const uid = session.userId;

  // My own profile — for match scoring and completeness nudges
  const myRows =
    session.role === 'owner'
      ? await sql`SELECT schedule, pace, photo_url FROM dog_profiles WHERE user_id = ${uid}`
      : await sql`SELECT schedule, pace, photo_url FROM runner_profiles WHERE user_id = ${uid}`;
  const mySchedule = (myRows[0]?.schedule as Schedule | undefined) ?? null;
  const myPace = (myRows[0]?.pace as string | undefined) ?? null;
  const me = {
    hasProfile: myRows.length > 0,
    hasPhoto: Boolean(myRows[0]?.photo_url),
  };

  // Owner sees runners; runner sees dog owners
  const rows =
    session.role === 'owner'
      ? await sql`
          SELECT u.id, u.username, u.created_at, r.runner_name, r.pace, r.typical_distance,
                 r.contact, r.availability, r.photo_url, r.route, r.schedule
          FROM runner_profiles r
          JOIN users u ON u.id = r.user_id
          WHERE r.route = 'castle-island'
        `
      : await sql`
          SELECT u.id, u.username, u.created_at, d.dog_name, d.breed, d.pace, d.quirks,
                 d.owner_name, d.owner_contact, d.photo_url, d.route, d.schedule
          FROM dog_profiles d
          JOIN users u ON u.id = d.user_id
          WHERE d.route = 'castle-island'
        `;

  // Score every profile: shared schedule slots + pace compatibility
  const profiles = rows
    .map((p) => {
      const { schedule, ...rest } = p;
      return {
        ...rest,
        overlap: scheduleOverlap(mySchedule, schedule as Schedule | null),
        pace_match: Boolean(myPace && p.pace === myPace),
      } as Record<string, unknown> & { overlap: number; pace_match: boolean };
    })
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        Number(b.pace_match) - Number(a.pace_match) ||
        String(b.created_at).localeCompare(String(a.created_at))
    );

  return NextResponse.json({
    profiles,
    viewing: session.role === 'owner' ? 'runners' : 'dogs',
    me,
  });
}
