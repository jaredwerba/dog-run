import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { bostonWeekStart } from '@/lib/dogMiles';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId || !session.role) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const sql = db();

  // Viewer's own schedule — for shared-slot highlights
  const mineRows =
    session.role === 'owner'
      ? await sql`SELECT schedule FROM dog_profiles WHERE user_id = ${session.userId}`
      : await sql`SELECT schedule FROM runner_profiles WHERE user_id = ${session.userId}`;
  const mySchedule = mineRows[0]?.schedule ?? null;

  // Determine which profile type to fetch based on session role
  // Owner (looking at runners) → fetch runner profile
  // Runner (looking at dog owners) → fetch dog profile
  if (session.role === 'owner') {
    const rows = await sql`
      SELECT u.id, u.username, r.*
      FROM runner_profiles r
      JOIN users u ON u.id = r.user_id
      WHERE u.id = ${id}
    `;
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const uid = session.userId;
    // Owner comments — with author name, dog, and runs-together count
    const reviews = await sql`
      SELECT rr.comment, rr.created_at, rr.author_id, rr.photo_url,
             dp.owner_name, dp.dog_name,
             (
               SELECT COUNT(*) FROM runs r2
               JOIN conversations c2 ON c2.id = r2.conversation_id
               WHERE c2.runner_id = ${id} AND c2.owner_id = rr.author_id
                 AND r2.status = 'confirmed' AND r2.run_date <= now()::date
             )::int AS runs_together
      FROM runner_reviews rr
      LEFT JOIN dog_profiles dp ON dp.user_id = rr.author_id
      WHERE rr.runner_id = ${id}
      ORDER BY rr.created_at DESC
      LIMIT 30
    `;
    const canReview = (
      await sql`
        SELECT 1 FROM runs r3
        JOIN conversations c3 ON c3.id = r3.conversation_id
        WHERE c3.owner_id = ${uid} AND c3.runner_id = ${id}
          AND r3.status = 'confirmed' AND r3.run_date <= now()::date
        LIMIT 1
      `
    ).length > 0;
    const myReview = reviews.find((rv) => rv.author_id === uid)?.comment ?? '';

    return NextResponse.json({
      profile: rows[0],
      type: 'runner',
      reviews: reviews.map(({ author_id, ...rest }) => ({ ...rest, mine: author_id === uid })),
      canReview,
      myReview,
      mySchedule,
    });
  } else {
    const weekStart = bostonWeekStart();
    const rows = await sql`
      SELECT u.id, u.username, d.*,
        (
          SELECT COALESCE(SUM(r.miles), 0)::float FROM runs r
          JOIN conversations c ON c.id = r.conversation_id
          WHERE c.owner_id = d.user_id AND r.status = 'confirmed' AND r.run_date >= ${weekStart}
        ) AS miles_this_week
      FROM dog_profiles d
      JOIN users u ON u.id = d.user_id
      WHERE u.id = ${id}
    `;
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const uid = session.userId;
    // Runner comments about the dog — with author name and runs-together count
    const reviews = await sql`
      SELECT dr.comment, dr.created_at, dr.author_id, dr.photo_url,
             rp.runner_name,
             (
               SELECT COUNT(*) FROM runs r2
               JOIN conversations c2 ON c2.id = r2.conversation_id
               WHERE c2.owner_id = ${id} AND c2.runner_id = dr.author_id
                 AND r2.status = 'confirmed' AND r2.run_date <= now()::date
             )::int AS runs_together
      FROM dog_reviews dr
      LEFT JOIN runner_profiles rp ON rp.user_id = dr.author_id
      WHERE dr.dog_owner_id = ${id}
      ORDER BY dr.created_at DESC
      LIMIT 30
    `;
    const canReview = (
      await sql`
        SELECT 1 FROM runs r3
        JOIN conversations c3 ON c3.id = r3.conversation_id
        WHERE c3.runner_id = ${uid} AND c3.owner_id = ${id}
          AND r3.status = 'confirmed' AND r3.run_date <= now()::date
        LIMIT 1
      `
    ).length > 0;
    const myReview = reviews.find((rv) => rv.author_id === uid)?.comment ?? '';

    return NextResponse.json({
      profile: rows[0],
      type: 'dog',
      mySchedule,
      reviews: reviews.map(({ author_id, ...rest }) => ({ ...rest, mine: author_id === uid })),
      canReview,
      myReview,
    });
  }
}
