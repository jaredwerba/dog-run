import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('Running migrations...');

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('owner', 'runner')),
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS credentials (
      id TEXT PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      public_key BYTEA NOT NULL,
      counter BIGINT NOT NULL DEFAULT 0,
      device_type TEXT,
      backed_up BOOLEAN DEFAULT false
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS dog_profiles (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      dog_name TEXT NOT NULL,
      breed TEXT NOT NULL,
      pace TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      owner_contact TEXT NOT NULL,
      photo_url TEXT,
      route TEXT NOT NULL DEFAULT 'castle-island',
      schedule JSONB DEFAULT '{}'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS runner_profiles (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      runner_name TEXT NOT NULL,
      pace TEXT NOT NULL,
      typical_distance TEXT NOT NULL,
      contact TEXT NOT NULL,
      availability TEXT NOT NULL DEFAULT '',
      photo_url TEXT,
      route TEXT NOT NULL DEFAULT 'castle-island',
      schedule JSONB DEFAULT '{}'
    )
  `;

  // Add schedule column to existing tables if missing
  await sql`ALTER TABLE dog_profiles ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '{}'`;
  await sql`ALTER TABLE runner_profiles ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '{}'`;

  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
      runner_id UUID REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(owner_id, runner_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      read_at TIMESTAMPTZ
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id)`;
  await sql`CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id)`;

  // Booked runs: one party proposes a time + place, the other confirms
  await sql`
    CREATE TABLE IF NOT EXISTS runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      proposer_id UUID REFERENCES users(id) ON DELETE CASCADE,
      run_date DATE NOT NULL,
      run_time TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT 'Castle Island, South Boston',
      status TEXT NOT NULL DEFAULT 'proposed'
        CHECK (status IN ('proposed', 'confirmed', 'declined', 'cancelled')),
      created_at TIMESTAMPTZ DEFAULT now(),
      responded_at TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS runs_conversation_id_idx ON runs(conversation_id)`;

  // Cron email tracking + dog personality notes
  await sql`ALTER TABLE runs ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ`;
  await sql`ALTER TABLE runs ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMPTZ`;
  await sql`ALTER TABLE dog_profiles ADD COLUMN IF NOT EXISTS quirks TEXT DEFAULT ''`;

  // Mileage ledger: weekly exercise goals + distance per run + post-run reports
  await sql`ALTER TABLE dog_profiles ADD COLUMN IF NOT EXISTS weekly_goal_miles INTEGER`;
  await sql`ALTER TABLE runs ADD COLUMN IF NOT EXISTS miles NUMERIC(4,1) NOT NULL DEFAULT 3.0`;
  await sql`ALTER TABLE runs ADD COLUMN IF NOT EXISTS report_note TEXT`;
  await sql`ALTER TABLE runs ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ`;

  // Two-sided post-run feedback
  await sql`
    CREATE TABLE IF NOT EXISTS run_feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
      author_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('owner', 'runner')),
      comment TEXT DEFAULT '',
      wants_rebook BOOLEAN DEFAULT false,
      miles_actual NUMERIC(4,1),
      share_as_review BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(run_id, author_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS run_feedback_run_id_idx ON run_feedback(run_id)`;

  // Runner reviews — owner comments, no scores
  await sql`
    CREATE TABLE IF NOT EXISTS runner_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      runner_id UUID REFERENCES users(id) ON DELETE CASCADE,
      author_id UUID REFERENCES users(id) ON DELETE CASCADE,
      comment TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(runner_id, author_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS runner_reviews_runner_id_idx ON runner_reviews(runner_id)`;

  // Photo attachments in chat
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS photo_url TEXT`;
  await sql`ALTER TABLE messages ALTER COLUMN content DROP NOT NULL`;

  // Runner running-specific fields
  await sql`ALTER TABLE runner_profiles ADD COLUMN IF NOT EXISTS personal_best TEXT DEFAULT ''`;
  await sql`ALTER TABLE runner_profiles ADD COLUMN IF NOT EXISTS solo_pace TEXT DEFAULT ''`;

  // Dog reviews — runner comments on the dog, no scores (mirrors runner_reviews)
  await sql`
    CREATE TABLE IF NOT EXISTS dog_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dog_owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
      author_id UUID REFERENCES users(id) ON DELETE CASCADE,
      comment TEXT NOT NULL,
      photo_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(dog_owner_id, author_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS dog_reviews_owner_id_idx ON dog_reviews(dog_owner_id)`;
  await sql`ALTER TABLE runner_reviews ADD COLUMN IF NOT EXISTS photo_url TEXT`;
  await sql`ALTER TABLE run_feedback ADD COLUMN IF NOT EXISTS photo_url TEXT`;

  // Favorites — heart a dog or runner profile
  await sql`
    CREATE TABLE IF NOT EXISTS favorites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      target_id UUID REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, target_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id)`;

  // Weekly-goal celebration + nudge memos (per dog, per Boston week)
  await sql`ALTER TABLE dog_profiles ADD COLUMN IF NOT EXISTS goal_hit_week DATE`;
  await sql`ALTER TABLE dog_profiles ADD COLUMN IF NOT EXISTS nudge_sent_week DATE`;

  console.log('Migrations complete.');
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
