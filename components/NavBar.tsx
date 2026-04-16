'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NavBar() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => setRole(d.user?.role ?? null));
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
      <Link href="/" className="text-lg font-bold tracking-tight text-orange-500">
        🐾 DogRun
      </Link>
      <div className="flex items-center gap-3">
        {role ? (
          <>
            <Link
              href="/browse"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/profile/setup"
              className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              My Profile
            </Link>
            <button
              onClick={logout}
              className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/register"
            className="bg-orange-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-orange-600 transition-colors"
          >
            Get started
          </Link>
        )}
      </div>
    </nav>
  );
}
