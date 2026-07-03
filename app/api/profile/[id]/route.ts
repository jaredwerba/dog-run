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
    return NextResponse.json({ profile: rows[0], type: 'runner' });
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
    return NextResponse.json({ profile: rows[0], type: 'dog' });
  }
}
