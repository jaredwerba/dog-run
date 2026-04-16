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
    <nav className="glass-nav fixed top-0 inset-x-0 z-50 px-4 h-12 flex items-center justify-between">
      <Link href={user ? '/browse' : '/'} className="text-[17px] font-semibold tracking-tight text-white">
        DogRun
      </Link>

      {user ? (
        <div className="flex items-center gap-3">
          {/* Messages */}
          <Link href="/messages" className="relative p-1 text-white/80 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

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
            href="/login"
            className="text-sm font-medium text-bright-blue hover:underline transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-medium px-4 py-1.5 rounded-full transition-colors"
          >
            Join
          </Link>
        </div>
      )}
    </nav>
  );
}
