import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('speakright.db');
  }
  return db;
}

export async function initDB(): Promise<void> {
  const database = getDb();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      pin_hash TEXT NOT NULL,
      pin_salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      class_name TEXT NOT NULL DEFAULT 'Grade 10',
      created_at TEXT NOT NULL
    );
  `);
  // Migration: add profile_icon_id if this is an existing database without it
  try {
    await database.execAsync(`ALTER TABLE students ADD COLUMN profile_icon_id INTEGER;`);
  } catch {
    // column already exists — safe to ignore
  }
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      activity_id TEXT NOT NULL,
      prompt_index INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(student_id, activity_id, prompt_index)
    );
    CREATE TABLE IF NOT EXISTS activity_completions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      activity_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      answers TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(student_id, activity_id)
    );
    CREATE TABLE IF NOT EXISTS assessment_results (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      activity_id TEXT NOT NULL,
      prompt_index INTEGER NOT NULL,
      phonics_score INTEGER NOT NULL,
      transcript TEXT NOT NULL,
      errors TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(student_id, activity_id, prompt_index)
    );
  `);
}

export interface StudentRow {
  id: string;
  username: string;
  pin_hash: string;
  pin_salt: string;
  full_name: string;
  class_name: string;
  profile_icon_id?: number | null;
  created_at: string;
}

export async function createStudent(student: StudentRow): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO students (id, username, pin_hash, pin_salt, full_name, class_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      student.id,
      student.username,
      student.pin_hash,
      student.pin_salt,
      student.full_name,
      student.class_name,
      student.created_at,
    ]
  );
}

export async function updateStudentProfileIcon(id: string, profileIconId: number | null): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `UPDATE students SET profile_icon_id = ? WHERE id = ?;`,
    [profileIconId, id]
  );
}

export async function findStudentByUsername(username: string): Promise<StudentRow | null> {
  const database = getDb();
  const row = await database.getFirstAsync<StudentRow>(
    `SELECT * FROM students WHERE username = ?;`,
    [username]
  );
  return row ?? null;
}

// ─── Recordings ───────────────────────────────────────────────────────────────

export interface RecordingRow {
  id: string;
  student_id: string;
  activity_id: string;
  prompt_index: number;
  file_path: string;
  created_at: string;
}

export async function saveRecording(row: RecordingRow): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO recordings (id, student_id, activity_id, prompt_index, file_path, created_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [row.id, row.student_id, row.activity_id, row.prompt_index, row.file_path, row.created_at]
  );
}

export async function getRecordings(studentId: string, activityId: string): Promise<RecordingRow[]> {
  const database = getDb();
  return database.getAllAsync<RecordingRow>(
    `SELECT * FROM recordings WHERE student_id = ? AND activity_id = ?;`,
    [studentId, activityId]
  );
}

export async function deleteRecording(studentId: string, activityId: string, promptIndex: number): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `DELETE FROM recordings WHERE student_id = ? AND activity_id = ? AND prompt_index = ?;`,
    [studentId, activityId, promptIndex]
  );
}

// ─── Activity Completions (MCQ, non-recording activities) ─────────────────────

export interface ActivityCompletionRow {
  id: string;
  student_id: string;
  activity_id: string;
  score: number;
  answers: string; // JSON
  created_at: string;
}

export async function saveActivityCompletion(row: ActivityCompletionRow): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO activity_completions
     (id, student_id, activity_id, score, answers, created_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [row.id, row.student_id, row.activity_id, row.score, row.answers, row.created_at]
  );
}

export async function getActivityCompletion(studentId: string, activityId: string): Promise<ActivityCompletionRow | null> {
  const database = getDb();
  const row = await database.getFirstAsync<ActivityCompletionRow>(
    `SELECT * FROM activity_completions WHERE student_id = ? AND activity_id = ?;`,
    [studentId, activityId]
  );
  return row ?? null;
}

// ─── Assessment Results ────────────────────────────────────────────────────────

export interface AssessmentRow {
  id: string;
  student_id: string;
  activity_id: string;
  prompt_index: number;
  phonics_score: number;
  transcript: string;
  errors: string; // JSON.stringify(ErrorCategory[])
  created_at: string;
}

export async function saveAssessment(row: AssessmentRow): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO assessment_results
     (id, student_id, activity_id, prompt_index, phonics_score, transcript, errors, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [row.id, row.student_id, row.activity_id, row.prompt_index, row.phonics_score, row.transcript, row.errors, row.created_at]
  );
}

export async function getAssessments(studentId: string, activityId: string): Promise<AssessmentRow[]> {
  const database = getDb();
  return database.getAllAsync<AssessmentRow>(
    `SELECT * FROM assessment_results WHERE student_id = ? AND activity_id = ?;`,
    [studentId, activityId]
  );
}

export async function deleteAssessment(studentId: string, activityId: string, promptIndex: number): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `DELETE FROM assessment_results WHERE student_id = ? AND activity_id = ? AND prompt_index = ?;`,
    [studentId, activityId, promptIndex]
  );
}
