import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getConvParticipants } from '@/lib/participants';
import { notifyRunProposed } from '@/lib/email';
import { formatRunLabel } from '@/lib/ics';

// POST /api/runs — propose a run in a conversation
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { conversationId, date, time, location } = await req.json();
  if (!conversationId || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !/^\d{2}:\d{2}$/.test(time ?? '')) {
    return NextResponse.json({ error: 'conversationId, date (YYYY-MM-DD) and time (HH:MM) required' }, { status: 400 });
  }

  const uid = session.userId;
  const sql = db();

  // Verify participant
  const convRows = await sql`
    SELECT id FROM conversations
    WHERE id = ${conversationId} AND (owner_id = ${uid} OR runner_id = ${uid})
  `;
  if (convRows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const loc = (location ?? '').trim() || 'Castle Island, South Boston';

  // Supersede any older open proposal in this conversation
  await sql`
    UPDATE runs SET status = 'cancelled', responded_at = now()
    WHERE conversation_id = ${conversationId} AND status = 'proposed'
  `;

  const [run] = await sql`
    INSERT INTO runs (conversation_id, proposer_id, run_date, run_time, location)
    VALUES (${conversationId}, ${uid}, ${date}, ${time}, ${loc})
    RETURNING *
  `;

  const label = formatRunLabel(date, time);

  // Drop a note into the thread so the proposal has chat context
  await sql`
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (${conversationId}, ${uid}, ${`📅 Proposed a run — ${label} at ${loc}`})
  `;

  // Email the other party after the response is sent
  after(async () => {
    const participants = await getConvParticipants(sql, conversationId);
    const sides = participants?.bySide(uid);
    if (!sides) return;
    await notifyRunProposed({
      to: sides.other.email,
      recipientName: sides.other.name,
      proposerName: sides.me.label,
      runLabel: label,
      location: loc,
      conversationId,
    });
  });

  return NextResponse.json({ run });
}
