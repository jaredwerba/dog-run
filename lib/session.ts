import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId?: string;
  role?: 'owner' | 'runner';
  challenge?: string;
  pendingUsername?: string;
  pendingRole?: 'owner' | 'runner';
}

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'dog-run-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
