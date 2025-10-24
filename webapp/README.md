## Getting Started

Install dependencies and launch the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the mobile-first scanner UI. Grant the browser permission to use the rear camera when prompted.

## Architecture overview

- `/app/page.tsx` renders the QR scanner UI (powered by `@yudiel/react-qr-scanner`), allows manual code entry, and surface catalog metadata plus the keep/review score.
- `/app/api/scan/route.ts` accepts a QR payload, finds the record by ID via `lib/catalog.ts`, and computes the placeholder score in `lib/scoring.ts`.
- `lib/catalog.ts` currently holds sample data keyed by QR IDs; later we can swap this for a SQLite-backed catalog or an import from your spreadsheet.

## Deployment

The project is optimized for Vercel:

1. Push to GitHub.
2. Create a new Vercel project and point it at the repo.
3. Assign your custom domain once you are satisfied with the preview deployment.

No additional services are required until we add the real catalog import or persistent storage.
