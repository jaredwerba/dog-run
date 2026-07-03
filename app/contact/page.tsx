import Link from 'next/link';
import ScruffyDog from '@/components/ScruffyDog';

export const metadata = {
  title: 'Contact — Go Dogs Boston',
  description:
    'Say hi to Go Dogs Boston. Report a bug, suggest a route, flag a safety concern, or just tell us how your run went.',
};

const REASONS = [
  {
    title: 'Something’s broken',
    desc: 'A bug, a dead link, a page that won’t load — tell us what happened and where.',
  },
  {
    title: 'A route worth adding',
    desc: 'Know a great Boston loop for a runner and a dog? Send the name and we’ll take a look.',
  },
  {
    title: 'A safety concern',
    desc: 'Something about a match felt off. Don’t sit on it — email us and we’ll look into it right away.',
  },
  {
    title: 'Just saying hi',
    desc: 'Tell us how a run went, send a good dog photo, whatever. We like hearing from the pack.',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-oat pt-16 pb-28">
      <div className="max-w-2xl mx-auto px-6">
        <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">GET IN TOUCH</p>
        <h1 className="font-display text-[34px] sm:text-[46px] leading-[1.08] text-soil mb-4">
          Say hi
        </h1>
        <p className="text-[16px] sm:text-[18px] leading-relaxed text-soil/70 max-w-xl mb-8">
          Go Dogs Boston 🎾 is a small, volunteer-run project — no bots, no ticket
          numbers, no support queue. Send an email and a real person will read it
          and write back.
        </p>

        <a
          href="mailto:woof@jwerba.com"
          className="inline-block bg-clay hover:bg-clay-deep text-oat font-bold text-[17px] px-7 py-3.5 rounded-md transition-colors mb-3"
        >
          woof@jwerba.com
        </a>
        <p className="text-[14px] text-soil/50 mb-12">
          Click to open your email app, or just copy the address.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {REASONS.map((reason) => (
            <div key={reason.title} className="bg-linen rounded-lg border border-soil/10 shadow-sm p-6">
              <h2 className="font-bold text-[16px] text-soil mb-1.5">{reason.title}</h2>
              <p className="text-[14px] text-soil/60 leading-relaxed">{reason.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center text-center">
          <ScruffyDog className="w-[140px] sm:w-[170px] mx-auto mb-4" />
          <p className="text-[15px] text-soil/60 max-w-sm">
            However you reach out, we’ll get back to you. Thanks for being part
            of the pack.
          </p>
        </div>

        <p className="font-data text-[12px] tracking-[0.15em] text-center text-soil/40 mt-12">
          <Link href="/" className="hover:text-soil/70 transition-colors">
            ← BACK TO GO DOGS BOSTON 🎾
          </Link>
        </p>
      </div>
    </div>
  );
}
