import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { bostonWeekStart } from '@/lib/dogMiles';

/* First of the current month / year, Boston time, as YYYY-MM-DD */
function bostonMonthStart(): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  return `${today.slice(0, 7)}-01`;
}
function bostonYearStart(): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  return `${today.slice(0, 4)}-01-01`;
}

// GET /api/dashboard — weekly/monthly/yearly run totals + favorites count
export async function GET() {
  const session = await getSession();
  if (!session.userId || !session.role) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const sql = db();
  const uid = session.userId;
  const weekStart = bostonWeekStart();
  const monthStart = bostonMonthStart();
  const yearStart = bostonYearStart();
  const isOwner = session.role === 'owner';

  const totals = isOwner
    ? await sql`
        SELECT
          COUNT(*) FILTER (WHERE r.run_date >= ${weekStart})::int AS runs_week,
          COUNT(*) FILTER (WHERE r.run_date >= ${monthStart})::int AS runs_month,
          COUNT(*) FILTER (WHERE r.run_date >= ${yearStart})::int AS runs_year,
          COALESCE(SUM(r.miles) FILTER (WHERE r.run_date >= ${weekStart}), 0)::float AS miles_week,
          COALESCE(SUM(r.miles) FILTER (WHERE r.run_date >= ${monthStart}), 0)::float AS miles_month,
          COALESCE(SUM(r.miles) FILTER (WHERE r.run_date >= ${yearStart}), 0)::float AS miles_year,
          COUNT(DISTINCT c.id)::int AS buddies
        FROM runs r
        JOIN conversations c ON c.id = r.conversation_id
        WHERE c.owner_id = ${uid} AND r.status = 'confirmed' AND r.run_date <= now()::date
      `
    : await sql`
        SELECT
          COUNT(*) FILTER (WHERE r.run_date >= ${weekStart})::int AS runs_week,
          COUNT(*) FILTER (WHERE r.run_date >= ${monthStart})::int AS runs_month,
          COUNT(*) FILTER (WHERE r.run_date >= ${yearStart})::int AS runs_year,
          COALESCE(SUM(r.miles) FILTER (WHERE r.run_date >= ${weekStart}), 0)::float AS miles_week,
          COALESCE(SUM(r.miles) FILTER (WHERE r.run_date >= ${monthStart}), 0)::float AS miles_month,
          COALESCE(SUM(r.miles) FILTER (WHERE r.run_date >= ${yearStart}), 0)::float AS miles_year,
          COUNT(DISTINCT c.id)::int AS buddies
        FROM runs r
        JOIN conversations c ON c.id = r.conversation_id
        WHERE c.runner_id = ${uid} AND r.status = 'confirmed' AND r.run_date <= now()::date
      `;

  const favorites = await sql`SELECT COUNT(*)::int AS n FROM favorites WHERE user_id = ${uid}`;

  // Upcoming count for a quick glance
  const upcoming = await sql`
    SELECT COUNT(*)::int AS n
    FROM runs r
    JOIN conversations c ON c.id = r.conversation_id
    WHERE (c.owner_id = ${uid} OR c.runner_id = ${uid})
      AND ((r.status = 'confirmed' AND r.run_date >= now()::date) OR r.status = 'proposed')
  `;

  const t = totals[0];
  return NextResponse.json({
    role: session.role,
    runsWeek: t.runs_week,
    runsMonth: t.runs_month,
    runsYear: t.runs_year,
    milesWeek: t.miles_week,
    milesMonth: t.miles_month,
    milesYear: t.miles_year,
    buddies: t.buddies,
    favorites: favorites[0].n,
    upcoming: upcoming[0].n,
  });
}
