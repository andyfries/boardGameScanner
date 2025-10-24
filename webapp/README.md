## Getting Started

Install dependencies and launch the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the mobile-first scanner UI. Grant the browser permission to use the rear camera when prompted.

## Catalog data

The QR lookup uses a generated JSON file at `src/data/catalog.json`. To regenerate it from the spreadsheet:

```bash
# Optional: replace with your own path
cp ~/Downloads/FullGameListItemized.xlsx data/FullGameListItemized.xlsx
npm run import:catalog
# or provide a custom file: npm run import:catalog -- /path/to/file.xlsx
```

The import script keeps only the identifier, title, average/bayes ratings, and last loan date so deployments stay lean.

## Architecture overview

- `/app/page.tsx` renders the QR scanner UI (powered by `@yudiel/react-qr-scanner`), allows manual code entry, and surfaces catalog metadata plus the keep/archive score.
- `/app/api/scan/route.ts` accepts a QR payload, finds the record by ID via `lib/catalog.ts`, and computes the score in `lib/scoring.ts`.
- `lib/catalog.ts` loads the generated JSON into memory for fast lookups; we can later switch this to SQLite or another source without touching the API contract.

## Deployment

The project is optimized for Vercel:

1. Push to GitHub.
2. Create a new Vercel project and point it at the repo.
3. Assign your custom domain once you are satisfied with the preview deployment.

No additional services are required until we add the real catalog import or persistent storage.
