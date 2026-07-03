import Link from 'next/link';
import RouteMap from '@/components/RouteMap';

export const metadata = {
  title: 'Charles River Esplanade — Go Dogs Boston',
  description:
    'The long-run route. Flat, paved, and shaded riverside path along the Charles River Esplanade from the Museum of Science down to the BU Bridge.',
};

// Real path geometry (OpenStreetMap "Dr. Paul Dudley White Path" / Charles River
// Bike Path, Boston-side bank only) from Museum of Science down to the BU Bridge.
const CHARLES_RIVER_PATH: [number, number][] = [
  [42.3675, -71.0721], // Museum of Science (north end)
  [42.368, -71.0741], // Charlesbank / dam crossing
  [42.3617, -71.0728], // Longfellow Bridge / Community Boating
  [42.3562, -71.0741], // Hatch Shell
  [42.3532, -71.0846], // Mass Ave / Harvard Bridge
  [42.3522, -71.0888], // continuing west past the bridge
  [42.3519, -71.1093], // long straight stretch toward BU
  [42.3521, -71.1105], // BU Bridge (south turnaround)
];

const CHARLES_RIVER_MEETUPS = [
  {
    position: [42.3562, -71.0741] as [number, number],
    name: 'Hatch Shell',
    note: 'The classic meetup — wide open lawn by the river, easy to spot a leash from a distance.',
  },
  {
    position: [42.3617, -71.0725] as [number, number],
    name: 'Community Boating dock',
    note: "North end, right by the Longfellow Bridge — good if you're coming from Beacon Hill or the West End.",
  },
  {
    position: [42.3532, -71.0846] as [number, number],
    name: 'Mass Ave (Harvard) Bridge',
    note: 'Roughly the halfway point for an out-and-back — popular turnaround spot.',
  },
];

export default function CharlesRiverPage() {
  return (
    <div className="min-h-screen bg-oat pt-16 pb-28">
      <div className="max-w-2xl mx-auto px-6">
        <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">ROUTE GUIDE</p>
        <h1 className="font-display text-[34px] sm:text-[46px] leading-[1.08] text-soil mb-4">
          Charles River Esplanade
        </h1>
        <p className="text-[16px] sm:text-[18px] leading-relaxed text-soil/70 max-w-xl mb-8">
          This is the go-to for longer runs. Flat and paved the whole way, from
          the Museum of Science down past the Hatch Shell to the BU Bridge —
          no roots, no gravel, no surprises underfoot.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-linen rounded-lg border border-soil/10 shadow-sm p-4 text-center">
            <p className="font-display text-[22px] text-pine">3–17 MI</p>
            <p className="font-data text-[10px] tracking-[0.14em] text-soil/50 mt-1">DISTANCE</p>
          </div>
          <div className="bg-linen rounded-lg border border-soil/10 shadow-sm p-4 text-center">
            <p className="font-display text-[22px] text-pine">Paved</p>
            <p className="font-data text-[10px] tracking-[0.14em] text-soil/50 mt-1">SURFACE</p>
          </div>
          <div className="bg-linen rounded-lg border border-soil/10 shadow-sm p-4 text-center">
            <p className="font-display text-[16px] sm:text-[18px] text-pine leading-tight">
              Fountains &amp; shade
            </p>
            <p className="font-data text-[10px] tracking-[0.14em] text-soil/50 mt-1">THE WHOLE WAY</p>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden border border-soil/10 shadow-sm mb-8 h-[320px] sm:h-[400px]">
          <RouteMap path={CHARLES_RIVER_PATH} meetups={CHARLES_RIVER_MEETUPS} color="#2f4f38" />
        </div>

        <div className="space-y-4 mb-10">
          <p className="text-[16px] leading-relaxed text-soil/70">
            Because it's one long riverside path rather than a loop, the
            distance is really up to you and your running partner. Turn
            around at the Hatch Shell for a short one, push on to the Harvard
            Bridge for a middle distance, or go all the way to the BU Bridge
            and back if the dog's got the legs for it. Trees line most of the
            path, so even a July afternoon run stays bearable in the shade,
            and there are good water fountains along the way in-season —
            worth timing a stop for on the hot days.
          </p>
          <p className="text-[16px] leading-relaxed text-soil/70">
            It's also one of the most popular running paths in the city,
            which means gorgeous river views and good energy — but also real
            crowds on nice-weather weekends. Give other dogs and leashes
            extra room near the bridges, where the path narrows and foot
            traffic bottlenecks.
          </p>
        </div>

        <div className="mb-10">
          <h2 className="font-display text-[22px] sm:text-[26px] text-soil mb-4">
            Preferred meetup spots
          </h2>
          <div className="space-y-3">
            {CHARLES_RIVER_MEETUPS.map((spot) => (
              <div key={spot.name} className="bg-linen rounded-lg border border-soil/10 shadow-sm p-5">
                <p className="font-bold text-[16px] text-soil mb-1">{spot.name}</p>
                <p className="text-[14px] text-soil/60 leading-relaxed">{spot.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-pine rounded-lg p-6 sm:p-8 text-center">
          <p className="font-display text-[22px] sm:text-[26px] text-oat mb-2">
            Ready for the long haul?
          </p>
          <p className="text-[15px] text-oat/80 mb-5 max-w-md mx-auto leading-relaxed">
            Find a runner or a dog built for the miles this route offers.
          </p>
          <Link
            href="/browse"
            className="inline-block bg-clay hover:bg-clay-deep text-oat font-bold text-[15px] px-6 py-3 rounded-md transition-colors mr-3"
          >
            Browse the pack
          </Link>
          <Link
            href="/register"
            className="inline-block bg-oat hover:bg-linen text-pine font-bold text-[15px] px-6 py-3 rounded-md transition-colors"
          >
            Join Go Dogs Boston
          </Link>
        </div>
      </div>
    </div>
  );
}
