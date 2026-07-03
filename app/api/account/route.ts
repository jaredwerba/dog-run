import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function DELETE() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const sql = db();
  const uid = session.userId;

  // Gather every photo this user is responsible for before the cascade deletes
  // the rows that reference them — orphaned rows can't be queried afterward.
  const [dogPhoto, runnerPhoto, messagePhotos, runnerReviewPhotos, dogReviewPhotos, feedbackPhotos] =
    await Promise.all([
      sql`SELECT photo_url FROM dog_profiles WHERE user_id = ${uid} AND photo_url IS NOT NULL`,
      sql`SELECT photo_url FROM runner_profiles WHERE user_id = ${uid} AND photo_url IS NOT NULL`,
      sql`SELECT photo_url FROM messages WHERE sender_id = ${uid} AND photo_url IS NOT NULL`,
      sql`SELECT photo_url FROM runner_reviews WHERE author_id = ${uid} AND photo_url IS NOT NULL`,
      sql`SELECT photo_url FROM dog_reviews WHERE author_id = ${uid} AND photo_url IS NOT NULL`,
      sql`SELECT photo_url FROM run_feedback WHERE author_id = ${uid} AND photo_url IS NOT NULL`,
    ]);

  const urls = [
    ...dogPhoto,
    ...runnerPhoto,
    ...messagePhotos,
    ...runnerReviewPhotos,
    ...dogReviewPhotos,
    ...feedbackPhotos,
  ]
    .map((row) => row.photo_url as string)
    .filter(Boolean);

  await Promise.all(
    urls.map((url) =>
      del(url).catch((err) => console.error('[account delete] failed to remove blob:', url, err))
    )
  );

  // Every child table cascades from users(id), so this one delete cleans up
  // credentials, profiles, conversations, messages, runs, feedback, and reviews.
  await sql`DELETE FROM users WHERE id = ${uid}`;

  session.destroy();
  return NextResponse.json({ ok: true });
}
