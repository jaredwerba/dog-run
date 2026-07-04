import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { db, type SqlFn } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getConvParticipants, type ConvParticipants } from '@/lib/participants';
import { notifyRunConfirmed, notifyRunDeclined, notifyRunProposed, notifyDogLoved, notifyRunnerReviewed, notifyGoalHit } from '@/lib/email';
import { buildIcs, formatRunLabel } from '@/lib/ics';
import { bostonToday, bostonWeekStart } from '@/lib/dogMiles';

/*
 * Detect the moment a dog crosses its weekly mileage goal and celebrate it once
 * per Boston week — for the owner AND every runner who logged miles this week.
 * Returns whether the goal was (already or just) hit this week, so the logging
 * runner can see the in-app celebration immediately.
 */
async function maybeCelebrateGoalHit(
  sql: SqlFn,
  args: {
    ownerId: string;
    conversationId: string;
    runDate: string;
    today: string;
    dogName: string;
    goal: number | null;
    alreadyHitWeek: string | null;
    oldMiles: number;
    newMiles: number;
  }
): Promise<boolean> {
  if (!args.goal) return false; // owner opted out of a weekly target
  const weekStart = bostonWeekStart();
  // Only a current-week run can complete the current week
  if (args.runDate < weekStart || args.runDate > args.today) return false;
  if (args.alreadyHitWeek === weekStart) return true; // already celebrated this week

  const sumRows = await sql`
    SELECT COALESCE(SUM(r.miles), 0)::float AS mi
    FROM runs r
    JOIN conversations c ON c.id = r.conversation_id
    WHERE c.owner_id = ${args.ownerId} AND r.status = 'confirmed' AND r.run_date >= ${weekStart}
  `;
  const afterSum = Number(sumRows[0].mi);
  const beforeSum = afterSum - (args.newMiles - args.oldMiles);
  const crossed = beforeSum < args.goal && afterSum >= args.goal;
  if (!crossed) return false;

  // Memoize so the celebration fires once per week across both miles-write paths
  await sql`UPDATE dog_profiles SET goal_hit_week = ${weekStart} WHERE user_id = ${args.ownerId}`;

  const goal = args.goal;
  const dogName = args.dogName;
  after(async () => {
    const participants = await getConvParticipants(sql, args.conversationId);
    if (!participants) return;
    // One row per runner who helped this week (owner↔runner is one conversation)
    const contributors = await sql`
      SELECT c.id AS conversation_id, ru.username AS email, rp.runner_name
      FROM runs r
      JOIN conversations c ON c.id = r.conversation_id
      JOIN users ru ON ru.id = c.runner_id
      LEFT JOIN runner_profiles rp ON rp.user_id = c.runner_id
      WHERE c.owner_id = ${args.ownerId} AND r.status = 'confirmed' AND r.run_date >= ${weekStart}
      GROUP BY c.id, ru.username, rp.runner_name
    `;
    await Promise.all([
      notifyGoalHit({
        to: participants.owner.email,
        recipientName: participants.owner.name,
        dogName,
        goalMiles: goal,
        side: 'owner',
        conversationId: args.conversationId,
      }),
      ...contributors.map((c) =>
        notifyGoalHit({
          to: c.email as string,
          recipientName: (c.runner_name as string) ?? 'there',
          dogName,
          goalMiles: goal,
          side: 'runner',
          conversationId: c.conversation_id as string,
        })
      ),
    ]);
  });
  return true;
}

/* Same weekday/time/place, first occurrence strictly after today */
function nextWeekDate(runDate: string, today: string): string {
  const d = new Date(`${runDate}T12:00:00Z`);
  while (d.toISOString().slice(0, 10) <= today) d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

async function emailBothConfirmed(
  participants: ConvParticipants,
  args: { runId: string; date: string; time: string; location: string; conversationId: string }
) {
  const label = formatRunLabel(args.date, args.time);
  const ics = buildIcs({
    uid: args.runId,
    date: args.date,
    time: args.time,
    location: args.location,
    summary: `Go Dogs Boston run — ${participants.runner.name} × ${participants.owner.name}`,
    description: `Booked on Go Dogs Boston. Meet at ${args.location}. Bring water — and maybe a tennis ball.`,
    organizer: { name: participants.owner.name, email: participants.owner.email },
    attendee: { name: participants.runner.name, email: participants.runner.email },
  });
  await Promise.all([
    notifyRunConfirmed({
      to: participants.owner.email,
      recipientName: participants.owner.name,
      otherName: participants.runner.label,
      runLabel: label,
      location: args.location,
      conversationId: args.conversationId,
      ics,
    }),
    notifyRunConfirmed({
      to: participants.runner.email,
      recipientName: participants.runner.name,
      otherName: participants.owner.label,
      runLabel: label,
      location: args.location,
      conversationId: args.conversationId,
      ics,
    }),
  ]);
}

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

  const today = bostonToday();
  const runDate = String(run.run_date).slice(0, 10);

  // ── Two-sided post-run feedback: comment + optional miles/review/rebook ──
  if (action === 'feedback') {
    if (run.status !== 'confirmed') {
      return NextResponse.json({ error: 'Only confirmed runs can get feedback' }, { status: 400 });
    }
    if (runDate > today) {
      return NextResponse.json({ error: "That run hasn't happened yet" }, { status: 400 });
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

    // First submission? (gate one-time "your dog was loved" notifications)
    const priorFeedback = await sql`
      SELECT 1 FROM run_feedback WHERE run_id = ${id} AND author_id = ${uid}
    `;
    const isFirstFeedback = priorFeedback.length === 0;

    // Dog context — for the goal celebration and the owner-facing dog name
    const dogRows = await sql`
      SELECT dog_name, weekly_goal_miles, goal_hit_week
      FROM dog_profiles WHERE user_id = ${run.owner_id}
    `;
    const dogName = (dogRows[0]?.dog_name as string) ?? 'their dog';
    const weeklyGoal = (dogRows[0]?.weekly_goal_miles as number | null) ?? null;
    const goalHitWeek = dogRows[0]?.goal_hit_week ? String(dogRows[0].goal_hit_week).slice(0, 10) : null;

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
    let goalHit = false;
    if (milesActual !== null) {
      await sql`UPDATE runs SET miles = ${milesActual}, reported_at = now() WHERE id = ${id}`;
      goalHit = await maybeCelebrateGoalHit(sql, {
        ownerId: run.owner_id as string,
        conversationId,
        runDate,
        today,
        dogName,
        goal: weeklyGoal,
        alreadyHitWeek: goalHitWeek,
        oldMiles: Number(run.miles) || 0,
        newMiles: milesActual,
      });
    }

    // Owner reviews the runner; runner reviews the dog. Comments only, no scores.
    if (shareAsReview && role === 'owner') {
      const priorReview = await sql`
        SELECT 1 FROM runner_reviews WHERE runner_id = ${run.runner_id} AND author_id = ${uid}
      `;
      await sql`
        INSERT INTO runner_reviews (runner_id, author_id, comment, photo_url)
        VALUES (${run.runner_id}, ${uid}, ${comment}, ${photoUrl})
        ON CONFLICT (runner_id, author_id) DO UPDATE SET
          comment = EXCLUDED.comment, photo_url = EXCLUDED.photo_url, created_at = now()
      `;
      // Tell the runner they were praised — but only the first time (not on edits)
      if (priorReview.length === 0) {
        after(async () => {
          const participants = await getConvParticipants(sql, conversationId);
          if (!participants) return;
          await notifyRunnerReviewed({
            to: participants.runner.email,
            runnerId: run.runner_id as string,
            runnerName: participants.runner.name,
            ownerName: participants.owner.name,
            dogName: participants.owner.dogName ?? dogName,
            comment,
            photoUrl,
          });
        });
      }
    } else if (shareAsReview && role === 'runner') {
      await sql`
        INSERT INTO dog_reviews (dog_owner_id, author_id, comment, photo_url)
        VALUES (${run.owner_id}, ${uid}, ${comment}, ${photoUrl})
        ON CONFLICT (dog_owner_id, author_id) DO UPDATE SET
          comment = EXCLUDED.comment, photo_url = EXCLUDED.photo_url, created_at = now()
      `;
    }

    // A runner's words/photo about the dog — deliver that payoff to the owner.
    // Fires on any first feedback with content, whether or not it's shared publicly.
    if (role === 'runner' && isFirstFeedback && (comment.length > 0 || photoUrl)) {
      after(async () => {
        const participants = await getConvParticipants(sql, conversationId);
        if (!participants) return;
        await notifyDogLoved({
          to: participants.owner.email,
          ownerName: participants.owner.name,
          runnerName: participants.runner.name,
          dogName: participants.owner.dogName ?? dogName,
          comment,
          photoUrl,
          conversationId,
        });
      });
    }

    const chatNote = `🏁 ${comment ? `"${comment}"` : 'Logged the run'}${milesActual !== null ? ` — ${milesActual} mi` : ''}${wantsRebook ? ' · up for the same time next week 🔁' : ''}`;
    await sql`
      INSERT INTO messages (conversation_id, sender_id, content, photo_url)
      VALUES (${conversationId}, ${uid}, ${chatNote}, ${photoUrl})
    `;

    // ── Rebook, server-side ────────────────────────────────
    // If the other side already said "run again" for this run, both have
    // consented — book it directly, no extra tap. Otherwise file a proposal.
    let rebooked: 'confirmed' | 'proposed' | null = null;
    if (wantsRebook) {
      const nextDate = nextWeekDate(runDate, today);
      const otherWants = await sql`
        SELECT 1 FROM run_feedback
        WHERE run_id = ${id} AND author_id != ${uid} AND wants_rebook = true
      `;
      // Supersede any open proposal in this conversation either way
      await sql`
        UPDATE runs SET status = 'cancelled', responded_at = now()
        WHERE conversation_id = ${conversationId} AND status = 'proposed'
      `;
      const mutual = otherWants.length > 0;
      const [nextRun] = await sql`
        INSERT INTO runs (conversation_id, proposer_id, run_date, run_time, location, miles, status, responded_at)
        VALUES (${conversationId}, ${uid}, ${nextDate}, ${run.run_time}, ${run.location},
                ${Number(run.miles) || 3}, ${mutual ? 'confirmed' : 'proposed'}, ${mutual ? new Date().toISOString() : null})
        RETURNING id
      `;
      rebooked = mutual ? 'confirmed' : 'proposed';
      const nextLabel = formatRunLabel(nextDate, run.run_time as string);
      await sql`
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES (${conversationId}, ${uid}, ${
          mutual
            ? `✅ You both wanted it — next run booked: ${nextLabel} at ${run.location}. Invites on the way!`
            : `📅 Proposed the same run again — ${nextLabel} at ${run.location}`
        })
      `;

      after(async () => {
        const participants = await getConvParticipants(sql, conversationId);
        if (!participants) return;
        const sides = participants.bySide(uid);
        if (!sides) return;
        if (mutual) {
          await emailBothConfirmed(participants, {
            runId: nextRun.id as string,
            date: nextDate,
            time: run.run_time as string,
            location: run.location as string,
            conversationId,
          });
        } else {
          await notifyRunProposed({
            to: sides.other.email,
            recipientName: sides.other.name,
            proposerName: sides.me.label,
            runLabel: nextLabel,
            location: run.location as string,
            conversationId,
          });
        }
      });
    }

    return NextResponse.json({
      ok: true,
      wantsRebook,
      rebooked,
      goalHit,
      helped: role === 'runner' ? { dogName } : null,
    });
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

    // Same weekly-goal celebration as the feedback path (this is the legacy log route)
    const dogRows = await sql`
      SELECT dog_name, weekly_goal_miles, goal_hit_week
      FROM dog_profiles WHERE user_id = ${run.owner_id}
    `;
    const goalHit = await maybeCelebrateGoalHit(sql, {
      ownerId: run.owner_id as string,
      conversationId,
      runDate,
      today,
      dogName: (dogRows[0]?.dog_name as string) ?? 'their dog',
      goal: (dogRows[0]?.weekly_goal_miles as number | null) ?? null,
      alreadyHitWeek: dogRows[0]?.goal_hit_week ? String(dogRows[0].goal_hit_week).slice(0, 10) : null,
      oldMiles: Number(run.miles) || 0,
      newMiles: reportMiles,
    });
    return NextResponse.json({ run: updated, goalHit });
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
    if (action === 'accept' && runDate < today) {
      return NextResponse.json({ error: 'That proposal is for a date that already passed — ask for a new time' }, { status: 400 });
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
