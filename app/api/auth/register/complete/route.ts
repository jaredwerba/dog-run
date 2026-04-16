import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getRpId, getOrigin } from '@/lib/webauthn';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = await getSession();

  const { challenge, pendingUsername, pendingRole } = session;
  if (!challenge || !pendingUsername || !pendingRole) {
    return NextResponse.json({ error: 'No pending registration' }, { status: 400 });
  }

  const host = req.headers.get('host') ?? 'localhost:3000';

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: getOrigin(host),
      expectedRPID: getRpId(host),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;
  const sql = db();

  const [user] = await sql`
    INSERT INTO users (username, role)
    VALUES (${pendingUsername}, ${pendingRole})
    RETURNING id
  `;

  await sql`
    INSERT INTO credentials (id, user_id, public_key, counter)
    VALUES (
      ${credential.id},
      ${user.id},
      ${Buffer.from(credential.publicKey)},
      ${credential.counter}
    )
  `;

  session.userId = user.id as string;
  session.role = pendingRole;
  session.challenge = undefined;
  session.pendingUsername = undefined;
  session.pendingRole = undefined;
  await session.save();

  return NextResponse.json({ ok: true, role: pendingRole });
}
