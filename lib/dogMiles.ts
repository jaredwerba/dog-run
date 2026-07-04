/* Mileage ledger helpers — breed exercise guidance, route distances, week math */

/* Rough weekly running-mileage guidance by breed (owner can always adjust) */
export const BREED_WEEKLY_MILES: Record<string, number> = {
  'Border Collie': 35,
  'Australian Shepherd': 35,
  'Siberian Husky': 35,
  'German Shepherd': 30,
  'Doberman': 30,
  'Labrador': 25,
  'Golden Retriever': 25,
  'Boxer': 25,
  'Rottweiler': 20,
  'Poodle': 20,
  'Beagle': 20,
  'Greyhound': 15,
  'Mixed breed': 20,
  'Shiba Inu': 15,
  'Dachshund': 10,
  'Bulldog': 8,
  'French Bulldog': 8,
  'Shih Tzu': 8,
  'Yorkshire Terrier': 8,
  'Cavalier King Charles': 10,
  'Other': 20,
};

export function suggestedWeeklyMiles(breed: string): number {
  return BREED_WEEKLY_MILES[breed] ?? 20;
}

/* Typical distance for a run at each route (used as the proposal default) */
export const LOCATION_MILES: Record<string, number> = {
  'Castle Island, South Boston': 2.2,
  'Charles River Esplanade': 3,
  'Boston Common & Public Garden': 1.5,
  'Jamaica Pond': 1.5,
};

export function defaultMilesFor(location: string): number {
  return LOCATION_MILES[location] ?? 3;
}

export const MILES_OPTIONS = [1.5, 2, 2.2, 3, 4, 5, 6, 8];

/* Today's date in Boston as YYYY-MM-DD */
export function bostonToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

/* Monday of the current week in Boston, as YYYY-MM-DD */
export function bostonWeekStart(): string {
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now);
  const dow = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(now);
  const idx = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(dow);
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - Math.max(idx, 0));
  return d.toISOString().slice(0, 10);
}

/* Shift a YYYY-MM-DD date by whole days (noon-anchored to dodge DST edges) */
function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/*
 * Consecutive most-recent weeks a dog met its goal, ending at the current week.
 * The in-progress current week counts if already met, but not meeting it yet does
 * NOT break the streak (there's still time). A week with no runs is a miss.
 *
 * Note: judged against the *current* goal — historical goals aren't stored, so
 * raising the goal can retroactively shrink the streak. Acceptable for a gentle,
 * secondary number; an immutable streak would need a weekly_goal_history table.
 */
export function weeksAtGoal(
  weekMiles: { weekStart: string; miles: number }[],
  goal: number | null,
  currentWeekStart: string
): number {
  if (!goal || goal <= 0) return 0;
  const byWeek = new Map(weekMiles.map((w) => [w.weekStart, w.miles]));
  let streak = 0;
  if ((byWeek.get(currentWeekStart) ?? 0) >= goal) streak++;
  let cursor = addDays(currentWeekStart, -7);
  while ((byWeek.get(cursor) ?? 0) >= goal) {
    streak++;
    cursor = addDays(cursor, -7);
  }
  return streak;
}

/* Whether a mid-week nudge is warranted: goal set, close but not there yet */
export function shouldNudge(args: { goal: number | null; milesThisWeek: number }): boolean {
  if (!args.goal || args.goal <= 0) return false;
  const remaining = args.goal - args.milesThisWeek;
  return remaining > 0 && remaining <= args.goal * 0.4;
}
