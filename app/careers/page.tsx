import Link from 'next/link';
import ScruffyDog from '@/components/ScruffyDog';

export const metadata = {
  title: 'Get Involved — Go Dogs Boston',
  description:
    'Go Dogs Boston is a free, volunteer-run project. No jobs, no salaries — just Boston runners and dog owners helping the pack grow.',
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-oat pt-16 pb-28">
      <div className="max-w-2xl mx-auto px-6">
        <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">GET INVOLVED</p>
        <h1 className="font-display text-[34px] sm:text-[46px] leading-[1.08] text-soil mb-4">
          There&apos;s no careers page here
        </h1>
        <p className="text-[16px] sm:text-[18px] leading-relaxed text-soil/70 max-w-xl">
          Go Dogs Boston isn&apos;t a company. There&apos;s no office, no payroll, no
          quarterly targets — just a free project for Boston runners and dogs who want
          more miles together. So instead of job listings, here&apos;s how people
          actually help it grow.
        </p>

        <ScruffyDog className="w-[140px] sm:w-[170px] mx-auto my-10" />

        <div className="space-y-4">
          <div className="bg-linen rounded-lg border border-soil/10 shadow-sm p-6">
            <h2 className="font-display text-[20px] text-soil mb-2">Trailhead Ambassador</h2>
            <p className="text-[15px] leading-relaxed text-soil/70">
              You&apos;re already at Castle Island, the Esplanade, the Common, or Jamaica
              Pond most weeks. Be the friendly face who shows up at a known time and
              helps a new runner or a nervous first-timer&apos;s dog feel at home. That&apos;s
              it. That&apos;s the whole job.
            </p>
          </div>

          <div className="bg-linen rounded-lg border border-soil/10 shadow-sm p-6">
            <h2 className="font-display text-[20px] text-soil mb-2">Neighborhood Champion</h2>
            <p className="text-[15px] leading-relaxed text-soil/70">
              Mention Go Dogs Boston to your building, your dog park regulars, your
              running club. Most people find out about things like this because someone
              they trust told them. Be that someone.
            </p>
          </div>

          <div className="bg-linen rounded-lg border border-soil/10 shadow-sm p-6">
            <h2 className="font-display text-[20px] text-soil mb-2">Route Scout</h2>
            <p className="text-[15px] leading-relaxed text-soil/70">
              Run or walk a Boston loop we don&apos;t have yet and send in notes — path
              condition, good spots to meet up, shade, water fountains. Solid notes turn
              into a real route page other people can use.
            </p>
          </div>
        </div>

        <p className="text-[16px] sm:text-[18px] leading-relaxed text-soil/70 max-w-xl mt-10">
          None of this is paid, and there&apos;s no formal application. People do it
          because they love dogs and love running in this city. If any of it sounds like
          you, just{' '}
          <Link href="/contact" className="text-pine font-bold hover:underline">
            reach out
          </Link>{' '}
          and tell us what you&apos;re thinking.
        </p>

        <Link
          href="/contact"
          className="inline-block bg-pine hover:bg-pine-deep text-oat font-bold text-[15px] px-6 py-3 rounded-md transition-colors mt-6"
        >
          Say hello
        </Link>
      </div>
    </div>
  );
}
