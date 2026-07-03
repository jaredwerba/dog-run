/*
 * End-to-end booking-system test against a running dev server.
 *
 *   npm run e2e            (dev server must be up on :3001)
 *
 * Creates two throwaway users (usernames without "@" so every email send is
 * skipped), forges their session cookies with SESSION_SECRET, walks the whole
 * flow — browse → conversation → propose → accept → feedback → rebook →
 * reviews → dashboard → favorites → ics — then deletes the users (cascades).
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { sealData } from 'iron-session';

const BASE = process.env.E2E_BASE ?? 'http://localhost:3001';
const sql = neon(process.env.DATABASE_URL!);

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function cookieFor(userId: string, role: 'owner' | 'runner'): Promise<string> {
  const sealed = await sealData({ userId, role }, {
    password: process.env.SESSION_SECRET as string,
    ttl: 60 * 60 * 24 * 7,
  });
  return `dog-run-session=${sealed}`;
}

async function api(
  cookie: string,
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<{ status: number; json: any; text: string }> {
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Cookie: cookie,
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status, json, text };
}

function isoShift(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function cleanup() {
  await sql`DELETE FROM users WHERE username LIKE 'e2e-%'`;
}

async function main() {
  await cleanup();

  // ── Fixtures ────────────────────────────────────────────
  const [owner] = await sql`
    INSERT INTO users (username, role) VALUES ('e2e-owner-test', 'owner') RETURNING id
  `;
  const [runner] = await sql`
    INSERT INTO users (username, role) VALUES ('e2e-runner-test', 'runner') RETURNING id
  `;
  const ownerId = owner.id as string;
  const runnerId = runner.id as string;

  await sql`
    INSERT INTO dog_profiles (user_id, dog_name, breed, pace, owner_name, owner_contact, schedule, weekly_goal_miles)
    VALUES (${ownerId}, 'E2E-Rex', 'Border Collie', 'moderate', 'E2E-Olive', '', ${'{"sat":["07:00"],"sun":["07:00"]}'}::jsonb, 30)
  `;
  await sql`
    INSERT INTO runner_profiles (user_id, runner_name, pace, typical_distance, contact, availability, schedule)
    VALUES (${runnerId}, 'E2E-Pat', 'moderate', '3–5 mi', '', '', ${'{"sat":["07:00"],"mon":["06:00"]}'}::jsonb)
  `;

  const ownerCookie = await cookieFor(ownerId, 'owner');
  const runnerCookie = await cookieFor(runnerId, 'runner');

  // ── T1: authed browse (exercises schedule-derived availability) ──
  console.log('T1 · authed browse');
  const browse = await api(ownerCookie, '/api/browse');
  check('owner browse returns 200', browse.status === 200, `got ${browse.status}: ${browse.text.slice(0, 120)}`);
  const pat = browse.json?.profiles?.find((p: any) => p.runner_name === 'E2E-Pat');
  check('runner visible with derived availability', Boolean(pat?.availability?.length), JSON.stringify(pat?.availability));
  check('availability is compact (<40 chars)', (pat?.availability ?? '').length < 40, `"${pat?.availability}"`);
  check('overlap counts shared Sat 7am', pat?.overlap === 1, `overlap=${pat?.overlap}`);

  check('runner card carries available days', Array.isArray(pat?.days) && pat.days.includes('sat'), JSON.stringify(pat?.days));
  check('runner card carries runs_completed', typeof pat?.runs_completed === 'number', JSON.stringify(pat?.runs_completed));

  const browseRunner = await api(runnerCookie, '/api/browse');
  const rex = browseRunner.json?.profiles?.find((p: any) => p.dog_name === 'E2E-Rex');
  check('dog visible to runner with ledger fields', rex?.weekly_goal_miles === 30, JSON.stringify(rex?.weekly_goal_miles));

  // ── T2: conversation ────────────────────────────────────
  console.log('T2 · conversation');
  const conv = await api(ownerCookie, '/api/conversations', {
    method: 'POST',
    body: { toUserId: runnerId, message: 'e2e hello' },
  });
  const convId = conv.json?.conversationId;
  check('conversation created', Boolean(convId), conv.text.slice(0, 120));

  // ── T3: proposal validation ─────────────────────────────
  console.log('T3 · proposal validation');
  const pastProp = await api(runnerCookie, '/api/runs', {
    method: 'POST',
    body: { conversationId: convId, date: isoShift(-3), time: '07:00' },
  });
  check('past-dated proposal rejected', pastProp.status === 400, `got ${pastProp.status}`);
  const farProp = await api(runnerCookie, '/api/runs', {
    method: 'POST',
    body: { conversationId: convId, date: isoShift(120), time: '07:00' },
  });
  check('far-future proposal rejected', farProp.status === 400, `got ${farProp.status}`);

  const prop = await api(runnerCookie, '/api/runs', {
    method: 'POST',
    body: { conversationId: convId, date: isoShift(2), time: '07:00', location: 'Castle Island, South Boston', miles: 2.2 },
  });
  const runId = prop.json?.run?.id;
  check('valid proposal created', prop.status === 200 && Boolean(runId), prop.text.slice(0, 120));

  // ── T4: accept guards ───────────────────────────────────
  console.log('T4 · accept');
  const selfAccept = await api(runnerCookie, `/api/runs/${runId}`, { method: 'POST', body: { action: 'accept' } });
  check('proposer cannot accept own proposal', selfAccept.status === 403, `got ${selfAccept.status}`);

  // Stale-proposal accept: backdate the proposal, then try to accept
  await sql`UPDATE runs SET run_date = ${isoShift(-2)} WHERE id = ${runId}`;
  const staleAccept = await api(ownerCookie, `/api/runs/${runId}`, { method: 'POST', body: { action: 'accept' } });
  check('stale (past-dated) proposal cannot be accepted', staleAccept.status === 400, `got ${staleAccept.status}`);
  await sql`UPDATE runs SET run_date = ${isoShift(2)} WHERE id = ${runId}`;

  const accept = await api(ownerCookie, `/api/runs/${runId}`, { method: 'POST', body: { action: 'accept' } });
  check('owner accepts proposal', accept.status === 200 && accept.json?.run?.status === 'confirmed', accept.text.slice(0, 120));

  // ── T5: feedback guards ─────────────────────────────────
  console.log('T5 · feedback');
  const earlyFb = await api(runnerCookie, `/api/runs/${runId}`, {
    method: 'POST',
    body: { action: 'feedback', comment: 'too soon', wantsRebook: false },
  });
  check('feedback rejected before the run happens', earlyFb.status === 400, `got ${earlyFb.status}`);

  // Time-travel: the run happened three days ago
  await sql`UPDATE runs SET run_date = ${isoShift(-3)} WHERE id = ${runId}`;

  const runnerFb = await api(runnerCookie, `/api/runs/${runId}`, {
    method: 'POST',
    body: { action: 'feedback', comment: 'Rex flew', wantsRebook: true, milesActual: 3.5, shareAsReview: true },
  });
  check('runner feedback accepted', runnerFb.status === 200, runnerFb.text.slice(0, 160));
  const [runAfterFb] = await sql`SELECT miles FROM runs WHERE id = ${runId}`;
  check('ledger miles updated to actual', Number(runAfterFb.miles) === 3.5, `miles=${runAfterFb.miles}`);

  const proposals1 = await sql`
    SELECT id, status, proposer_id FROM runs WHERE conversation_id = ${convId} AND id != ${runId}
  `;
  check('runner rebook created one follow-up proposal', proposals1.length === 1 && proposals1[0].status === 'proposed', JSON.stringify(proposals1.map((r: any) => r.status)));

  const ownerFb = await api(ownerCookie, `/api/runs/${runId}`, {
    method: 'POST',
    body: { action: 'feedback', comment: 'Pat was great with Rex', wantsRebook: true, shareAsReview: true },
  });
  check('owner feedback accepted', ownerFb.status === 200, ownerFb.text.slice(0, 160));

  const proposals2 = await sql`
    SELECT id, status FROM runs WHERE conversation_id = ${convId} AND id != ${runId} ORDER BY created_at
  `;
  const confirmedRebook = proposals2.filter((r: any) => r.status === 'confirmed');
  check('mutual rebook auto-confirmed the next run', confirmedRebook.length === 1, JSON.stringify(proposals2.map((r: any) => r.status)));

  // ── T6: reviews landed on both sides ────────────────────
  console.log('T6 · reviews');
  const rr = await sql`SELECT comment FROM runner_reviews WHERE runner_id = ${runnerId} AND author_id = ${ownerId}`;
  check('owner review on runner exists', rr.length === 1, JSON.stringify(rr));
  const dr = await sql`SELECT comment FROM dog_reviews WHERE dog_owner_id = ${ownerId} AND author_id = ${runnerId}`;
  check('runner review on dog exists', dr.length === 1, JSON.stringify(dr));

  const profAsOwner = await api(ownerCookie, `/api/profile/${runnerId}`);
  check('runner profile shows review + canReview', profAsOwner.json?.reviews?.length === 1 && profAsOwner.json?.canReview === true, JSON.stringify({ n: profAsOwner.json?.reviews?.length, can: profAsOwner.json?.canReview }));
  const profAsRunner = await api(runnerCookie, `/api/profile/${ownerId}`);
  check('dog profile shows review + canReview', profAsRunner.json?.reviews?.length === 1 && profAsRunner.json?.canReview === true, JSON.stringify({ n: profAsRunner.json?.reviews?.length, can: profAsRunner.json?.canReview }));

  const pub = await fetch(`${BASE}/api/p/${runnerId}`).then((r) => r.json());
  check('public share page has the review', pub?.reviews?.length === 1, JSON.stringify(pub?.reviews?.length));

  // ── T7: dashboard + favorites + mine + ics ──────────────
  console.log('T7 · dashboard, favorites, mine, ics');
  const dash = await api(runnerCookie, '/api/dashboard');
  check('runner dashboard counts the completed run', dash.json?.runsYear >= 1, JSON.stringify(dash.json));
  check('runner dashboard miles include actuals', dash.json?.milesYear >= 3.5, `milesYear=${dash.json?.milesYear}`);

  await api(runnerCookie, '/api/favorites', { method: 'POST', body: { targetId: ownerId } });
  const dash2 = await api(runnerCookie, '/api/dashboard');
  check('favorite reflected on dashboard', dash2.json?.favorites === 1, `favorites=${dash2.json?.favorites}`);

  const mine = await api(ownerCookie, '/api/runs/mine');
  check('runs/mine returns confirmed upcoming (auto-rebooked)', (mine.json?.upcoming?.length ?? 0) >= 1, JSON.stringify(mine.json?.upcoming?.length));
  check('runs/mine past run flagged as feedback-given', mine.json?.past?.[0]?.i_gave_feedback === true, JSON.stringify(mine.json?.past?.[0]?.i_gave_feedback));

  check('runs/mine includes weather field (nullable)', 'weather' in (mine.json ?? {}), JSON.stringify(Object.keys(mine.json ?? {})));

  const upcomingId = mine.json?.upcoming?.[0]?.id;
  const icsRes = await fetch(`${BASE}/api/runs/${upcomingId}/ics`, { headers: { Cookie: ownerCookie } });
  const icsText = await icsRes.text();
  check('ics downloads for confirmed run', icsRes.status === 200 && icsText.includes('METHOD:PUBLISH'), `status=${icsRes.status}`);

  // ── T8: messaging with photo ────────────────────────────
  console.log('T8 · messages');
  const photoMsg = await api(ownerCookie, `/api/conversations/${convId}`, {
    method: 'POST',
    body: { content: '', photoUrl: 'https://example.com/fake.jpg' },
  });
  check('photo-only message accepted', photoMsg.status === 200, photoMsg.text.slice(0, 120));
  const thread = await api(runnerCookie, `/api/conversations/${convId}`);
  const lastMsg = thread.json?.messages?.at(-1);
  check('photo message visible in thread', lastMsg?.photo_url === 'https://example.com/fake.jpg', JSON.stringify(lastMsg?.photo_url));

  // ── Done ────────────────────────────────────────────────
  await cleanup();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await cleanup();
  process.exit(1);
});
