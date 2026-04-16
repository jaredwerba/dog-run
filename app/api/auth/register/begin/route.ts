import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getRpId, getOrigin, RP_NAME } from '@/lib/webauthn';

export async function POST(req: NextRequest) {
  const { username, role } = await req.json();

  if (!username || !role) {
    return NextResponse.json({ error: 'username and role required' }, { status: 400 });
  }

  const host = req.headers.get('host') ?? 'localhost:3000';
  const rpID = getRpId(host);

  const sql = db();

  // Check username not already taken
  const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: username,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  const session = await getSession();
  session.challenge = options.challenge;
  session.pendingUsername = username;
  session.pendingRole = role as 'owner' | 'runner';
  await session.save();

  return NextResponse.json(options);
}
