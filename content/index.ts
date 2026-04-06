import type { ChapterContent } from '@/types/content';
import { module1Content } from './module1';
import { module2Content } from './module2';
import { module3Content } from './module3';

export { module1Content } from './module1';
export { module2Content } from './module2';
export { module3Content } from './module3';
export { WORD_OF_THE_DAY_BANK } from './word-of-the-day';

const ALL_CONTENT: ChapterContent[] = [...module1Content, ...module2Content, ...module3Content];

export function getChapterContent(chapterId: string): ChapterContent | null {
  return ALL_CONTENT.find((c) => c.chapterId === chapterId) ?? null;
}
