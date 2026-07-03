import Link from 'next/link';
import RouteMap from '@/components/RouteMap';

export const metadata = {
  title: 'Boston Common & Public Garden — Go Dogs Boston',
  description:
    'A short, central loop around Boston Common and the Public Garden — good for a quick lunch-break run or a low-key first meetup.',
};

// Real perimeter (OpenStreetMap park boundaries for Boston Common + the adjoining
// Public Garden), traced as one continuous figure-eight loop crossing Charles Street.
const BOSTON_COMMON_PATH: [number, number][] = [
  [42.3551, -71.0635], // Park St corner (Common, E)
  [42.3535, -71.0643],
  [42.3533, -71.0644],
  [42.3531, -71.0645],
  [42.353, -71.0645],
  [42.3527, -71.0646], // Boylston & Tremont (Common, S)
  [42.3529, -71.0674], // approaching Charles St
  [42.3528, -71.0678], // cross into the Public Garden
  [42.3527, -71.0678],
  [42.3524, -71.0692],
  [42.3522, -71.0704], // Boylston & Arlington (Garden, S)
  [42.3522, -71.0707], // Arlington & Boylston (Garden, SW corner)
  [42.3528, -71.071],
  [42.3537, -71.0714],
  [42.3548, -71.072],
  [42.3554, -71.0722], // Arlington & Beacon (Garden, NW corner)
  [42.3556, -71.0714],
  [42.356, -71.0696],
  [42.3552, -71.0691], // cross back over Charles St into the Common
  [42.3559, -71.0691],
  [42.3565, -71.0677],
  [42.3565, -71.0675],
  [42.3567, -71.0666], // Beacon St (Common, N)
  [42.3551, -71.0635], // back to start
];

const BOSTON_COMMON_MEETUPS = [
  {
    position: [42.3559, -71.0656] as [number, number],
    name: 'Frog Pond',
    note: 'Central, easy to find, plenty of open grass for a warm-up.',
  },
  {
    position: [42.3564, -71.0624] as [number, number],
    name: 'Park Street T entrance',
    note: 'Right on the T — the easiest meetup for anyone coming in without a car.',
  },
  {
    position: [42.3536, -71.0703] as [number, number],
    name: 'Public Garden pond (Swan Boats)',
    note: 'Quieter corner, good for a calmer first meet-and-greet.',
  },
];

export default function BostonCommonRoutePage() {
  return (
    <div className="min-h-screen bg-oat pt-16 pb-28">
      <div className="max-w-2xl mx-auto px-6">
        <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">
          ROUTE GUIDE
        </p>
        <h1 className="font-display text-[34px] sm:text-[46px] leading-[1.08] text-soil mb-4">
          Boston Common &amp; Public Garden
        </h1>
        <p className="text-[16px] sm:text-[18px] leading-relaxed text-soil/70 max-w-xl mb-8">
          This is the downtown option — shortest of the four routes, and the
          easiest to get to from pretty much anywhere in the city.
        </p>

        <div className="flex flex-wrap gap-6 font-data text-[13px] text-soil/70 mb-8">
          <span><span className="text-soil font-bold">1.5 MI</span> loop</span>
          <span><span className="text-soil font-bold">Mixed surface</span></span>
          <span className="text-clay">Quick downtown lunch-break loops</span>
        </div>

        <RouteMap path={BOSTON_COMMON_PATH} meetups={BOSTON_COMMON_MEETUPS} color="#2f4f38" />

        <div className="mt-10 space-y-5 text-[15px] leading-relaxed text-soil/80">
          <p>
            The loop traces the perimeter of the Common and cuts through the
            Public Garden next door — paved paths, a little bit of lawn, a
            couple of small hills near the State House. Nothing technical,
            nothing that needs trail shoes. It&apos;s built for a fast lap on
            a lunch break, not a long training day.
          </p>
          <p>
            Because it&apos;s smack in the middle of downtown, it&apos;s also
            the most T-accessible route on the board — Park Street, Boylston,
            and Arlington stations all sit right on the edge of it. That
            makes it a solid pick for a first-time meetup: lots of people
            around, well-lit, easy for anyone to find without a car.
          </p>
          <p>
            The one thing to plan around: the edges get busy with tourists
            and Duck Boats, especially near Beacon and Charles. It&apos;s a
            better fit for an easy conversational pace than a tempo run — you&apos;ll
            be weaving around strollers and sightseers more than you would
            out at Castle Island or the Charles.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-[22px] text-soil mb-4">
            Preferred meetup spots
          </h2>
          <div className="space-y-4">
            {BOSTON_COMMON_MEETUPS.map((spot) => (
              <div
                key={spot.name}
                className="bg-linen rounded-lg border border-soil/10 shadow-sm p-6"
              >
                <p className="font-bold text-soil mb-1">{spot.name}</p>
                <p className="text-[14px] text-soil/70 leading-relaxed">{spot.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Link
            href="/browse"
            className="inline-block bg-pine hover:bg-pine-deep text-oat font-bold text-[15px] px-6 py-3 rounded-md transition-colors"
          >
            Find a run at Boston Common
          </Link>
          <Link
            href="/register"
            className="font-data text-[13px] tracking-[0.1em] text-clay hover:text-clay-deep transition-colors"
          >
            Or sign up free →
          </Link>
        </div>
      </div>
    </div>
  );
}
