import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function seed() {
  console.log('Seeding database...');

  // ── Dog owners ──────────────────────────────────────────────
  const owners = [
    { username: 'sarah_k', dogName: 'Biscuit', breed: 'Golden Retriever', pace: 'moderate', ownerName: 'Sarah K.', contact: 'sarah@example.com', photo: null },
    { username: 'mike_t',  dogName: 'Duke',    breed: 'Labrador',          pace: 'fast',     ownerName: 'Mike T.',  contact: '617-555-0101',      photo: null },
    { username: 'priya_r', dogName: 'Noodle',  breed: 'Greyhound',         pace: 'fast',     ownerName: 'Priya R.', contact: 'priya@example.com', photo: null },
    { username: 'james_l', dogName: 'Mochi',   breed: 'Shiba Inu',         pace: 'casual',   ownerName: 'James L.', contact: '617-555-0202',      photo: null },
    { username: 'anna_b',  dogName: 'Pepper',  breed: 'Border Collie',     pace: 'moderate', ownerName: 'Anna B.',  contact: 'anna@example.com',  photo: null },
  ];

  for (const o of owners) {
    const [user] = await sql`
      INSERT INTO users (username, role)
      VALUES (${o.username}, 'owner')
      ON CONFLICT (username) DO UPDATE SET role = 'owner'
      RETURNING id
    `;
    await sql`
      INSERT INTO dog_profiles (user_id, dog_name, breed, pace, owner_name, owner_contact, photo_url, route)
      VALUES (${user.id}, ${o.dogName}, ${o.breed}, ${o.pace}, ${o.ownerName}, ${o.contact}, ${o.photo}, 'castle-island')
      ON CONFLICT (user_id) DO NOTHING
    `;
  }

  // ── Runners ─────────────────────────────────────────────────
  const runners = [
    { username: 'tom_w',   name: 'Tom W.',   pace: 'moderate', distance: '3–5 mi', availability: 'Weekday mornings',  contact: 'tom@example.com',   photo: null },
    { username: 'lucia_m', name: 'Lucia M.', pace: 'fast',     distance: '5–8 mi', availability: 'Weekend mornings',  contact: '617-555-0303',      photo: null },
    { username: 'derek_h', name: 'Derek H.', pace: 'casual',   distance: '2–3 mi', availability: 'Evenings',          contact: 'derek@example.com', photo: null },
    { username: 'keisha_n',name: 'Keisha N.',pace: 'moderate', distance: '4–6 mi', availability: 'Weekends',          contact: '617-555-0404',      photo: null },
    { username: 'sam_p',   name: 'Sam P.',   pace: 'fast',     distance: '6–10 mi',availability: 'Early mornings',    contact: 'sam@example.com',   photo: null },
  ];

  for (const r of runners) {
    const [user] = await sql`
      INSERT INTO users (username, role)
      VALUES (${r.username}, 'runner')
      ON CONFLICT (username) DO UPDATE SET role = 'runner'
      RETURNING id
    `;
    await sql`
      INSERT INTO runner_profiles (user_id, runner_name, pace, typical_distance, contact, availability, photo_url, route)
      VALUES (${user.id}, ${r.name}, ${r.pace}, ${r.distance}, ${r.contact}, ${r.availability}, ${r.photo}, 'castle-island')
      ON CONFLICT (user_id) DO NOTHING
    `;
  }

  console.log('Seeding complete — 5 dog owners + 5 runners inserted.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
