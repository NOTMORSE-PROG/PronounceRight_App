import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

/**
 * Neon serverless SQL client.
 * Usage:  const rows = await sql`SELECT * FROM students WHERE id = ${id}`;
 */
export const sql = neon(process.env.DATABASE_URL);

// ─── Schema helpers ────────────────────────────────────────────────────────────

export async function runMigrations() {
  await sql`
    CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      pin_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      class_id UUID,
      avatar_seed TEXT DEFAULT 'default',
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS teachers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS classes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      teacher_id UUID REFERENCES teachers(id),
      code TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS modules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      number INT NOT NULL,
      title TEXT NOT NULL,
      description TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS chapters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
      number INT NOT NULL,
      title TEXT NOT NULL,
      skill_focus TEXT,
      activity_name TEXT,
      activity_description TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
      attempts INT DEFAULT 0,
      best_score NUMERIC(5,2),
      completed BOOLEAN DEFAULT false,
      completed_at TIMESTAMPTZ,
      UNIQUE(student_id, chapter_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS student_points (
      student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
      total INT DEFAULT 0,
      streak INT DEFAULT 0,
      last_practice_date DATE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS student_badges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      badge_type TEXT NOT NULL,
      earned_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(student_id, badge_type)
    )
  `;
}
