import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.userId || !session.role) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const sql = db();

  // Owner sees runners; runner sees dog owners
  if (session.role === 'owner') {
    const rows = await sql`
      SELECT u.id, u.username, r.runner_name, r.pace, r.typical_distance,
             r.contact, r.availability, r.photo_url, r.route
      FROM runner_profiles r
      JOIN users u ON u.id = r.user_id
      WHERE r.route = 'castle-island'
      ORDER BY u.created_at DESC
    `;
    return NextResponse.json({ profiles: rows, viewing: 'runners' });
  } else {
    const rows = await sql`
      SELECT u.id, u.username, d.dog_name, d.breed, d.pace,
             d.owner_name, d.owner_contact, d.photo_url, d.route
      FROM dog_profiles d
      JOIN users u ON u.id = d.user_id
      WHERE d.route = 'castle-island'
      ORDER BY u.created_at DESC
    `;
    return NextResponse.json({ profiles: rows, viewing: 'dogs' });
  }
}
