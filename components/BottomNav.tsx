'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

const HIDDEN_ON = ['/', '/login', '/register'];

export default function BottomNav() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const [unread, setUnread] = useState(0);
  const [pendingRuns, setPendingRuns] = useState(0);

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then((d) => setSignedIn(Boolean(d.user)));
  }, [pathname]);

  useEffect(() => {
    if (!signedIn) return;
    const check = () =>
      fetch('/api/unread').then((r) => r.json()).then((d) => {
        setUnread(d.count ?? 0);
        setPendingRuns(d.pendingRuns ?? 0);
      });
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [signedIn]);

  if (!signedIn || HIDDEN_ON.includes(pathname)) return null;

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-linen border-t border-soil/10 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-sm mx-auto grid grid-cols-3 items-end px-6 py-2">
        {/* Calendar — left */}
        <Link
          href="/runs"
          className={`relative flex flex-col items-center gap-0.5 py-1 transition-colors ${
            isActive('/runs') ? 'text-pine' : 'text-soil/45 hover:text-soil/70'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="17" rx="3" />
            <path d="M3 9h18M8 2v4M16 2v4" />
          </svg>
          <span className="text-[10px] font-medium">Runs</span>
          {pendingRuns > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 15 }}
              className="absolute top-0 right-[22%] bg-clay text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
            >
              {pendingRuns > 9 ? '9+' : pendingRuns}
            </motion.span>
          )}
        </Link>

        {/* Home / dashboard — centered, dog house */}
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-0.5 -mt-4"
        >
          <span
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-colors ${
              isActive('/dashboard') ? 'bg-pine' : 'bg-bark'
            }`}
          >
            {/* dog house icon */}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f6eedd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11 L12 4 L21 11" />
              <path d="M5 10 V20 H19 V10" />
              <path d="M9.5 20 V14 a2.5 2.5 0 0 1 5 0 V20" />
            </svg>
          </span>
          <span className={`text-[10px] font-medium ${isActive('/dashboard') ? 'text-pine' : 'text-soil/45'}`}>Home</span>
        </Link>

        {/* Messages — right */}
        <Link
          href="/messages"
          className={`relative flex flex-col items-center gap-0.5 py-1 transition-colors ${
            isActive('/messages') ? 'text-pine' : 'text-soil/45 hover:text-soil/70'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-[10px] font-medium">Messages</span>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 15 }}
              className="absolute top-0 left-[22%] bg-clay text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </Link>
      </div>
    </nav>
  );
}
