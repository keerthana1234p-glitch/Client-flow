import { isOverdueIST, getDaysDifferenceIST } from './timezone';

export interface PriorityScorableItem {
  value: number;
  stage: string;
  dueAt?: Date | string | null;
  lastActivityAt?: Date | string | null;
}

/**
 * Calculates deterministic Priority Score as mandated by the ClientFlow Master Checklist:
 * - overdue: +10
 * - value > 100k: +5
 * - stale > 7 days: +7
 * - stale > 14 days: +10
 * - stage == QUALIFIED: +3
 * - MAXIMUM CAP: 30
 */
export function calculatePriorityScore(item: PriorityScorableItem): number {
  let score = 0;

  // 1. Overdue: +10
  if (item.dueAt && isOverdueIST(item.dueAt)) {
    score += 10;
  }

  // 2. High Value (> 100k): +5
  if (item.value > 100000) {
    score += 5;
  }

  // 3. Stale calculation based on lastActivityAt
  if (item.lastActivityAt) {
    const daysInactive = getDaysDifferenceIST(item.lastActivityAt);
    if (daysInactive > 14) {
      score += 10;
    } else if (daysInactive > 7) {
      score += 7;
    }
  }

  // 4. Stage QUALIFIED: +3
  if (item.stage.toUpperCase() === 'QUALIFIED') {
    score += 3;
  }

  // Strict maximum cap of 30
  return Math.min(30, score);
}

/**
 * Sorts items in descending order of Priority Score
 */
export function sortByPriorityDesc<T extends PriorityScorableItem>(items: T[]): (T & { priorityScore: number })[] {
  return items
    .map(item => ({
      ...item,
      priorityScore: calculatePriorityScore(item),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}
