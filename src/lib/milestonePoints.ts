// Milestone bonus points system
// Each book: 3 points
// 1st book: +3 bonus
// 15 books: +5 bonus
// 30 books: +10 bonus
// 45 books: +15 bonus
// Total at 45 books: 135 (books) + 33 (bonuses) = 168 points

export const MILESTONE_BONUSES = [
  { books: 1, bonus: 3, label: 'First Book Bonus' },
  { books: 15, bonus: 5, label: 'Bronze Milestone' },
  { books: 30, bonus: 10, label: 'Silver Milestone' },
  { books: 45, bonus: 15, label: 'Gold Milestone' },
] as const;

export const POINTS_PER_BOOK = 3;
export const MAX_TOTAL_POINTS = 168; // 45*3 + 3+5+10+15

export function calculateBonusPoints(booksRead: number): number {
  let bonus = 0;
  for (const milestone of MILESTONE_BONUSES) {
    if (booksRead >= milestone.books) {
      bonus += milestone.bonus;
    }
  }
  return bonus;
}

export function calculateTotalPoints(booksRead: number): number {
  return (booksRead * POINTS_PER_BOOK) + calculateBonusPoints(booksRead);
}

export function getNextMilestone(booksRead: number): { books: number; bonus: number; label: string; remaining: number } | null {
  for (const milestone of MILESTONE_BONUSES) {
    if (booksRead < milestone.books) {
      return { ...milestone, remaining: milestone.books - booksRead };
    }
  }
  return null;
}

export function getEarnedMilestones(booksRead: number) {
  return MILESTONE_BONUSES.filter(m => booksRead >= m.books);
}
