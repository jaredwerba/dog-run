import Link from 'next/link';
import RouteMap from '@/components/RouteMap';

export const metadata = {
  title: 'Castle Island Loop — Go Dogs Boston',
  description:
    'A 2.2 mile paved loop around Castle Island and the HarborWalk in South Boston — ocean air, Fort Independence, and dog-friendly the whole way.',
};

const CASTLE_ISLAND_PATH: [number, number][] = [
  [42.33504, -71.01232], [42.33512, -71.01225], [42.33522, -71.01217],
  [42.33535, -71.01207], [42.33547, -71.01198], [42.33576, -71.01181],
  [42.33584, -71.01177], [42.33590, -71.01172], [42.33597, -71.01166],
  [42.33605, -71.01157], [42.33612, -71.01148], [42.33629, -71.01118],
  [42.33635, -71.01106], [42.33671, -71.01024], [42.33676, -71.01013],
  [42.33675, -71.01007], [42.33675, -71.01001], [42.33674, -71.00995],
  [42.33675, -71.00988], [42.33677, -71.00980], [42.33680, -71.00971],
  [42.33683, -71.00965], [42.33685, -71.00962], [42.33690, -71.00957],
  [42.33694, -71.00955], [42.33698, -71.00953], [42.33702, -71.00952],
  [42.33707, -71.00951], [42.33712, -71.00950], [42.33715, -71.00950],
  [42.33717, -71.00950], [42.33721, -71.00950], [42.33724, -71.00949],
  [42.33727, -71.00950], [42.33731, -71.00950], [42.33734, -71.00950],
  [42.33735, -71.00951], [42.33767, -71.00957], [42.33806, -71.00967],
  [42.33824, -71.00971], [42.33829, -71.00972], [42.33836, -71.00973],
  [42.33844, -71.00974], [42.33847, -71.00974], [42.33849, -71.00975],
  [42.33853, -71.00977], [42.33898, -71.01007], [42.33904, -71.01012],
  [42.33910, -71.01017], [42.33914, -71.01023], [42.33917, -71.01029],
  [42.33918, -71.01037], [42.33919, -71.01047], [42.33921, -71.01106],
  [42.33922, -71.01111], [42.33921, -71.01116], [42.33920, -71.01132],
  [42.33919, -71.01141], [42.33917, -71.01150], [42.33915, -71.01166],
  [42.33901, -71.01244], [42.33898, -71.01254], [42.33896, -71.01263],
  [42.33872, -71.01328], [42.33870, -71.01327], [42.33859, -71.01321],
  [42.33828, -71.01304], [42.33827, -71.01304], [42.33778, -71.01277],
  [42.33775, -71.01275], [42.33772, -71.01270], [42.33766, -71.01263],
  [42.33757, -71.01252], [42.33750, -71.01243], [42.33735, -71.01226],
  [42.33726, -71.01215], [42.33720, -71.01208], [42.33717, -71.01205],
  [42.33713, -71.01203], [42.33700, -71.01197], [42.33691, -71.01193],
  [42.33685, -71.01190], [42.33668, -71.01188], [42.33655, -71.01187],
  [42.33646, -71.01187], [42.33639, -71.01188], [42.33625, -71.01192],
  [42.33612, -71.01198], [42.33584, -71.01211], [42.33557, -71.01226],
  [42.33552, -71.01228], [42.33547, -71.01230], [42.33543, -71.01232],
  [42.33539, -71.01232], [42.33531, -71.01234], [42.33520, -71.01234],
  [42.33504, -71.01232],
];

const CASTLE_ISLAND_MEETUPS = [
  {
    position: [42.3351, -71.0123] as [number, number],
    name: "Sullivan's at Castle Island",
    note: 'Classic Boston clam shack right by the loop entrance — easiest landmark to say "meet me at" in Southie.',
  },
  {
    position: [42.339, -71.0101] as [number, number],
    name: 'Fort Independence gate',
    note: 'Halfway around the loop, on the harbor side — shady, benches nearby.',
  },
];

export default function CastleIslandRoutePage() {
  return (
    <div className="min-h-screen bg-oat pt-16 pb-28">
      <div className="max-w-2xl mx-auto px-6">
        <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">
          ROUTE · SOUTH BOSTON
        </p>
        <h1 className="font-display text-[34px] sm:text-[46px] leading-[1.08] text-soil mb-4">
          Castle Island Loop
        </h1>
        <p className="text-[16px] sm:text-[18px] leading-relaxed text-soil/70 max-w-xl mb-6">
          A flat, paved loop around the water with a fort at the halfway point.
          One of the most popular meetup spots on Go Dogs Boston, for good reason.
        </p>

        <div className="flex gap-6 mb-6">
          <div>
            <p className="font-data text-[12px] tracking-[0.16em] text-soil/50">DISTANCE</p>
            <p className="font-display text-[20px] text-soil">2.2 MI</p>
          </div>
          <div>
            <p className="font-data text-[12px] tracking-[0.16em] text-soil/50">SURFACE</p>
            <p className="font-display text-[20px] text-soil">Paved</p>
          </div>
          <div>
            <p className="font-data text-[12px] tracking-[0.16em] text-soil/50">VIBE</p>
            <p className="font-display text-[20px] text-soil">Ocean breeze, fort views</p>
          </div>
        </div>

        <RouteMap path={CASTLE_ISLAND_PATH} meetups={CASTLE_ISLAND_MEETUPS} color="#2f4f38" />

        <div className="mt-8 space-y-4 text-[16px] leading-relaxed text-soil/70">
          <p>
            This loop hugs the HarborWalk the whole way around, so you get open water on one
            side pretty much the entire run. It&apos;s flat, it&apos;s paved, and it&apos;s wide
            enough for two runners and two dogs to pass each other without anyone doing the
            awkward leash shuffle.
          </p>
          <p>
            Fort Independence sits right on the far side of the loop — a real 19th-century
            fort you run straight past, not around. It&apos;s the natural turnaround point if
            you&apos;re splitting the loop with someone, and a good spot to let dogs sniff
            around while you catch your breath.
          </p>
          <p>
            Castle Island is a South Boston institution, so expect company — other runners,
            walkers, plenty of dogs. The paved surface makes it easy on paws and fine for
            strollers too. One thing to know: it gets windy off the water, especially in
            fall and winter, so bring a layer even on a mild day.
          </p>
        </div>

        <h2 className="font-display text-[22px] text-soil mt-10 mb-4">Preferred meetup spots</h2>
        <ul className="space-y-4 mb-10">
          {CASTLE_ISLAND_MEETUPS.map((spot) => (
            <li key={spot.name} className="bg-linen rounded-lg border border-soil/10 shadow-sm p-6">
              <p className="font-display text-[18px] text-soil mb-1">{spot.name}</p>
              <p className="text-[15px] leading-relaxed text-soil/70">{spot.note}</p>
            </li>
          ))}
        </ul>

        <Link
          href="/browse"
          className="inline-block bg-pine hover:bg-pine-deep text-oat font-bold text-[15px] px-6 py-3 rounded-md transition-colors"
        >
          Find a running partner for this route
        </Link>
      </div>
    </div>
  );
}
