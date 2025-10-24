import type { GameRecord } from '@/lib/catalog';

export type Score = {
  value: number;
  verdict: 'keep' | 'archive';
  rationale: string;
};

export function calculateScore(game: GameRecord): Score {
  const meanRating = (game.average + game.bayes) / 2;
  const lastLoanDate = new Date(game.lastLoan);
  const archiveDueToRating = meanRating < 7;
  const archiveDueToLoan = isBeforeJuly2024(lastLoanDate);
  const verdict: Score['verdict'] = archiveDueToRating || archiveDueToLoan ? 'archive' : 'keep';

  return {
    value: clamp(meanRating / 10, 0, 1),
    verdict,
    rationale: buildRationale(meanRating, game.lastLoan, archiveDueToRating, archiveDueToLoan),
  };
}

function isBeforeJuly2024(date: Date) {
  const cutoff = new Date('2024-07-01');
  return Number.isNaN(date.getTime()) || date < cutoff;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildRationale(
  meanRating: number,
  lastLoan: string,
  archiveDueToRating: boolean,
  archiveDueToLoan: boolean,
) {
  const reasons = [];
  if (archiveDueToRating) {
    reasons.push(`mean rating ${meanRating.toFixed(1)} (< 7)`);
  } else {
    reasons.push(`mean rating ${meanRating.toFixed(1)}`);
  }

  if (archiveDueToLoan) {
    reasons.push(`last loan ${lastLoan || 'unknown'} (before Jul 2024)`);
  } else {
    reasons.push(`last loan ${lastLoan || 'unknown'}`);
  }

  return reasons.join(', ');
}
