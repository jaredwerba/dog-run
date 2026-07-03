'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserInfo {
  role: 'owner' | 'runner';
  displayName: string;
  photoUrl?: string | null;
}

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.user) { setUser(null); return; }
        const pr = await fetch('/api/profile').then((r) => r.json());
        const profile = pr.profile;
        const displayName = d.user.role === 'owner'
          ? (profile?.owner_name ?? d.user.id.slice(0, 8))
          : (profile?.runner_name ?? d.user.id.slice(0, 8));
        setUser({ role: d.user.role, displayName, photoUrl: profile?.photo_url });
      });
  }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="glass-nav fixed top-0 inset-x-0 z-50 px-4 h-12 flex items-center justify-between">
      <Link href={user ? '/browse' : '/'} className="text-[17px] font-semibold tracking-tight text-white">
        Go Dogs Boston <span className="brand-ball-spin">🎾</span>
      </Link>

      {user ? (
        <div className="flex items-center gap-3">
          {/* Profile pill */}
          <Link
            href="/profile/setup"
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 rounded-full px-3 py-1 transition-colors"
          >
            <span className="text-xs">{user.role === 'owner' ? '🐶' : '🏃'}</span>
            <span className="text-xs font-medium text-white/90 max-w-[80px] truncate">
              {user.displayName}
            </span>
          </Link>

          <button
            onClick={logout}
            className="text-xs font-medium text-white/48 hover:text-white/80 transition-colors"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link
            href="/browse"
            className="text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Browse
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-clay hover:bg-clay-deep text-white text-xs font-medium px-4 py-1.5 rounded-full transition-colors"
          >
            Join
          </Link>
        </div>
      )}
    </nav>
  );
}
