import * as FileSystem from 'expo-file-system/legacy';
import { saveRecording, getRecordings, deleteRecording } from './db';

function getRecordingsDir(): string {
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error('documentDirectory unavailable');
  return base + 'recordings/';
}

async function ensureDir(dir: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export async function keepRecording(
  studentId: string,
  activityId: string,
  promptIndex: number,
  tempUri: string
): Promise<string> {
  const recordingsDir = getRecordingsDir();
  await ensureDir(recordingsDir);
  const destPath = `${recordingsDir}${studentId}_${activityId}_${promptIndex}.m4a`;

  // Verify source exists before copying
  const srcInfo = await FileSystem.getInfoAsync(tempUri);
  if (!srcInfo.exists) throw new Error(`Source recording not found: ${tempUri}`);

  // Delete existing destination file to avoid copyAsync collision
  const dstInfo = await FileSystem.getInfoAsync(destPath);
  if (dstInfo.exists) await FileSystem.deleteAsync(destPath, { idempotent: true });

  await FileSystem.copyAsync({ from: tempUri, to: destPath });

  // Verify copy succeeded
  const copied = await FileSystem.getInfoAsync(destPath);
  if (!copied.exists) throw new Error(`Copy failed, dest not found: ${destPath}`);

  await saveRecording({
    id: `${studentId}_${activityId}_${promptIndex}`,
    student_id: studentId,
    activity_id: activityId,
    prompt_index: promptIndex,
    file_path: destPath,
    created_at: new Date().toISOString(),
  });
  return destPath;
}

export async function loadRecordings(
  studentId: string,
  activityId: string
): Promise<Record<number, string>> {
  const rows = await getRecordings(studentId, activityId);
  const result: Record<number, string> = {};
  for (const row of rows) {
    const info = await FileSystem.getInfoAsync(row.file_path);
    if (info.exists) {
      result[row.prompt_index] = row.file_path;
    }
  }
  return result;
}

export async function retryRecording(
  studentId: string,
  activityId: string,
  promptIndex: number
): Promise<void> {
  const rows = await getRecordings(studentId, activityId);
  const row = rows.find((r) => r.prompt_index === promptIndex);
  if (row) {
    await FileSystem.deleteAsync(row.file_path, { idempotent: true });
    await deleteRecording(studentId, activityId, promptIndex);
  }
}
