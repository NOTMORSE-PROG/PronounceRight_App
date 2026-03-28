import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/progress — fetch progress for the authenticated student
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const [progressRows, pointsRows, badgeRows] = await Promise.all([
      sql`
        SELECT chapter_id, attempts, best_score, completed, completed_at
        FROM progress
        WHERE student_id = ${user.sub}
      `,
      sql`
        SELECT total, streak, last_practice_date
        FROM student_points
        WHERE student_id = ${user.sub}
        LIMIT 1
      `,
      sql`
        SELECT badge_type, earned_at
        FROM student_badges
        WHERE student_id = ${user.sub}
        ORDER BY earned_at ASC
      `,
    ]);

    const points = pointsRows[0] ?? { total: 0, streak: 0 };

    return NextResponse.json({
      totalPoints: points.total,
      streak: points.streak,
      chapterProgress: progressRows.reduce(
        (acc, row) => {
          acc[row.chapter_id as string] = {
            chapterId: row.chapter_id,
            attempts: row.attempts,
            bestScore: row.best_score,
            completed: row.completed,
            completedAt: row.completed_at,
          };
          return acc;
        },
        {} as Record<string, unknown>,
      ),
      badges: badgeRows.map((b) => ({
        type: b.badge_type,
        earnedAt: b.earned_at,
      })),
    });
  } catch (err) {
    console.error('[progress GET]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// POST /api/progress — sync local progress to DB
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { chapterProgress, totalPoints, streak } = body as {
      chapterProgress: Record<
        string,
        { attempts: number; bestScore: number | null; completed: boolean; completedAt: string | null }
      >;
      totalPoints: number;
      streak: number;
    };

    // Upsert progress rows
    for (const [chapterId, p] of Object.entries(chapterProgress)) {
      await sql`
        INSERT INTO progress (student_id, chapter_id, attempts, best_score, completed, completed_at)
        VALUES (${user.sub}, ${chapterId}, ${p.attempts}, ${p.bestScore}, ${p.completed}, ${p.completedAt})
        ON CONFLICT (student_id, chapter_id)
        DO UPDATE SET
          attempts = GREATEST(progress.attempts, EXCLUDED.attempts),
          best_score = GREATEST(COALESCE(progress.best_score, 0), COALESCE(EXCLUDED.best_score, 0)),
          completed = progress.completed OR EXCLUDED.completed,
          completed_at = COALESCE(progress.completed_at, EXCLUDED.completed_at)
      `;
    }

    // Upsert points
    await sql`
      INSERT INTO student_points (student_id, total, streak, last_practice_date)
      VALUES (${user.sub}, ${totalPoints}, ${streak}, CURRENT_DATE)
      ON CONFLICT (student_id)
      DO UPDATE SET
        total = GREATEST(student_points.total, EXCLUDED.total),
        streak = EXCLUDED.streak,
        last_practice_date = EXCLUDED.last_practice_date
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[progress POST]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
