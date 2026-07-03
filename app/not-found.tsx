import Link from 'next/link';
import ScruffyDog from '@/components/ScruffyDog';

export const metadata = {
  title: 'Page not found — Go Dogs Boston',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-oat pt-16 pb-28 flex items-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">404</p>
        <h1 className="font-display text-[34px] sm:text-[46px] leading-[1.08] text-soil mb-4">
          Lost the trail
        </h1>
        <p className="text-[16px] sm:text-[18px] leading-relaxed text-soil/70 max-w-md mx-auto mb-8">
          This page doesn&apos;t exist — it might&apos;ve wandered off, or you followed a link
          that&apos;s gone stale.
        </p>

        <ScruffyDog className="w-[140px] sm:w-[170px] mx-auto mb-8" />

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/"
            className="w-full sm:w-auto bg-pine hover:bg-pine-deep text-oat font-bold text-[15px] px-6 py-3 rounded-md transition-colors"
          >
            Back to Go Dogs Boston
          </Link>
          <Link
            href="/browse"
            className="w-full sm:w-auto font-data text-[13px] tracking-[0.1em] text-clay hover:text-clay-deep transition-colors"
          >
            Or browse the pack →
          </Link>
        </div>
      </div>
    </div>
  );
}
