import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getConvParticipants } from '@/lib/participants';
import { notifyRunReminder, notifyRunFollowup } from '@/lib/email';
import { formatRunLabel } from '@/lib/ics';
import { bostonToday } from '@/lib/dogMiles';

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

  return NextResponse.json({ ok: true, today, reminders, followups });
}
