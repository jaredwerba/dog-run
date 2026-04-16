import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/conversations — list all conversations for current user
export async function GET() {
  const session = await getSession();
  if (!session.userId || !session.role) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const sql = db();
  const uid = session.userId;

  const rows = await sql`
    SELECT
      c.id,
      c.created_at,
      -- other user info
      CASE WHEN c.owner_id = ${uid} THEN ru.id    ELSE ou.id    END AS other_user_id,
      CASE WHEN c.owner_id = ${uid} THEN rp.runner_name ELSE dp.dog_name  END AS other_display_name,
      CASE WHEN c.owner_id = ${uid} THEN rp.photo_url   ELSE dp.photo_url END AS other_photo_url,
      CASE WHEN c.owner_id = ${uid} THEN 'runner' ELSE 'owner' END AS other_role,
      -- last message
      lm.content AS last_message,
      lm.created_at AS last_message_at,
      -- unread count (messages from other user not yet read)
      (
        SELECT COUNT(*) FROM messages m
        WHERE m.conversation_id = c.id
          AND m.sender_id != ${uid}
          AND m.read_at IS NULL
      ) AS unread_count
    FROM conversations c
    LEFT JOIN users ou  ON ou.id  = c.owner_id
    LEFT JOIN users ru  ON ru.id  = c.runner_id
    LEFT JOIN dog_profiles    dp ON dp.user_id = c.owner_id
    LEFT JOIN runner_profiles rp ON rp.user_id = c.runner_id
    LEFT JOIN LATERAL (
      SELECT content, created_at FROM messages
      WHERE conversation_id = c.id
      ORDER BY created_at DESC LIMIT 1
    ) lm ON true
    WHERE c.owner_id = ${uid} OR c.runner_id = ${uid}
    ORDER BY COALESCE(lm.created_at, c.created_at) DESC
  `;

  return NextResponse.json({ conversations: rows });
}

// POST /api/conversations — start or get conversation with another user
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || !session.role) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { toUserId, message } = await req.json();
  if (!toUserId) {
    return NextResponse.json({ error: 'toUserId required' }, { status: 400 });
  }

  const sql = db();

  // Determine owner/runner sides
  const isOwner = session.role === 'owner';
  const ownerId = isOwner ? session.userId : toUserId;
  const runnerId = isOwner ? toUserId : session.userId;

  // Upsert conversation
  const [conv] = await sql`
    INSERT INTO conversations (owner_id, runner_id)
    VALUES (${ownerId}, ${runnerId})
    ON CONFLICT (owner_id, runner_id) DO UPDATE SET owner_id = EXCLUDED.owner_id
    RETURNING id
  `;

  // Send opening message if provided
  if (message?.trim()) {
    await sql`
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES (${conv.id}, ${session.userId}, ${message.trim()})
    `;
  }

  return NextResponse.json({ conversationId: conv.id as string });
}
