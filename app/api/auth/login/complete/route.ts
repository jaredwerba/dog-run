import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getRpId, getOrigin } from '@/lib/webauthn';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = await getSession();

  const { challenge, pendingUsername } = session;
  if (!challenge || !pendingUsername) {
    return NextResponse.json({ error: 'No pending login' }, { status: 400 });
  }

  const sql = db();
  const users = await sql`
    SELECT u.id, u.role, c.id as cred_id, c.public_key, c.counter
    FROM users u
    JOIN credentials c ON c.user_id = u.id
    WHERE u.username = ${pendingUsername} AND c.id = ${body.id}
  `;

  if (users.length === 0) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }

  const userId = users[0].id as string;
  const role = users[0].role as 'owner' | 'runner';
  const cred_id = users[0].cred_id as string;
  const public_key = users[0].public_key as Buffer;
  const counter = users[0].counter as number;

  const host = req.headers.get('host') ?? 'localhost:3000';

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: getOrigin(host),
      expectedRPID: getRpId(host),
      credential: {
        id: cred_id,
        publicKey: new Uint8Array(public_key),
        counter: Number(counter),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  await sql`
    UPDATE credentials
    SET counter = ${verification.authenticationInfo.newCounter}
    WHERE id = ${cred_id}
  `;

  session.userId = userId;
  session.role = role;
  session.challenge = undefined;
  session.pendingUsername = undefined;
  await session.save();

  return NextResponse.json({ ok: true, role });
}
