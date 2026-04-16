'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Conversation {
  id: string;
  other_display_name: string;
  other_photo_url: string | null;
  other_role: string; // 'runner' | 'owner'
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-14">
      <div className="max-w-sm mx-auto px-4 py-5">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>

        {convos.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-5xl">💬</div>
            <p className="text-gray-500 text-sm">No conversations yet</p>
            <Link href="/browse" className="text-orange-500 font-semibold text-sm">Browse profiles →</Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl divide-y divide-gray-100 overflow-hidden">
            {convos.map((c) => (
              <Link key={c.id} href={`/messages/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-11 h-11 rounded-full bg-orange-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {c.other_photo_url ? (
                    <Image src={c.other_photo_url} alt={c.other_display_name} width={44} height={44} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xl">{c.other_role === 'owner' ? '🐶' : '🏃'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.other_display_name}</p>
                    {c.last_message_at && (
                      <p className="text-xs text-gray-400 shrink-0 ml-2">
                        {new Date(c.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.last_message ?? 'No messages yet'}</p>
                </div>
                {c.unread_count > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    {c.unread_count > 9 ? '9+' : c.unread_count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
