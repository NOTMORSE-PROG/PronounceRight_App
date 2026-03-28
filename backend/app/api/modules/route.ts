import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/modules — returns all modules with their chapters
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const modules = await sql`
      SELECT m.id, m.number, m.title, m.description,
             json_agg(
               json_build_object(
                 'id', c.id,
                 'number', c.number,
                 'title', c.title,
                 'skillFocus', c.skill_focus,
                 'activityName', c.activity_name,
                 'activityDescription', c.activity_description
               ) ORDER BY c.number
             ) AS chapters
      FROM modules m
      LEFT JOIN chapters c ON c.module_id = m.id
      GROUP BY m.id
      ORDER BY m.number
    `;

    return NextResponse.json(modules);
  } catch (err) {
    console.error('[modules]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
