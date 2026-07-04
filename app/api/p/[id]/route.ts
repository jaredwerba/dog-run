import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bostonToday, bostonWeekStart } from '@/lib/dogMiles';

// GET /api/p/[id] — public, no-auth profile view for shareable links.
// Strictly public-safe fields: no email/contact/schedule.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = db();

  const userRows = await sql`SELECT role FROM users WHERE id = ${id}`;
  if (userRows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const role = userRows[0].role as 'owner' | 'runner';

  if (role === 'owner') {
    const weekStart = bostonWeekStart();
    const rows = await sql`
      SELECT d.dog_name, d.breed, d.pace, d.photo_url, d.quirks, d.weekly_goal_miles,
        (
          SELECT COALESCE(SUM(r.miles), 0)::float FROM runs r
          JOIN conversations c ON c.id = r.conversation_id
          WHERE c.owner_id = ${id} AND r.status = 'confirmed' AND r.run_date >= ${weekStart}
        ) AS miles_this_week
      FROM dog_profiles d WHERE d.user_id = ${id}
    `;
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const reviews = await sql`
      SELECT dr.comment, dr.created_at, dr.photo_url, rp.runner_name
      FROM dog_reviews dr
      LEFT JOIN runner_profiles rp ON rp.user_id = dr.author_id
      WHERE dr.dog_owner_id = ${id}
      ORDER BY dr.created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({ type: 'dog', profile: rows[0], reviews });
  } else {
    const rows = await sql`
      SELECT r.runner_name, r.pace, r.typical_distance, r.photo_url, r.solo_pace, r.personal_best
      FROM runner_profiles r WHERE r.user_id = ${id}
    `;
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const reviews = await sql`
      SELECT rr.comment, rr.created_at, rr.photo_url, dp.owner_name, dp.dog_name
      FROM runner_reviews rr
      LEFT JOIN dog_profiles dp ON dp.user_id = rr.author_id
      WHERE rr.runner_id = ${id}
      ORDER BY rr.created_at DESC
      LIMIT 20
    `;

    const today = bostonToday();
    const dogsRunWith = (
      await sql`
        SELECT COUNT(DISTINCT c.owner_id)::int AS n
        FROM runs r JOIN conversations c ON c.id = r.conversation_id
        WHERE c.runner_id = ${id} AND r.status = 'confirmed' AND r.run_date <= ${today}
      `
    )[0].n as number;

    return NextResponse.json({ type: 'runner', profile: rows[0], reviews, dogsRunWith });
  }
}
