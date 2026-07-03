import Link from 'next/link';
import JoggerDoodle from '@/components/JoggerDoodle';

export const metadata = {
  title: 'About — Go Dogs Boston',
  description:
    'Go Dogs Boston is a free, community-run project matching Boston runners with high-energy dogs and their owners. No cost, no catch, no plans to change that.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-oat pt-16 pb-28">
      <div className="max-w-2xl mx-auto px-6">
        {/* ── What it is ─────────────────────────────────── */}
        <section className="mb-16">
          <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">ABOUT GO DOGS BOSTON</p>
          <h1 className="font-display text-[34px] sm:text-[46px] leading-[1.08] text-soil mb-4">
            Two problems, one leash
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed text-soil/70 max-w-xl mb-4">
            Go Dogs Boston 🎾 is a free service that pairs runners who want a
            training partner with dog owners whose dogs need more miles than
            one person can give them. That&apos;s it. That&apos;s the whole idea.
          </p>
          <p className="text-[16px] sm:text-[18px] leading-relaxed text-soil/70 max-w-xl">
            You sign up, you get matched with someone nearby, you meet at a
            park, you run. No app subscriptions, no algorithms deciding your
            fate — just two Boston problems solving each other.
          </p>
        </section>

        {/* ── Why it exists ──────────────────────────────── */}
        <section className="mb-16">
          <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">WHY THIS EXISTS</p>
          <h2 className="font-display text-[28px] sm:text-[36px] leading-[1.1] text-soil mb-4">
            High-energy dogs need more than a walk around the block
          </h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl mb-4">
            Labs, shepherds, border collies, pit mixes — the dogs bred to work
            all day — genuinely need 60-plus minutes of real cardio, most
            days, to be their best selves. A lot of owners love their dogs to
            death and still can&apos;t swing that on top of a job, a commute, and
            an actual life.
          </p>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl mb-4">
            Meanwhile, plenty of runners want company and a reason to show up
            at 6am besides willpower — but not the vet bills, the lease
            clause, or the years-long commitment of owning a dog outright.
          </p>
          <div className="bg-linen rounded-lg border border-soil/10 shadow-sm p-6">
            <p className="text-[16px] leading-relaxed text-soil/80">
              Everybody wins. The dog gets its miles. The runner gets a
              training partner who never bails, never checks a watch, and is
              always, always down to go. The owner gets their evening back.
            </p>
          </div>
        </section>

        <div className="flex justify-center mb-16">
          <JoggerDoodle className="w-[170px] sm:w-[210px] mx-auto" />
        </div>

        {/* ── Free, forever ──────────────────────────────── */}
        <section className="mb-16">
          <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">THE MONEY PART</p>
          <h2 className="font-display text-[28px] sm:text-[36px] leading-[1.1] text-soil mb-4">
            Free. No catch, no upsell.
          </h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl mb-4">
            This isn&apos;t a startup and it isn&apos;t trying to become one. There&apos;s
            no premium tier, no ads, no plan hiding behind this one to
            eventually charge you for. It exists because Boston has a lot of
            underexercised dogs and a lot of runners who want company, and
            connecting them shouldn&apos;t cost anybody anything.
          </p>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            If that ever changes, it won&apos;t be quietly. For now: free to join,
            free to use, always.
          </p>
        </section>

        {/* ── Boston only, public parks ──────────────────── */}
        <section className="mb-16">
          <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">HOW WE KEEP IT SAFE</p>
          <h2 className="font-display text-[28px] sm:text-[36px] leading-[1.1] text-soil mb-4">
            Boston only. Public parks only.
          </h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl mb-4">
            This is a Boston project, on purpose — small enough that
            &quot;nearby&quot; actually means nearby, and small enough to do right.
          </p>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            First runs always happen somewhere public — Castle Island, the
            Esplanade, Boston Common, Jamaica Pond. Never a private address.
            You get to know each other, and the dog, out in the open before
            anything else, for everyone&apos;s comfort and safety.
          </p>
        </section>

        {/* ── Who built it ───────────────────────────────── */}
        <section className="mb-16">
          <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">WHO&apos;S BEHIND IT</p>
          <h2 className="font-display text-[28px] sm:text-[36px] leading-[1.1] text-soil mb-4">
            Just neighbors, really
          </h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            Go Dogs Boston is an independent, community-run project for
            Boston&apos;s dog owners and runners — built by people who live here,
            run here, and know a few too many dogs staring out the window at
            5pm wondering when someone&apos;s coming. No company behind it, no
            funding round, no big team. Just a small effort to make the
            running and the dog-having easier for everyone in it.
          </p>
        </section>

        {/* ── CTA ─────────────────────────────────────────── */}
        <section className="text-center pt-4">
          <h2 className="font-display text-[26px] sm:text-[32px] leading-[1.1] text-soil mb-6">
            Come run with the pack
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-block bg-pine hover:bg-pine-deep text-oat font-bold text-[15px] px-6 py-3 rounded-md transition-colors"
            >
              Create a runner profile
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto inline-block bg-clay hover:bg-clay-deep text-oat font-bold text-[15px] px-6 py-3 rounded-md transition-colors"
            >
              Create an owner profile
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
