import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getRpId } from '@/lib/webauthn';

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username) {
    return NextResponse.json({ error: 'username required' }, { status: 400 });
  }

  const sql = db();
  const users = await sql`SELECT id FROM users WHERE username = ${username}`;
  if (users.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userId = users[0].id;
  const creds = await sql`SELECT id, public_key, counter FROM credentials WHERE user_id = ${userId}`;

  if (creds.length === 0) {
    return NextResponse.json({ error: 'No credentials registered' }, { status: 404 });
  }

  const host = req.headers.get('host') ?? 'localhost:3000';

  const options = await generateAuthenticationOptions({
    rpID: getRpId(host),
    userVerification: 'preferred',
    allowCredentials: creds.map((c) => ({ id: c.id as string })),
  });

  const session = await getSession();
  session.challenge = options.challenge;
  session.pendingUsername = username;
  await session.save();

  return NextResponse.json(options);
}
