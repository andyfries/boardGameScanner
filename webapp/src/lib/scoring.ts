import type { GameRecord } from '@/lib/catalog';

export type Score = {
  value: number;
  verdict: 'keep' | 'archive';
  rationale: string;
  reasons: Reason[];
};

type Reason = {
  id: string;
  label: string;
  type: 'positive' | 'negative';
};

export function calculateScore(game: GameRecord): Score {
  const meanRating = computeMeanRating(game);
  const lastLoanDate = game.lastLoan ? new Date(game.lastLoan) : null;
  const archiveDueToRating = meanRating < 7;
  const archiveDueToLoan = isBeforeJuly2024(lastLoanDate);
  const verdict: Score['verdict'] =
    archiveDueToRating || archiveDueToLoan ? 'archive' : 'keep';

  return {
    value: clamp(meanRating / 10, 0, 1),
    verdict,
    rationale: buildRationale(
      meanRating,
      game.lastLoan,
      archiveDueToRating,
      archiveDueToLoan,
    ),
    reasons: buildReasons(meanRating, game.lastLoan, archiveDueToRating, archiveDueToLoan),
  };
}

function computeMeanRating(game: GameRecord): number {
  const ratings = [game.average, game.bayes].filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );
  if (!ratings.length) return 0;
  const sum = ratings.reduce((acc, value) => acc + value, 0);
  return sum / ratings.length;
}

function isBeforeJuly2024(date: Date | null) {
  const cutoff = new Date('2024-07-01');
  if (!date || Number.isNaN(date.getTime())) return true;
  return date < cutoff;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildRationale(
  meanRating: number,
  lastLoan: string | null,
  archiveDueToRating: boolean,
  archiveDueToLoan: boolean,
) {
  const lastLoanDisplay = lastLoan ?? 'unknown';
  const reasons = [];
  if (archiveDueToRating) {
    reasons.push(`mean rating ${meanRating.toFixed(1)} (< 7)`);
  } else {
    reasons.push(`mean rating ${meanRating.toFixed(1)}`);
  }

  if (archiveDueToLoan) {
    reasons.push(`last loan ${lastLoanDisplay} (before Jul 2024)`);
  } else {
    reasons.push(`last loan ${lastLoanDisplay}`);
  }

  return reasons.join(', ');
}

function buildReasons(
  meanRating: number,
  lastLoan: string | null,
  archiveDueToRating: boolean,
  archiveDueToLoan: boolean,
): Reason[] {
  const items: Reason[] = [];
  const ratingLabel = archiveDueToRating
    ? 'Average rating below 7.0'
    : `Average rating ${meanRating.toFixed(1)} or better`;
  items.push({
    id: 'rating',
    label: ratingLabel,
    type: archiveDueToRating ? 'negative' : 'positive',
  });

  const loanLabel = archiveDueToLoan
    ? 'Not checked out since before Jul 2024'
    : 'Checked out recently';
  items.push({
    id: 'loan',
    label: lastLoan ? `${loanLabel} (${lastLoan})` : `${loanLabel} (date unknown)`,
    type: archiveDueToLoan ? 'negative' : 'positive',
  });

  return items;
}
