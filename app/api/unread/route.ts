import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ count: 0 });
  }

  const sql = db();
  const uid = session.userId;

  const rows = await sql`
    SELECT COUNT(*) AS count
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE (c.owner_id = ${uid} OR c.runner_id = ${uid})
      AND m.sender_id != ${uid}
      AND m.read_at IS NULL
  `;

  return NextResponse.json({ count: Number(rows[0].count) });
}
