import Link from 'next/link';

export const metadata = {
  title: 'Terms — Go Dogs Boston',
  description: 'The rules for using Go Dogs Boston, in plain language.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-oat pt-16 pb-28">
      <div className="max-w-2xl mx-auto px-6">
        <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">THE FINE PRINT (BUT SHORT)</p>
        <h1 className="font-display text-[34px] sm:text-[46px] leading-[1.08] text-soil mb-4">
          The rules, such as they are
        </h1>
        <p className="text-[16px] sm:text-[18px] leading-relaxed text-soil/70 max-w-xl mb-16">
          Go Dogs Boston is a free, non-profit project — this isn&apos;t a wall of
          legalese meant to protect a business. It&apos;s a short, honest explanation of
          what you&apos;re agreeing to by using it.
        </p>

        <section className="mb-12">
          <h2 className="font-display text-[22px] text-soil mb-3">What this is</h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            Go Dogs Boston matches Boston-area runners with dog owners so dogs get their
            miles and runners get a training partner. It&apos;s free, it&apos;s Boston-only,
            and using it means you agree to these terms.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-[22px] text-soil mb-3">Who can use it</h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            You need to be an adult based in the Boston area, using one account under
            your own name. Be honest in your profile — about your pace, your dog&apos;s
            energy, your availability. Matches only work if the details are real.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-[22px] text-soil mb-3">Meeting people (and their dogs)</h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            Go Dogs Boston introduces you to a stranger and their dog — it can&apos;t
            guarantee anyone&apos;s reliability, temperament, or safety. That&apos;s why
            first runs always happen in public parks, never a private address. Treat
            people and their dogs decently. Anyone who doesn&apos;t can be removed.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-[22px] text-soil mb-3">Reviews are public</h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            Comments left about a runner or a dog after a run are visible to other
            members, including guests browsing without an account. Write them the way
            you&apos;d want one written about you.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-[22px] text-soil mb-3">No guarantees</h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            This is a free service, offered as-is, run by volunteers. It might change,
            and it might someday stop existing. If that happens, it won&apos;t be
            quietly — but there&apos;s no contract promising it&apos;ll always be here.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-[22px] text-soil mb-3">Leaving whenever you want</h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            You can delete your account at any time from your profile page. That
            immediately and permanently removes your profile, messages, reviews, run
            history, and any photos you uploaded. See the{' '}
            <Link href="/privacy" className="text-pine font-bold hover:underline">
              Privacy Policy
            </Link>{' '}
            for the full detail.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="font-display text-[22px] text-soil mb-3">Changes to these terms</h2>
          <p className="text-[16px] leading-relaxed text-soil/70 max-w-xl">
            If these terms change, the update will be posted right here. Continuing to
            use Go Dogs Boston after a change means you accept it.
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
