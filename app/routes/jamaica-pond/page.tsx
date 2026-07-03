import Link from 'next/link';
import RouteMap from '@/components/RouteMap';

export const metadata = {
  title: 'Jamaica Pond — Go Dogs Boston',
  description:
    'The easy-day route. A soft-surface path fully encircling Jamaica Pond in Jamaica Plain — flat, forgiving, and gentle on the joints.',
};

const JAMAICA_POND_PATH: [number, number][] = [
  [42.3207, -71.1229], [42.3207, -71.122], [42.3204, -71.1213],
  [42.3198, -71.1208], [42.3193, -71.1206], [42.3187, -71.1206],
  [42.3181, -71.1207], [42.3175, -71.1211], [42.317, -71.1216],
  [42.3166, -71.1222], [42.3165, -71.1229], [42.3166, -71.1236],
  [42.317, -71.1242], [42.3175, -71.1246], [42.3182, -71.1248],
  [42.3189, -71.1247], [42.3195, -71.1244], [42.3201, -71.1239],
  [42.3207, -71.1229],
];

const JAMAICA_POND_MEETUPS = [
  {
    position: [42.3207, -71.1235] as [number, number],
    name: 'Jamaica Pond Boathouse',
    note: 'North shore — boat rentals, benches, the most obvious "meet me here" spot on the pond.',
  },
  {
    position: [42.3186, -71.1206] as [number, number],
    name: 'Perkins St parking lot',
    note: "East side, easiest if you're driving in.",
  },
  {
    position: [42.3165, -71.1250] as [number, number],
    name: 'Arborway corner',
    note: "Southwest side, closest entrance if you're coming from the Arboretum.",
  },
];

export default function JamaicaPondPage() {
  return (
    <div className="min-h-screen bg-oat pt-16 pb-28">
      <div className="max-w-2xl mx-auto px-6">
        <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">ROUTE GUIDE</p>
        <h1 className="font-display text-[34px] sm:text-[46px] leading-[1.08] text-soil mb-4">
          Jamaica Pond
        </h1>
        <p className="text-[16px] sm:text-[18px] leading-relaxed text-soil/70 max-w-xl mb-8">
          This is the easy-day loop. A soft-surface path traces the whole way
          around Jamaica Pond in Jamaica Plain — no traffic to dodge, no
          pavement pounding your dog's joints, just a calm lap around the
          water.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-linen rounded-lg border border-soil/10 shadow-sm p-4 text-center">
            <p className="font-display text-[22px] text-pine">1.5 MI</p>
            <p className="font-data text-[10px] tracking-[0.14em] text-soil/50 mt-1">DISTANCE</p>
          </div>
          <div className="bg-linen rounded-lg border border-soil/10 shadow-sm p-4 text-center">
            <p className="font-display text-[22px] text-pine">Soft</p>
            <p className="font-data text-[10px] tracking-[0.14em] text-soil/50 mt-1">SURFACE</p>
          </div>
          <div className="bg-linen rounded-lg border border-soil/10 shadow-sm p-4 text-center">
            <p className="font-display text-[16px] sm:text-[18px] text-pine leading-tight">
              Gentle on joints
            </p>
            <p className="font-data text-[10px] tracking-[0.14em] text-soil/50 mt-1">GOOD FOR EASY DAYS</p>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden border border-soil/10 shadow-sm mb-8 h-[320px] sm:h-[400px]">
          <RouteMap path={JAMAICA_POND_PATH} meetups={JAMAICA_POND_MEETUPS} color="#2f4f38" />
        </div>

        <div className="space-y-4 mb-10">
          <p className="text-[16px] leading-relaxed text-soil/70">
            The path fully encircles the pond, so there's no need to plan a
            turnaround — just go until you've made the loop, or double back
            for two. It's flat and forgiving underfoot the whole way, which
            makes it a real favorite for older dogs, younger dogs still
            building up their legs, or anyone coming back from a sore paw and
            just needs easier miles for a while.
          </p>
          <p className="text-[16px] leading-relaxed text-soil/70">
            It's quieter and more residential than the other routes on
            here — fewer crowds, fewer bikes, more of a neighborhood-stroll
            feel than a training-run feel. Good for a recovery day, or for a
            first meetup with a new running partner before you commit to
            anything longer. And if you want to stretch the day out, the
            Arnold Arboretum is right next door if you and your dog still
            have miles left in you.
          </p>
        </div>

        <div className="mb-10">
          <h2 className="font-display text-[22px] sm:text-[26px] text-soil mb-4">
            Preferred meetup spots
          </h2>
          <div className="space-y-3">
            {JAMAICA_POND_MEETUPS.map((spot) => (
              <div key={spot.name} className="bg-linen rounded-lg border border-soil/10 shadow-sm p-5">
                <p className="font-bold text-[16px] text-soil mb-1">{spot.name}</p>
                <p className="text-[14px] text-soil/60 leading-relaxed">{spot.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-pine rounded-lg p-6 sm:p-8 text-center">
          <p className="font-display text-[22px] sm:text-[26px] text-oat mb-2">
            Ready for an easy lap?
          </p>
          <p className="text-[15px] text-oat/80 mb-5 max-w-md mx-auto leading-relaxed">
            Find a runner or a dog who's up for a gentle one around the pond.
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
