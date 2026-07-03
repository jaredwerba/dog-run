import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/favorites — ids the current user has favorited
export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const sql = db();
  const rows = await sql`SELECT target_id FROM favorites WHERE user_id = ${session.userId}`;
  return NextResponse.json({ ids: rows.map((r) => r.target_id) });
}

// POST /api/favorites — toggle a favorite on/off
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { targetId } = await req.json();
  if (!targetId) {
    return NextResponse.json({ error: 'targetId required' }, { status: 400 });
  }

  const sql = db();
  const uid = session.userId;

  const existing = await sql`SELECT id FROM favorites WHERE user_id = ${uid} AND target_id = ${targetId}`;
  if (existing.length > 0) {
    await sql`DELETE FROM favorites WHERE user_id = ${uid} AND target_id = ${targetId}`;
    return NextResponse.json({ favorited: false });
  }
  await sql`INSERT INTO favorites (user_id, target_id) VALUES (${uid}, ${targetId}) ON CONFLICT DO NOTHING`;
  return NextResponse.json({ favorited: true });
}
