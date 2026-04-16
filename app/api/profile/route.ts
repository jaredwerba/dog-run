import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const sql = db();

  if (session.role === 'owner') {
    const rows = await sql`
      SELECT u.username, d.*
      FROM dog_profiles d
      JOIN users u ON u.id = d.user_id
      WHERE d.user_id = ${session.userId}
    `;
    return NextResponse.json({ profile: rows[0] ?? null, role: 'owner' });
  } else {
    const rows = await sql`
      SELECT u.username, r.*
      FROM runner_profiles r
      JOIN users u ON u.id = r.user_id
      WHERE r.user_id = ${session.userId}
    `;
    return NextResponse.json({ profile: rows[0] ?? null, role: 'runner' });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || !session.role) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const sql = db();
  const scheduleJson = JSON.stringify(body.schedule ?? {});

  if (session.role === 'owner') {
    const { dogName, breed, pace, ownerName, photoUrl } = body;
    await sql`
      INSERT INTO dog_profiles (user_id, dog_name, breed, pace, owner_name, owner_contact, photo_url, route, schedule)
      VALUES (${session.userId}, ${dogName}, ${breed}, ${pace}, ${ownerName}, '', ${photoUrl ?? null}, 'castle-island', ${scheduleJson}::jsonb)
      ON CONFLICT (user_id) DO UPDATE SET
        dog_name = EXCLUDED.dog_name,
        breed = EXCLUDED.breed,
        pace = EXCLUDED.pace,
        owner_name = EXCLUDED.owner_name,
        photo_url = EXCLUDED.photo_url,
        schedule = EXCLUDED.schedule
    `;
  } else {
    const { runnerName, pace, typicalDistance, photoUrl } = body;
    await sql`
      INSERT INTO runner_profiles (user_id, runner_name, pace, typical_distance, contact, availability, photo_url, route, schedule)
      VALUES (${session.userId}, ${runnerName}, ${pace}, ${typicalDistance}, '', '', ${photoUrl ?? null}, 'castle-island', ${scheduleJson}::jsonb)
      ON CONFLICT (user_id) DO UPDATE SET
        runner_name = EXCLUDED.runner_name,
        pace = EXCLUDED.pace,
        typical_distance = EXCLUDED.typical_distance,
        photo_url = EXCLUDED.photo_url,
        schedule = EXCLUDED.schedule
    `;
  }

  return NextResponse.json({ ok: true });
}
