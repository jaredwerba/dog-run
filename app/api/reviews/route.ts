import { NextRequest, NextResponse, after } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { bostonToday } from '@/lib/dogMiles';
import { notifyRunnerReviewed, notifyDogLoved } from '@/lib/email';

// POST /api/reviews — leave/edit/remove a comment (+ optional photo) on the
// other side after a completed run together. Comments only, never scores.
// Owners review runners (runner_reviews); runners review dogs (dog_reviews).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || !session.role) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 403 });
  }

  const { targetId, comment, photoUrl } = await req.json();
  if (!targetId) {
    return NextResponse.json({ error: 'targetId required' }, { status: 400 });
  }

  const sql = db();
  const uid = session.userId;
  const isOwner = session.role === 'owner';
  const text = String(comment ?? '').trim().slice(0, 500);
  const today = bostonToday();
  const photo = typeof photoUrl === 'string' && photoUrl ? photoUrl : null;

  // Eligibility: at least one completed confirmed run together
  const eligible = isOwner
    ? await sql`
        SELECT 1 FROM runs r
        JOIN conversations c ON c.id = r.conversation_id
        WHERE c.owner_id = ${uid} AND c.runner_id = ${targetId}
          AND r.status = 'confirmed' AND r.run_date <= ${today}
        LIMIT 1
      `
    : await sql`
        SELECT 1 FROM runs r
        JOIN conversations c ON c.id = r.conversation_id
        WHERE c.runner_id = ${uid} AND c.owner_id = ${targetId}
          AND r.status = 'confirmed' AND r.run_date <= ${today}
        LIMIT 1
      `;
  if (eligible.length === 0) {
    return NextResponse.json({ error: 'You can comment after you complete a run together' }, { status: 403 });
  }

  if (isOwner) {
    if (!text) {
      await sql`DELETE FROM runner_reviews WHERE runner_id = ${targetId} AND author_id = ${uid}`;
      return NextResponse.json({ ok: true, deleted: true });
    }
    const prior = await sql`SELECT 1 FROM runner_reviews WHERE runner_id = ${targetId} AND author_id = ${uid}`;
    await sql`
      INSERT INTO runner_reviews (runner_id, author_id, comment, photo_url)
      VALUES (${targetId}, ${uid}, ${text}, ${photo})
      ON CONFLICT (runner_id, author_id) DO UPDATE SET
        comment = EXCLUDED.comment, photo_url = EXCLUDED.photo_url, created_at = now()
    `;
    // First time only: let the runner know an owner praised them
    if (prior.length === 0) {
      after(async () => {
        const rows = await sql`
          SELECT ru.username AS runner_email, rp.runner_name,
                 dp.owner_name, dp.dog_name
          FROM users ru
          LEFT JOIN runner_profiles rp ON rp.user_id = ru.id
          LEFT JOIN dog_profiles dp ON dp.user_id = ${uid}
          WHERE ru.id = ${targetId}
        `;
        const r = rows[0];
        if (!r?.runner_email) return;
        await notifyRunnerReviewed({
          to: r.runner_email as string,
          runnerId: targetId as string,
          runnerName: (r.runner_name as string) ?? 'there',
          ownerName: (r.owner_name as string) ?? 'A dog owner',
          dogName: (r.dog_name as string) ?? 'their dog',
          comment: text,
          photoUrl: photo,
        });
      });
    }
  } else {
    if (!text) {
      await sql`DELETE FROM dog_reviews WHERE dog_owner_id = ${targetId} AND author_id = ${uid}`;
      return NextResponse.json({ ok: true, deleted: true });
    }
    const prior = await sql`SELECT 1 FROM dog_reviews WHERE dog_owner_id = ${targetId} AND author_id = ${uid}`;
    await sql`
      INSERT INTO dog_reviews (dog_owner_id, author_id, comment, photo_url)
      VALUES (${targetId}, ${uid}, ${text}, ${photo})
      ON CONFLICT (dog_owner_id, author_id) DO UPDATE SET
        comment = EXCLUDED.comment, photo_url = EXCLUDED.photo_url, created_at = now()
    `;
    // First time only: deliver the "your dog was loved" payoff to the owner
    if (prior.length === 0) {
      after(async () => {
        const rows = await sql`
          SELECT ou.username AS owner_email, dp.owner_name, dp.dog_name,
                 rp.runner_name,
                 (SELECT id FROM conversations WHERE owner_id = ${targetId} AND runner_id = ${uid} LIMIT 1) AS conversation_id
          FROM users ou
          LEFT JOIN dog_profiles dp ON dp.user_id = ou.id
          LEFT JOIN runner_profiles rp ON rp.user_id = ${uid}
          WHERE ou.id = ${targetId}
        `;
        const r = rows[0];
        if (!r?.owner_email || !r.conversation_id) return;
        await notifyDogLoved({
          to: r.owner_email as string,
          ownerName: (r.owner_name as string) ?? 'there',
          runnerName: (r.runner_name as string) ?? 'A runner',
          dogName: (r.dog_name as string) ?? 'your dog',
          comment: text,
          photoUrl: photo,
          conversationId: r.conversation_id as string,
        });
      });
    }
  }

  return NextResponse.json({ ok: true });
}
