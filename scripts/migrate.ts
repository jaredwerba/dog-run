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

  console.log('Migrations complete.');
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
