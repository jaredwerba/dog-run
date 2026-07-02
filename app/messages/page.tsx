'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import JoggerDoodle from '@/components/JoggerDoodle';
import { spring } from '@/components/ux';

interface Conversation {
  id: string;
  other_display_name: string;
  other_photo_url: string | null;
  other_role: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) { router.push('/login'); return; }
        return fetch('/api/conversations').then((r) => r.json());
      })
      .then((d) => {
        if (d?.conversations) setConvos(d.conversations);
        setLoading(false);
      });
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-soil/50 text-sm">Loading…</div>;

  return (
    <div className="min-h-screen bg-oat pt-14">
      <div className="max-w-sm mx-auto px-4 py-5">
        <h1 className="font-display text-[24px] text-soil mb-4">Messages</h1>

        {convos.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <JoggerDoodle className="w-72 mx-auto" />
            <p className="font-display text-[20px] text-soil/70">All quiet on the trail</p>
            <p className="text-soil/50 text-sm">No conversations yet</p>
            <Link href="/browse" className="text-pine font-bold text-sm hover:underline">Browse profiles →</Link>
          </div>
        ) : (
          <div className="bg-linen rounded-xl border border-soil/10 shadow-sm overflow-hidden">
            {convos.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: Math.min(i * 0.05, 0.35) }}
              >
              <Link
                href={`/messages/${c.id}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-oat active:bg-oat transition-colors ${i > 0 ? 'border-t border-soil/10' : ''}`}
              >
                <div className="w-11 h-11 rounded-full bg-moss/30 overflow-hidden shrink-0 flex items-center justify-center">
                  {c.other_photo_url ? (
                    <Image src={c.other_photo_url} alt={c.other_display_name} width={44} height={44} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xl">{c.other_role === 'owner' ? '🐶' : '🏃'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-soil truncate">{c.other_display_name}</p>
                    {c.last_message_at && (
                      <p className="font-data text-[10px] text-soil/45 shrink-0 ml-2">
                        {new Date(c.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-soil/50 truncate">{c.last_message ?? 'No messages yet'}</p>
                </div>
                {c.unread_count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.25 }}
                    className="bg-clay text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0"
                  >
                    {c.unread_count > 9 ? '9+' : c.unread_count}
                  </motion.span>
                )}
              </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
