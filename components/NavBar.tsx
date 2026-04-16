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
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.user) { setUser(null); return; }
        // Fetch profile to get display name
        const pr = await fetch('/api/profile').then((r) => r.json());
        const profile = pr.profile;
        const displayName = d.user.role === 'owner'
          ? (profile?.owner_name ?? d.user.id.slice(0, 8))
          : (profile?.runner_name ?? d.user.id.slice(0, 8));
        setUser({ role: d.user.role, displayName, photoUrl: profile?.photo_url });
      });
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    const check = () =>
      fetch('/api/unread').then((r) => r.json()).then((d) => setUnread(d.count ?? 0));
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [user]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
      <Link href={user ? '/browse' : '/'} className="text-lg font-bold tracking-tight text-orange-500">
        🐾 DogRun
      </Link>

      {user ? (
        <div className="flex items-center gap-3">
          {/* Messages */}
          <Link href="/messages" className="relative p-1">
            <span className="text-xl">💬</span>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          {/* Profile pill */}
          <Link
            href="/profile/setup"
            className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-full px-3 py-1"
          >
            <span className="text-sm">{user.role === 'owner' ? '🐶' : '🏃'}</span>
            <span className="text-sm font-semibold text-gray-800 max-w-[80px] truncate">
              {user.displayName}
            </span>
          </Link>

          <button
            onClick={logout}
            className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            Out
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-orange-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-orange-600 transition-colors"
          >
            Join
          </Link>
        </div>
      )}
    </nav>
  );
}
