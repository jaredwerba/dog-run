import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getConvParticipants } from '@/lib/participants';
import { buildIcs } from '@/lib/ics';

// GET /api/runs/[id]/ics — download the calendar invite for a confirmed run
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

  const rows = await sql`
    SELECT r.*, c.owner_id, c.runner_id
    FROM runs r
    JOIN conversations c ON c.id = r.conversation_id
    WHERE r.id = ${id} AND (c.owner_id = ${uid} OR c.runner_id = ${uid})
  `;
  if (rows.length === 0 || rows[0].status !== 'confirmed') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const run = rows[0];

  const participants = await getConvParticipants(sql, run.conversation_id as string);
  if (!participants) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const proposer = run.proposer_id === participants.owner.userId ? participants.owner : participants.runner;
  const other = proposer.userId === participants.owner.userId ? participants.runner : participants.owner;

  const ics = buildIcs({
    uid: id,
    date: String(run.run_date).slice(0, 10),
    time: run.run_time as string,
    location: run.location as string,
    summary: `Go Dogs Boston run — ${participants.runner.name} × ${participants.owner.name}`,
    description: `Booked on Go Dogs Boston. Meet at ${run.location}. Bring water — and maybe a tennis ball.`,
    organizer: { name: proposer.name, email: proposer.email },
    attendee: { name: other.name, email: other.email },
  });

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8; method=PUBLISH',
      'Content-Disposition': 'attachment; filename="go-dogs-boston-run.ics"',
    },
  });
}
