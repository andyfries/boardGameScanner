import catalogData from '@/data/catalog.json';

export type GameRecord = {
  id: string;
  title: string;
  lastLoan: string | null;
  average: number | null;
  bayes: number | null;
};

const CATALOG = catalogData as GameRecord[];
const CATALOG_BY_ID = new Map(
  CATALOG.map((record) => [record.id.toUpperCase(), record]),
);

export function getGameById(id: string): GameRecord | null {
  return CATALOG_BY_ID.get(id.trim().toUpperCase()) ?? null;
}
