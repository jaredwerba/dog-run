'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface ConvRow {
  id: string;
  owner_id: string;
  runner_id: string;
  dog_name: string;
  owner_photo: string | null;
  runner_name: string;
  runner_photo: string | null;
}

interface ThreadData {
  conversation: ConvRow;
  messages: Message[];
}

export default function ThreadPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ThreadData | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) { router.push('/messages'); return; }
    const d = await res.json();
    setData(d);
  }, [id, router]);

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then((d) => {
      if (!d.user) { router.push('/login'); return; }
      setMyId(d.user.id);
      load();
    });
  }, [load, router]);

  useEffect(() => {
    pollRef.current = setInterval(load, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages.length]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    await fetch(`/api/conversations/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.trim() }),
    });
    setText('');
    setSending(false);
    await load();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
  }

  if (!data || !myId) return <div className="min-h-screen flex items-center justify-center text-black/48 text-sm">Loading…</div>;

  const conv = data.conversation;
  const isOwner = conv.owner_id === myId;
  const otherName = isOwner ? conv.runner_name : conv.dog_name;
  const otherPhoto = isOwner ? conv.runner_photo : conv.owner_photo;
  const otherEmoji = isOwner ? '🏃' : '🐶';

  return (
    <div className="min-h-screen bg-light-gray flex flex-col pt-12">
      {/* Header */}
      <div className="bg-white border-b border-black/[0.04] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/messages')} className="text-link-blue font-medium text-sm hover:underline pr-1">←</button>
        <div className="w-9 h-9 rounded-full bg-neutral-placeholder overflow-hidden shrink-0 flex items-center justify-center">
          {otherPhoto ? (
            <Image src={otherPhoto} alt={otherName} width={36} height={36} className="object-cover w-full h-full" />
          ) : (
            <span className="text-lg">{otherEmoji}</span>
          )}
        </div>
        <p className="text-sm font-semibold text-near-black truncate flex-1 tracking-[-0.014em]">{otherName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {data.messages.length === 0 && (
          <p className="text-center text-black/48 text-sm py-8 tracking-[-0.014em]">No messages yet. Say hi!</p>
        )}
        {data.messages.map((msg) => {
          const mine = msg.sender_id === myId;
          return (
            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm tracking-[-0.014em] ${
                  mine
                    ? 'bg-apple-blue text-white rounded-br-sm'
                    : 'bg-white text-near-black rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[10px] mt-0.5 ${mine ? 'text-white/50' : 'text-black/30'}`}>
                  {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-black/[0.04] px-4 py-3 flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Message…"
          className="flex-1 border border-black/10 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-apple-blue max-h-28 overflow-y-auto text-near-black placeholder:text-black/30"
        />
        <button
          onClick={() => void send()}
          disabled={!text.trim() || sending}
          className="bg-apple-blue hover:bg-apple-blue-hover text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 disabled:opacity-40 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
