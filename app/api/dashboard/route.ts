import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { bostonToday, bostonWeekStart, weeksAtGoal } from '@/lib/dogMiles';

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
  const today = bostonToday();
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
        WHERE c.owner_id = ${uid} AND r.status = 'confirmed' AND r.run_date <= ${today}
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
        WHERE c.runner_id = ${uid} AND r.status = 'confirmed' AND r.run_date <= ${today}
      `;

  const favorites = await sql`SELECT COUNT(*)::int AS n FROM favorites WHERE user_id = ${uid}`;

  // ── Owner extras: kind words about the dog + weekly-goal state/streak ──
  let kindWords: { comment: string; photo_url: string | null; created_at: string; runner_name: string | null }[] = [];
  let goal: number | null = null;
  let milesThisWeek = 0;
  let weeksHitGoal = 0;
  if (isOwner) {
    const words = await sql`
      SELECT dr.comment, dr.photo_url, dr.created_at, rp.runner_name
      FROM dog_reviews dr
      LEFT JOIN runner_profiles rp ON rp.user_id = dr.author_id
      WHERE dr.dog_owner_id = ${uid}
      ORDER BY dr.created_at DESC
      LIMIT 3
    `;
    kindWords = words as typeof kindWords;

    const dog = await sql`SELECT weekly_goal_miles FROM dog_profiles WHERE user_id = ${uid}`;
    goal = (dog[0]?.weekly_goal_miles as number | null) ?? null;
    const wk = await sql`
      SELECT COALESCE(SUM(r.miles), 0)::float AS mi
      FROM runs r JOIN conversations c ON c.id = r.conversation_id
      WHERE c.owner_id = ${uid} AND r.status = 'confirmed' AND r.run_date >= ${weekStart}
    `;
    milesThisWeek = Number(wk[0].mi);
    if (goal) {
      const perWeek = await sql`
        SELECT date_trunc('week', r.run_date)::date::text AS week_start, COALESCE(SUM(r.miles), 0)::float AS mi
        FROM runs r JOIN conversations c ON c.id = r.conversation_id
        WHERE c.owner_id = ${uid} AND r.status = 'confirmed' AND r.run_date <= ${today}
        GROUP BY 1
      `;
      weeksHitGoal = weeksAtGoal(
        perWeek.map((w) => ({ weekStart: w.week_start as string, miles: Number(w.mi) })),
        goal,
        weekStart
      );
    }
  }

  // ── Runner extras: dogs helped + weeks active (gentle, warm, no ranking) ──
  let dogsHelped = 0;
  let weeksActive = 0;
  if (!isOwner) {
    const r = await sql`
      SELECT
        COUNT(DISTINCT c.owner_id)::int AS dogs_helped,
        COUNT(DISTINCT to_char(r.run_date, 'IYYY-IW'))::int AS weeks_active
      FROM runs r JOIN conversations c ON c.id = r.conversation_id
      WHERE c.runner_id = ${uid} AND r.status = 'confirmed' AND r.run_date <= ${today}
    `;
    dogsHelped = r[0].dogs_helped as number;
    weeksActive = r[0].weeks_active as number;
  }

  // Upcoming count for a quick glance
  const upcoming = await sql`
    SELECT COUNT(*)::int AS n
    FROM runs r
    JOIN conversations c ON c.id = r.conversation_id
    WHERE (c.owner_id = ${uid} OR c.runner_id = ${uid})
      AND ((r.status = 'confirmed' AND r.run_date >= ${today}) OR r.status = 'proposed')
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
    // owner-only
    kindWords,
    goal,
    milesThisWeek,
    goalHitThisWeek: goal !== null && milesThisWeek >= goal,
    weeksHitGoal,
    // runner-only
    dogsHelped,
    weeksActive,
  });
}
