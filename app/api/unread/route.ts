import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ count: 0, pendingRuns: 0 });
  }

  const sql = db();
  const uid = session.userId;

  const rows = await sql`
    SELECT
      (
        SELECT COUNT(*) FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE (c.owner_id = ${uid} OR c.runner_id = ${uid})
          AND m.sender_id != ${uid}
          AND m.read_at IS NULL
      ) AS count,
      (
        SELECT COUNT(*) FROM runs r
        JOIN conversations c ON c.id = r.conversation_id
        WHERE (c.owner_id = ${uid} OR c.runner_id = ${uid})
          AND r.status = 'proposed'
          AND r.proposer_id != ${uid}
      ) AS pending_runs
  `;

  return NextResponse.json({
    count: Number(rows[0].count),
    pendingRuns: Number(rows[0].pending_runs),
  });
}
