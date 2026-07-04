import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getConvParticipants } from '@/lib/participants';
import { notifyRunReminder, notifyRunFollowup, notifyMidweekNudge } from '@/lib/email';
import { formatRunLabel } from '@/lib/ics';
import { bostonToday, bostonWeekStart, shouldNudge } from '@/lib/dogMiles';

export const maxDuration = 60;

// GET /api/cron/daily — Vercel Cron, 10:00 UTC (6am Boston)
// 1) Morning-of reminders for today's confirmed runs
// 2) "How'd it go? Book it again" follow-ups for runs that have passed
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = db();
  const today = bostonToday();
  let reminders = 0;
  let followups = 0;
  let nudges = 0;

  // ── Reminders: confirmed runs happening today ──────────
  const dueToday = await sql`
    SELECT * FROM runs
    WHERE status = 'confirmed' AND run_date = ${today} AND reminder_sent_at IS NULL
  `;
  for (const run of dueToday) {
    const conversationId = run.conversation_id as string;
    const participants = await getConvParticipants(sql, conversationId);
    if (!participants) continue;
    const label = formatRunLabel(String(run.run_date).slice(0, 10), run.run_time as string);
    const location = run.location as string;
    await Promise.all([
      notifyRunReminder({
        to: participants.owner.email,
        recipientName: participants.owner.name,
        otherName: participants.runner.label,
        runLabel: label,
        location,
        conversationId,
      }),
      notifyRunReminder({
        to: participants.runner.email,
        recipientName: participants.runner.name,
        otherName: participants.owner.label,
        runLabel: label,
        location,
        conversationId,
      }),
    ]);
    await sql`UPDATE runs SET reminder_sent_at = now() WHERE id = ${run.id}`;
    reminders++;
  }

  // ── Follow-ups: confirmed runs in the last week that have passed ──
  const finished = await sql`
    SELECT * FROM runs
    WHERE status = 'confirmed'
      AND run_date < ${today}
      AND run_date >= (${today}::date - INTERVAL '7 days')
      AND followup_sent_at IS NULL
  `;
  for (const run of finished) {
    const conversationId = run.conversation_id as string;
    const participants = await getConvParticipants(sql, conversationId);
    if (!participants) continue;
    const label = formatRunLabel(String(run.run_date).slice(0, 10), run.run_time as string);
    await Promise.all([
      notifyRunFollowup({
        to: participants.owner.email,
        recipientName: participants.owner.name,
        otherName: participants.runner.label,
        runLabel: label,
        conversationId,
      }),
      notifyRunFollowup({
        to: participants.runner.email,
        recipientName: participants.runner.name,
        otherName: participants.owner.label,
        runLabel: label,
        conversationId,
      }),
    ]);
    await sql`UPDATE runs SET followup_sent_at = now() WHERE id = ${run.id}`;
    followups++;
  }

  // ── Mid-week nudge: Fridays only, for dogs close to their weekly goal ──
  // One gentle nudge per dog per week, only when a weekend run would realistically
  // close the gap (within ~40% of goal) — never for dogs miles behind or already done.
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(new Date());
  if (weekday === 'Fri') {
    const weekStart = bostonWeekStart();
    const dogs = await sql`
      SELECT dp.user_id, dp.dog_name, dp.owner_name, dp.weekly_goal_miles, u.username AS owner_email,
        (
          SELECT COALESCE(SUM(r.miles), 0)::float FROM runs r
          JOIN conversations c ON c.id = r.conversation_id
          WHERE c.owner_id = dp.user_id AND r.status = 'confirmed' AND r.run_date >= ${weekStart}
        ) AS miles_this_week
      FROM dog_profiles dp
      JOIN users u ON u.id = dp.user_id
      WHERE dp.weekly_goal_miles IS NOT NULL
        AND (dp.nudge_sent_week IS NULL OR dp.nudge_sent_week <> ${weekStart})
    `;
    for (const dog of dogs) {
      const goal = dog.weekly_goal_miles as number;
      const milesThisWeek = Number(dog.miles_this_week);
      if (!shouldNudge({ goal, milesThisWeek })) continue;
      const email = dog.owner_email as string;
      if (email?.includes('@')) {
        await notifyMidweekNudge({
          to: email,
          ownerName: (dog.owner_name as string) ?? 'there',
          dogName: (dog.dog_name as string) ?? 'your dog',
          remainingMiles: Math.round((goal - milesThisWeek) * 10) / 10,
          goalMiles: goal,
        });
      }
      await sql`UPDATE dog_profiles SET nudge_sent_week = ${weekStart} WHERE user_id = ${dog.user_id}`;
      nudges++;
    }
  }

  return NextResponse.json({ ok: true, today, reminders, followups, nudges });
}
