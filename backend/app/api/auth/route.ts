import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { signToken } from '@/lib/auth';

// POST /api/auth
// Body: { type: 'student' | 'teacher', username, credential }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, username, credential } = body as {
      type: 'student' | 'teacher';
      username: string;
      credential: string;
    };

    if (!type || !username?.trim() || !credential?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 },
      );
    }

    if (type === 'student') {
      const rows = await sql`
        SELECT s.id, s.username, s.pin_hash, s.full_name, s.avatar_seed,
               c.id AS class_id, c.name AS class_name
        FROM students s
        LEFT JOIN classes c ON c.id = s.class_id
        WHERE s.username = ${username.trim().toLowerCase()}
        LIMIT 1
      `;

      const student = rows[0];
      if (!student) {
        return NextResponse.json({ error: 'Invalid username or PIN.' }, { status: 401 });
      }

      const valid = await bcrypt.compare(credential, student.pin_hash as string);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid username or PIN.' }, { status: 401 });
      }

      const token = await signToken({
        sub: student.id as string,
        role: 'student',
        username: student.username as string,
      });

      return NextResponse.json({
        token,
        user: {
          id: student.id,
          role: 'student',
          username: student.username,
          fullName: student.full_name,
          classId: student.class_id,
          className: student.class_name,
          avatarSeed: student.avatar_seed,
        },
      });
    }

    if (type === 'teacher') {
      const rows = await sql`
        SELECT id, username, password_hash, full_name
        FROM teachers
        WHERE username = ${username.trim().toLowerCase()}
        LIMIT 1
      `;

      const teacher = rows[0];
      if (!teacher) {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }

      const valid = await bcrypt.compare(credential, teacher.password_hash as string);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }

      const token = await signToken({
        sub: teacher.id as string,
        role: 'teacher',
        username: teacher.username as string,
      });

      return NextResponse.json({
        token,
        user: {
          id: teacher.id,
          role: 'teacher',
          username: teacher.username,
          fullName: teacher.full_name,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid type.' }, { status: 400 });
  } catch (err) {
    console.error('[auth]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
