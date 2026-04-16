import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/conversations/[id] — fetch thread + mark unread as read
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const uid = session.userId;
  const sql = db();

  // Verify user is participant
  const convRows = await sql`
    SELECT c.*,
      dp.dog_name, dp.photo_url AS owner_photo, dp.pace AS owner_pace, dp.breed,
      rp.runner_name, rp.photo_url AS runner_photo, rp.pace AS runner_pace, rp.typical_distance,
      dp.schedule AS owner_schedule, rp.schedule AS runner_schedule
    FROM conversations c
    LEFT JOIN dog_profiles dp ON dp.user_id = c.owner_id
    LEFT JOIN runner_profiles rp ON rp.user_id = c.runner_id
    WHERE c.id = ${id}
      AND (c.owner_id = ${uid} OR c.runner_id = ${uid})
  `;

  if (convRows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const conv = convRows[0];

  // Fetch messages
  const msgs = await sql`
    SELECT m.*, u.username AS sender_username
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ${id}
    ORDER BY m.created_at ASC
  `;

  // Mark messages from other user as read
  await sql`
    UPDATE messages
    SET read_at = now()
    WHERE conversation_id = ${id}
      AND sender_id != ${uid}
      AND read_at IS NULL
  `;

  return NextResponse.json({ conversation: conv, messages: msgs });
}

// POST /api/conversations/[id] — send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const uid = session.userId;
  const sql = db();

  // Verify participant
  const convRows = await sql`
    SELECT id FROM conversations
    WHERE id = ${id} AND (owner_id = ${uid} OR runner_id = ${uid})
  `;
  if (convRows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: 'content required' }, { status: 400 });
  }

  const [msg] = await sql`
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (${id}, ${uid}, ${content.trim()})
    RETURNING *
  `;

  return NextResponse.json({ message: msg });
}
