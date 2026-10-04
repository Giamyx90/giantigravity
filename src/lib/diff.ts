import * as Diff from 'diff';
import { DiffChunk } from '@/types';

export function computeDiff(oldText: string, newText: string): DiffChunk[] {
  const parts = Diff.diffLines(oldText, newText);
  return parts.map((part) => ({
    added: part.added,
    removed: part.removed,
    value: part.value,
  }));
}

export function formatUnifiedDiff(oldText: string, newText: string, fileName: string): string {
  return Diff.createPatch(fileName, oldText, newText, 'original', 'modified');
}
