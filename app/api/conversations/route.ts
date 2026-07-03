import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getConvParticipants } from '@/lib/participants';
import { notifyNewMatch, notifyNewMessage } from '@/lib/email';

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
      SELECT
        CASE WHEN content = '' AND photo_url IS NOT NULL THEN '📷 Photo' ELSE content END AS content,
        created_at
      FROM messages
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

  // Find or create the conversation — track whether this is a brand-new match
  const existing = await sql`
    SELECT id FROM conversations WHERE owner_id = ${ownerId} AND runner_id = ${runnerId}
  `;
  const isNewMatch = existing.length === 0;
  const conv = isNewMatch
    ? (
        await sql`
          INSERT INTO conversations (owner_id, runner_id)
          VALUES (${ownerId}, ${runnerId})
          RETURNING id
        `
      )[0]
    : existing[0];

  // Was the recipient already sitting on unread messages? (spam guard)
  const uid = session.userId;
  const [{ unread }] = (await sql`
    SELECT COUNT(*)::int AS unread FROM messages
    WHERE conversation_id = ${conv.id} AND sender_id = ${uid} AND read_at IS NULL
  `) as [{ unread: number }];

  // Send opening message if provided
  const text = message?.trim();
  if (text) {
    await sql`
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES (${conv.id}, ${uid}, ${text})
    `;
  }

  const conversationId = conv.id as string;

  // Notify the other party after the response is sent
  if (text) {
    after(async () => {
      const participants = await getConvParticipants(sql, conversationId);
      const sides = participants?.bySide(uid);
      if (!sides) return;
      if (isNewMatch) {
        await notifyNewMatch({
          to: sides.other.email,
          recipientName: sides.other.name,
          senderName: sides.me.label,
          message: text,
          conversationId,
        });
      } else if (unread === 0) {
        // Only email on the first unread message — not for every line of a chat
        await notifyNewMessage({
          to: sides.other.email,
          recipientName: sides.other.name,
          senderName: sides.me.label,
          preview: text.slice(0, 200),
          conversationId,
        });
      }
    });
  }

  return NextResponse.json({ conversationId });
}
