export type GameRecord = {
  id: string;
  title: string;
  type: 'party' | 'strategy' | 'card' | 'twoplayer' | 'cooperative';
  active: number;
  loaned: number;
  duplicate: number;
  average: number;
  bayes: number;
  lastLoan: string;
};

// Placeholder data keyed by QR/asset IDs until spreadsheet import is wired up.
const SAMPLE_CATALOG: GameRecord[] = [
  {
    id: '47Z9PL',
    title: 'Catan',
    type: 'strategy',
    active: 2,
    loaned: 1,
    duplicate: 0,
    average: 7.2,
    bayes: 6.8,
    lastLoan: '2024-08-10',
  },
  {
    id: '82KM1Q',
    title: 'Codenames',
    type: 'party',
    active: 3,
    loaned: 0,
    duplicate: 1,
    average: 7.7,
    bayes: 7.3,
    lastLoan: '2024-07-02',
  },
  {
    id: '5DJ2X7',
    title: 'Pandemic',
    type: 'cooperative',
    active: 1,
    loaned: 0,
    duplicate: 0,
    average: 8.0,
    bayes: 7.6,
    lastLoan: '2024-05-20',
  },
];

const CATALOG_BY_ID = new Map(
  SAMPLE_CATALOG.map((record) => [record.id.toUpperCase(), record]),
);

export function getGameById(id: string): GameRecord | null {
  return CATALOG_BY_ID.get(id.trim().toUpperCase()) ?? null;
}
