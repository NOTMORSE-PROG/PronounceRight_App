import * as Crypto from 'expo-crypto';
import { createStudent, findStudentByUsername, updateStudentProfileIcon } from './db';
import type { AuthUser } from '@/types';

export { updateStudentProfileIcon };

async function hashPin(salt: string, pin: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    salt + pin
  );
}

function toUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_');
}

export type RegisterError = 'USERNAME_TAKEN' | 'INVALID_USERNAME' | 'PIN_TOO_SHORT';
export type LoginError = 'NOT_FOUND' | 'WRONG_PIN';

export async function registerStudent(
  fullName: string,
  usernameRaw: string,
  pin: string
): Promise<{ user: AuthUser } | { error: RegisterError }> {
  const username = toUsername(usernameRaw);

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { error: 'INVALID_USERNAME' };
  }
  if (pin.length < 4) {
    return { error: 'PIN_TOO_SHORT' };
  }

  const existing = await findStudentByUsername(username);
  if (existing) {
    return { error: 'USERNAME_TAKEN' };
  }

  const salt = Crypto.randomUUID();
  const pinHash = await hashPin(salt, pin);
  const id = Crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await createStudent({
    id,
    username,
    pin_hash: pinHash,
    pin_salt: salt,
    full_name: fullName.trim(),
    class_name: 'Grade 10',
    created_at: createdAt,
  });

  const user: AuthUser = {
    id,
    username,
    fullName: fullName.trim(),
    classId: undefined,
    className: 'Grade 10',
    avatarSeed: fullName.trim().charAt(0).toUpperCase(),
    createdAt,
  };

  return { user };
}

export async function loginStudent(
  usernameRaw: string,
  pin: string
): Promise<{ user: AuthUser } | { error: LoginError }> {
  const username = toUsername(usernameRaw);
  const row = await findStudentByUsername(username);

  if (!row) {
    return { error: 'NOT_FOUND' };
  }

  const inputHash = await hashPin(row.pin_salt, pin);
  if (inputHash !== row.pin_hash) {
    return { error: 'WRONG_PIN' };
  }

  const user: AuthUser = {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    classId: undefined,
    className: row.class_name,
    avatarSeed: row.full_name.charAt(0).toUpperCase(),
    profileIconId: row.profile_icon_id ?? undefined,
    createdAt: row.created_at,
  };

  return { user };
}
