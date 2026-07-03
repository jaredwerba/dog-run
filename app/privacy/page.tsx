import Link from 'next/link';

export const metadata = {
  title: 'Privacy — Go Dogs Boston',
  description: 'What Go Dogs Boston collects, why, and what it never does with it.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-oat pt-16 pb-28">
      <div className="max-w-2xl mx-auto px-6">
        <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">YOUR DATA, PLAINLY</p>
        <h1 className="font-display text-[34px] sm:text-[46px] leading-[1.08] text-soil mb-4">
          What we collect, and why
        </h1>

        <div className="bg-linen rounded-lg border border-soil/10 shadow-sm p-6 mb-16">
          <p className="text-[16px] leading-relaxed text-soil/80">
            The short version: we collect what we need to make a good match, and
            nothing more. We never sell your data, and we never share it with
            advertisers or anyone else.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="font-display text-[22px] text-soil mb-4">What we collect</h2>
          <ul className="space-y-3 text-[16px] leading-relaxed text-soil/70">
            <li>
              <strong className="text-soil">Your email address</strong> — used to sign
              in and to send you match, message, and run notifications.
            </li>
            <li>
              <strong className="text-soil">Profile details</strong> — dog name, breed,
              pace, quirks, weekly mileage goal, or runner name, pace, typical
              distance, personal best — whatever you fill in.
            </li>
            <li>
              <strong className="text-soil">Photos</strong> — anything you upload for
              your profile or share in a message, stored on Vercel&apos;s file storage.
            </li>
            <li>
              <strong className="text-soil">Route and schedule preferences</strong> —
              which Boston parks you run, and when you&apos;re free.
            </li>
            <li>
              <strong className="text-soil">Messages</strong> — conversations between
              you and a match, visible only to the two of you.
            </li>
            <li>
              <strong className="text-soil">Reviews and run feedback</strong> — comments
              you leave, or that others leave about you, after a run together.
            </li>
            <li>
              <strong className="text-soil">A passkey credential</strong> — signing in
              uses a passkey (Face ID, Touch ID, or your device&apos;s screen lock)
              instead of a password. We only ever store the public half of that
              credential — never anything that could be used to impersonate you.
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-[22px] text-soil mb-4">What we don&apos;t do</h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            No selling your data. No sharing it with advertisers. No ad tracking, no
            analytics scripts, no third-party trackers of any kind — there simply
            aren&apos;t any running on this site.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-[22px] text-soil mb-4">Who can see what</h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl mb-3">
            <strong className="text-soil">Public</strong> — your browse-card details
            (name, pace, photo, energy level) and any reviews you&apos;ve received are
            visible to other members, including logged-out guests window-shopping the
            site.
          </p>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            <strong className="text-soil">Private</strong> — your email address,
            messages, and exact contact details are never shown to anyone but you.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-[22px] text-soil mb-4">Your control over your data</h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            You can edit your profile any time from{' '}
            <Link href="/profile/setup" className="text-pine font-bold hover:underline">
              your profile page
            </Link>
            . You can also delete your account entirely, whenever you want, right from
            that same page — no email required, no waiting. Deleting your account
            immediately and permanently removes your profile, messages, reviews, run
            history, and any photos you&apos;ve uploaded. It can&apos;t be undone.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="font-display text-[22px] text-soil mb-4">Changes to this policy</h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            If this changes, the update will be posted right here — same as the{' '}
            <Link href="/terms" className="text-pine font-bold hover:underline">
              Terms
            </Link>
            .
          </p>
        </section>

        <p className="font-data text-[12px] tracking-[0.15em] text-soil/40">
          QUESTIONS?{' '}
          <Link href="/contact" className="text-pine hover:underline">
            GET IN TOUCH →
          </Link>
        </p>
      </div>
    </div>
  );
}
