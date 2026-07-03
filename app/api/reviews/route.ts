import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// POST /api/reviews — owner leaves/edits/removes a comment on a runner.
// Comments only, never scores. Empty comment deletes.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || session.role !== 'owner') {
    return NextResponse.json({ error: 'Only dog owners can leave comments' }, { status: 403 });
  }

  const { runnerId, comment } = await req.json();
  if (!runnerId) {
    return NextResponse.json({ error: 'runnerId required' }, { status: 400 });
  }

  const sql = db();
  const uid = session.userId;
  const text = String(comment ?? '').trim().slice(0, 500);

  // Eligibility: at least one completed confirmed run together
  const eligible = await sql`
    SELECT 1 FROM runs r
    JOIN conversations c ON c.id = r.conversation_id
    WHERE c.owner_id = ${uid} AND c.runner_id = ${runnerId}
      AND r.status = 'confirmed' AND r.run_date <= now()::date
    LIMIT 1
  `;
  if (eligible.length === 0) {
    return NextResponse.json({ error: 'You can comment after you complete a run together' }, { status: 403 });
  }

  if (!text) {
    await sql`DELETE FROM runner_reviews WHERE runner_id = ${runnerId} AND author_id = ${uid}`;
    return NextResponse.json({ ok: true, deleted: true });
  }

  await sql`
    INSERT INTO runner_reviews (runner_id, author_id, comment)
    VALUES (${runnerId}, ${uid}, ${text})
    ON CONFLICT (runner_id, author_id) DO UPDATE SET
      comment = EXCLUDED.comment, created_at = now()
  `;
  return NextResponse.json({ ok: true });
}
