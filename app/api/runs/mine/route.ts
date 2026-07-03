import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { bostonToday } from '@/lib/dogMiles';

// GET /api/runs/mine — everything the dashboard needs in one shot
export async function GET() {
  const session = await getSession();
  if (!session.userId || !session.role) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const sql = db();
  const uid = session.userId;
  const today = bostonToday();

  const rows = await sql`
    SELECT r.id, r.conversation_id, r.proposer_id, r.run_date, r.run_time,
           r.location, r.miles, r.status, r.reported_at,
      EXISTS(
        SELECT 1 FROM run_feedback f WHERE f.run_id = r.id AND f.author_id = ${uid}
      ) AS i_gave_feedback,
      CASE WHEN c.owner_id = ${uid} THEN rp.runner_name ELSE dp.dog_name END AS other_name,
      CASE WHEN c.owner_id = ${uid} THEN rp.photo_url   ELSE dp.photo_url END AS other_photo,
      CASE WHEN c.owner_id = ${uid} THEN 'runner' ELSE 'dog' END AS other_kind
    FROM runs r
    JOIN conversations c ON c.id = r.conversation_id
    LEFT JOIN dog_profiles dp ON dp.user_id = c.owner_id
    LEFT JOIN runner_profiles rp ON rp.user_id = c.runner_id
    WHERE (c.owner_id = ${uid} OR c.runner_id = ${uid})
      AND (
        (r.status = 'confirmed' AND r.run_date >= (${today}::date - INTERVAL '14 days'))
        OR r.status = 'proposed'
      )
    ORDER BY r.run_date ASC, r.run_time ASC
  `;

  const upcoming = rows.filter(
    (r) => r.status === 'confirmed' && String(r.run_date).slice(0, 10) >= today
  );
  // Stale proposals (for dates that already passed) are dead — don't show them
  const openProposal = (r: (typeof rows)[number]) =>
    r.status === 'proposed' && String(r.run_date).slice(0, 10) >= today;
  const awaitingMe = rows.filter((r) => openProposal(r) && r.proposer_id !== uid);
  const awaitingThem = rows.filter((r) => openProposal(r) && r.proposer_id === uid);
  const past = rows
    .filter((r) => r.status === 'confirmed' && String(r.run_date).slice(0, 10) < today)
    .reverse();

  return NextResponse.json({ today, upcoming, awaitingMe, awaitingThem, past });
}
