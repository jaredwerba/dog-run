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
