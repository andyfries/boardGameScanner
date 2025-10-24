import type { GameRecord } from '@/lib/catalog';

export type Score = {
  value: number;
  verdict: 'keep' | 'review';
  rationale: string;
};

/**
 * Placeholder scoring: blend ratings and activity.
 * Higher average/bayes and recent loans boost the score, duplicates lower it.
 */
export function calculateScore(game: GameRecord): Score {
  const rating = (game.average + game.bayes) / 2;
  const loanRecency = daysSince(game.lastLoan);
  const recencyScore = loanRecency <= 60 ? 0.2 : loanRecency <= 180 ? 0 : -0.2;
  const duplicatePenalty = Math.min(game.duplicate, 2) * -0.1;
  const base = rating / 10;

  const value = clamp(base + recencyScore + duplicatePenalty, 0, 1);
  return {
    value,
    verdict: value >= 0.5 ? 'keep' : 'review',
    rationale: `rating ${rating.toFixed(1)}, last loan ${game.lastLoan}, duplicates ${game.duplicate}`,
  };
}

function daysSince(dateString: string): number {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
