import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

type CatalogEntry = {
  id: string;
  title: string;
  lastLoan: string | null;
  average: number | null;
  bayes: number | null;
};

const DEFAULT_SOURCE = path.resolve(process.cwd(), 'data/FullGameListItemized.xlsx');
const OUTPUT_PATH = path.resolve(process.cwd(), 'src/data/catalog.json');

async function main() {
  const sourcePath = resolveInputPath(process.argv[2]);
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(sourcePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  const catalog: CatalogEntry[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const id = normalizeId(row.Identifier);
    const title = typeof row.Title === 'string' ? row.Title.trim() : '';
    if (!id || !title) continue;
    if (seen.has(id)) {
      console.warn(`Duplicate identifier skipped: ${id}`);
      continue;
    }
    seen.add(id);

    catalog.push({
      id,
      title,
      lastLoan: normalizeDate(row.LastLoan),
      average: toNumber(row.AvgRating),
      bayes: toNumber(row.BayesRating),
    });
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(catalog, null, 2));
  console.log(`Catalog import complete: ${catalog.length} entries → ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

function resolveInputPath(arg?: string) {
  if (!arg) return DEFAULT_SOURCE;
  return path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg);
}

function normalizeId(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toUpperCase();
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeDate(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel serial date (days since 1899-12-30)
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
  }

  return null;
}

void main();
