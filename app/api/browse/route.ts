import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { bostonWeekStart } from '@/lib/dogMiles';
import { scheduleToText } from '@/components/SchedulePicker';

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

export async function GET(req: NextRequest) {
  const session = await getSession();

  // ── Public mode: logged-out visitors can window-shop both sides ──
  // Strictly public-safe fields: no user ids (enumeration), no emails,
  // no contact info, no schedules/availability, no quirks. Bounded.
  if (!session.userId || !session.role) {
    const sql = db();
    const view = req.nextUrl.searchParams.get('view') === 'runners' ? 'runners' : 'dogs';
    const weekStart = bostonWeekStart();

    const rows =
      view === 'runners'
        ? await sql`
            SELECT r.runner_name, r.pace, r.typical_distance, r.photo_url,
                   (SELECT COUNT(*)::int FROM runner_reviews rr WHERE rr.runner_id = u.id) AS review_count
            FROM runner_profiles r
            JOIN users u ON u.id = r.user_id
            WHERE r.route = 'castle-island'
            ORDER BY u.created_at DESC
            LIMIT 60
          `
        : await sql`
            SELECT d.dog_name, d.breed, d.pace, d.photo_url, d.weekly_goal_miles,
                   (
                     SELECT COALESCE(SUM(r.miles), 0)::float FROM runs r
                     JOIN conversations c ON c.id = r.conversation_id
                     WHERE c.owner_id = d.user_id AND r.status = 'confirmed' AND r.run_date >= ${weekStart}
                   ) AS miles_this_week,
                   (SELECT COUNT(*)::int FROM dog_reviews dr WHERE dr.dog_owner_id = u.id) AS review_count
            FROM dog_profiles d
            JOIN users u ON u.id = d.user_id
            WHERE d.route = 'castle-island'
            ORDER BY u.created_at DESC
            LIMIT 60
          `;

    return NextResponse.json({
      // Synthetic ids — public rows must not carry real user ids
      profiles: rows.map((p, i) => ({ id: `p${i}`, ...p, overlap: 0, pace_match: false })),
      viewing: view,
      public: true,
    });
  }

  const sql = db();
  const uid = session.userId;
  const weekStart = bostonWeekStart();

  // My own profile — for match scoring, completeness nudges, and (owners) the ledger
  const myRows =
    session.role === 'owner'
      ? await sql`
          SELECT d.schedule, d.pace, d.photo_url, d.dog_name, d.weekly_goal_miles,
            (
              SELECT COALESCE(SUM(r.miles), 0)::float FROM runs r
              JOIN conversations c ON c.id = r.conversation_id
              WHERE c.owner_id = d.user_id AND r.status = 'confirmed' AND r.run_date >= ${weekStart}
            ) AS miles_this_week
          FROM dog_profiles d WHERE d.user_id = ${uid}
        `
      : await sql`SELECT schedule, pace, photo_url FROM runner_profiles WHERE user_id = ${uid}`;
  const mySchedule = (myRows[0]?.schedule as Schedule | undefined) ?? null;
  const myPace = (myRows[0]?.pace as string | undefined) ?? null;
  const me = {
    hasProfile: myRows.length > 0,
    hasPhoto: Boolean(myRows[0]?.photo_url),
    dogName: (myRows[0]?.dog_name as string | undefined) ?? null,
    weeklyGoalMiles: (myRows[0]?.weekly_goal_miles as number | undefined) ?? null,
    milesThisWeek: (myRows[0]?.miles_this_week as number | undefined) ?? 0,
  };

  // Owner sees runners; runner sees dog owners (dogs carry their weekly ledger)
  const rows =
    session.role === 'owner'
      ? await sql`
          SELECT u.id, u.created_at, r.runner_name, r.pace, r.typical_distance,
                 r.availability, r.photo_url, r.route, r.schedule,
                 (SELECT COUNT(*)::int FROM runner_reviews rr WHERE rr.runner_id = u.id) AS review_count
          FROM runner_profiles r
          JOIN users u ON u.id = r.user_id
          WHERE r.route = 'castle-island'
        `
      : await sql`
          SELECT u.id, u.created_at, d.dog_name, d.breed, d.pace, d.quirks,
                 d.owner_name, d.photo_url, d.route, d.schedule,
                 d.weekly_goal_miles,
                 (
                   SELECT COALESCE(SUM(r.miles), 0)::float FROM runs r
                   JOIN conversations c ON c.id = r.conversation_id
                   WHERE c.owner_id = d.user_id AND r.status = 'confirmed' AND r.run_date >= ${weekStart}
                 ) AS miles_this_week,
                 (SELECT COUNT(*)::int FROM dog_reviews dr WHERE dr.dog_owner_id = u.id) AS review_count
          FROM dog_profiles d
          JOIN users u ON u.id = d.user_id
          WHERE d.route = 'castle-island'
        `;

  // Score every profile: shared schedule slots + pace compatibility
  const profiles = rows
    .map((p) => {
      const { schedule, ...rest } = p;
      const sched = (schedule as Schedule | null) ?? null;
      return {
        ...rest,
        // `availability` is a legacy free-text column that's never populated —
        // derive the real "when" summary from the actual schedule instead
        ...(session.role === 'owner' ? { availability: sched ? scheduleToText(sched) : 'No schedule set' } : {}),
        overlap: scheduleOverlap(mySchedule, sched),
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
