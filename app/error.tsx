'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';
import ScruffyDog from '@/components/ScruffyDog';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-oat pt-16 pb-28 flex items-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <p className="font-data text-[12px] tracking-[0.24em] text-clay mb-3">SOMETHING BROKE</p>
        <h1 className="font-display text-[34px] sm:text-[46px] leading-[1.08] text-soil mb-4">
          Lost the trail for a second
        </h1>
        <p className="text-[16px] sm:text-[18px] leading-relaxed text-soil/70 max-w-md mx-auto mb-8">
          Something broke on our end — give it another go.
        </p>

        <ScruffyDog className="w-[140px] sm:w-[170px] mx-auto mb-8" />

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {/* Re-fetches and re-renders the failed segment; prefer this over reset() */}
          <button
            onClick={() => unstable_retry()}
            className="w-full sm:w-auto bg-pine hover:bg-pine-deep text-oat font-bold text-[15px] px-6 py-3 rounded-md transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto font-data text-[13px] tracking-[0.1em] text-clay hover:text-clay-deep transition-colors"
          >
            Back to home →
          </Link>
        </div>
      </div>
    </div>
  );
}
