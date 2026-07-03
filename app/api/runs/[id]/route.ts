import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getConvParticipants } from '@/lib/participants';
import { notifyRunConfirmed, notifyRunDeclined } from '@/lib/email';
import { buildIcs, formatRunLabel } from '@/lib/ics';

// POST /api/runs/[id] — accept / decline (recipient) or cancel (proposer)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const action = body.action as string;
  if (!['accept', 'decline', 'cancel', 'report', 'feedback'].includes(action)) {
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  }

  const uid = session.userId;
  const sql = db();

  const runRows = await sql`
    SELECT r.*, c.owner_id, c.runner_id
    FROM runs r
    JOIN conversations c ON c.id = r.conversation_id
    WHERE r.id = ${id} AND (c.owner_id = ${uid} OR c.runner_id = ${uid})
  `;
  if (runRows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const run = runRows[0];
  const conversationId = run.conversation_id as string;
  const isProposer = run.proposer_id === uid;

  // ── Two-sided post-run feedback: comment + optional miles/review/rebook ──
  if (action === 'feedback') {
    if (run.status !== 'confirmed') {
      return NextResponse.json({ error: 'Only confirmed runs can get feedback' }, { status: 400 });
    }
    const role = run.owner_id === uid ? 'owner' : 'runner';
    const comment = String(body.comment ?? '').trim().slice(0, 500);
    const wantsRebook = Boolean(body.wantsRebook);
    const photoUrl = typeof body.photoUrl === 'string' && body.photoUrl ? body.photoUrl : null;
    const shareAsReview = Boolean(body.shareAsReview) && comment.length > 0;

    let milesActual: number | null = null;
    if (role === 'runner' && body.milesActual !== undefined && body.milesActual !== '') {
      const m = Number(body.milesActual);
      if (!Number.isFinite(m) || m < 0 || m > 30) {
        return NextResponse.json({ error: 'miles must be between 0 and 30' }, { status: 400 });
      }
      milesActual = Math.round(m * 10) / 10;
    }

    await sql`
      INSERT INTO run_feedback (run_id, author_id, role, comment, wants_rebook, miles_actual, share_as_review, photo_url)
      VALUES (${id}, ${uid}, ${role}, ${comment}, ${wantsRebook}, ${milesActual}, ${shareAsReview}, ${photoUrl})
      ON CONFLICT (run_id, author_id) DO UPDATE SET
        comment = EXCLUDED.comment,
        wants_rebook = EXCLUDED.wants_rebook,
        miles_actual = EXCLUDED.miles_actual,
        share_as_review = EXCLUDED.share_as_review,
        photo_url = EXCLUDED.photo_url,
        created_at = now()
    `;

    // Runner's actual miles keep the ledger honest
    if (milesActual !== null) {
      await sql`UPDATE runs SET miles = ${milesActual}, reported_at = now() WHERE id = ${id}`;
    }

    // Owner reviews the runner; runner reviews the dog. Comments only, no scores.
    if (shareAsReview && role === 'owner') {
      await sql`
        INSERT INTO runner_reviews (runner_id, author_id, comment, photo_url)
        VALUES (${run.runner_id}, ${uid}, ${comment}, ${photoUrl})
        ON CONFLICT (runner_id, author_id) DO UPDATE SET
          comment = EXCLUDED.comment, photo_url = EXCLUDED.photo_url, created_at = now()
      `;
    } else if (shareAsReview && role === 'runner') {
      await sql`
        INSERT INTO dog_reviews (dog_owner_id, author_id, comment, photo_url)
        VALUES (${run.owner_id}, ${uid}, ${comment}, ${photoUrl})
        ON CONFLICT (dog_owner_id, author_id) DO UPDATE SET
          comment = EXCLUDED.comment, photo_url = EXCLUDED.photo_url, created_at = now()
      `;
    }

    const chatNote = `🏁 ${comment ? `"${comment}"` : 'Logged the run'}${milesActual !== null ? ` — ${milesActual} mi` : ''}${wantsRebook ? ' · up for the same time next week 🔁' : ''}`;
    await sql`
      INSERT INTO messages (conversation_id, sender_id, content, photo_url)
      VALUES (${conversationId}, ${uid}, ${chatNote}, ${photoUrl})
    `;

    return NextResponse.json({ ok: true, wantsRebook });
  }

  // ── Post-run report: log actual miles + a note, fills the mileage ledger ──
  if (action === 'report') {
    if (run.status !== 'confirmed') {
      return NextResponse.json({ error: 'Only confirmed runs can be reported' }, { status: 400 });
    }
    const parsedMiles = Number(body.miles);
    if (!Number.isFinite(parsedMiles) || parsedMiles < 0 || parsedMiles > 30) {
      return NextResponse.json({ error: 'miles must be between 0 and 30' }, { status: 400 });
    }
    const reportMiles = Math.round(parsedMiles * 10) / 10;
    const note = String(body.note ?? '').trim().slice(0, 500);
    const [updated] = await sql`
      UPDATE runs
      SET miles = ${reportMiles}, report_note = ${note || null}, reported_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    const chatNote = `🏁 Logged the run — ${reportMiles} mi${note ? `. ${note}` : ''}`;
    await sql`
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES (${conversationId}, ${uid}, ${chatNote})
    `;
    return NextResponse.json({ run: updated });
  }

  if (action === 'cancel') {
    if (!isProposer && run.status === 'proposed') {
      return NextResponse.json({ error: 'Only the proposer can cancel a proposal' }, { status: 403 });
    }
    if (!['proposed', 'confirmed'].includes(run.status as string)) {
      return NextResponse.json({ error: 'Run is not active' }, { status: 400 });
    }
  } else {
    if (isProposer) {
      return NextResponse.json({ error: 'You proposed this run — the other side responds' }, { status: 403 });
    }
    if (run.status !== 'proposed') {
      return NextResponse.json({ error: 'Run already responded to' }, { status: 400 });
    }
  }

  const newStatus = action === 'accept' ? 'confirmed' : action === 'decline' ? 'declined' : 'cancelled';
  const [updated] = await sql`
    UPDATE runs SET status = ${newStatus}, responded_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  const date = String(run.run_date).slice(0, 10);
  const time = run.run_time as string;
  const location = run.location as string;
  const label = formatRunLabel(date, time);

  const note =
    action === 'accept'
      ? `✅ Run booked — ${label} at ${location}. Calendar invites are on the way!`
      : action === 'decline'
        ? `😕 Can't make ${label} — propose another time?`
        : `🚫 Cancelled the run planned for ${label}.`;
  await sql`
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (${conversationId}, ${uid}, ${note})
  `;

  after(async () => {
    const participants = await getConvParticipants(sql, conversationId);
    if (!participants) return;
    const sides = participants.bySide(uid);
    if (!sides) return;

    if (action === 'accept') {
      // Booked: send both parties the calendar invite
      const proposer = run.proposer_id === participants.owner.userId ? participants.owner : participants.runner;
      const accepter = proposer.userId === participants.owner.userId ? participants.runner : participants.owner;
      const ics = buildIcs({
        uid: id,
        date,
        time,
        location,
        summary: `Go Dogs Boston run — ${participants.runner.name} × ${participants.owner.name}`,
        description: `Booked on Go Dogs Boston. Meet at ${location}. Bring water — and maybe a tennis ball.`,
        organizer: { name: proposer.name, email: proposer.email },
        attendee: { name: accepter.name, email: accepter.email },
      });
      await Promise.all([
        notifyRunConfirmed({
          to: participants.owner.email,
          recipientName: participants.owner.name,
          otherName: participants.runner.label,
          runLabel: label,
          location,
          conversationId,
          ics,
        }),
        notifyRunConfirmed({
          to: participants.runner.email,
          recipientName: participants.runner.name,
          otherName: participants.owner.label,
          runLabel: label,
          location,
          conversationId,
          ics,
        }),
      ]);
    } else if (action === 'decline' || (action === 'cancel' && run.status === 'confirmed')) {
      await notifyRunDeclined({
        to: sides.other.email,
        recipientName: sides.other.name,
        otherName: sides.me.label,
        runLabel: label,
        conversationId,
      });
    }
  });

  return NextResponse.json({ run: updated });
}
