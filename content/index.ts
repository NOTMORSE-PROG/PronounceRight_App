import type { ChapterContent } from '@/types/content';
import { module1Content } from './module1';
import { module2Content } from './module2';

export { module1Content } from './module1';
export { module2Content } from './module2';

const ALL_CONTENT: ChapterContent[] = [...module1Content, ...module2Content];

export function getChapterContent(chapterId: string): ChapterContent | null {
  return ALL_CONTENT.find((c) => c.chapterId === chapterId) ?? null;
}
