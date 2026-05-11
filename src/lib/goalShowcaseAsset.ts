import pb from '@/lib/pocketbase';
import type { Goal } from '@/types/goal';

/** Public URL for an uploaded goal showcase image (PocketBase file field). */
export function getGoalShowcaseImageUrl(goal: Pick<Goal, 'id' | 'showcase_image'>): string | null {
  if (!goal.showcase_image || typeof goal.showcase_image !== 'string') return null;
  const url = pb.files.getURL({ id: goal.id, collectionName: 'goals' }, goal.showcase_image);
  return url || null;
}

/** True if the goal has any showcase media (uploaded image and/or link). */
export function goalHasShowcaseMedia(goal: Pick<Goal, 'showcase_url' | 'showcase_image'>): boolean {
  return !!(goal.showcase_url?.trim() || goal.showcase_image?.trim());
}
