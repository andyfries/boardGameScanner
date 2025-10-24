'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';

const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner),
  { ssr: false },
);

type ScanResponse = {
  code: string;
  game: {
    title: string;
    lastLoan: string | null;
    average: number | null;
    bayes: number | null;
  };
  score: {
    value: number;
    verdict: 'keep' | 'archive';
    rationale: string;
    reasons: Array<{ id: string; label: string; type: 'positive' | 'negative' }>;
  };
};

export default function Home() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(true);

  const lookupCode = useCallback(async (payload: string) => {
    const trimmed = payload.trim();
    if (!trimmed) {
      setError('Provide a QR code value first');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });

      const payloadData = (await response.json()) as ScanResponse | { error: string };
      if (!response.ok) {
        setError('error' in payloadData ? payloadData.error : 'Lookup failed');
        return;
      }

      if ('code' in payloadData) {
        setResult(payloadData);
        setIsScannerActive(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleDecodedValue = useCallback(
    (decoded: string) => {
      if (!decoded || isSubmitting || !isScannerActive) return;
      setIsScannerActive(false);
      setCode(decoded.trim());
      void lookupCode(decoded);
    },
    [isScannerActive, isSubmitting, lookupCode],
  );

  const handleScan = useCallback(
    (detected: Array<{ rawValue?: string }>) => {
      const value = detected.find((item) => item.rawValue)?.rawValue;
      if (value) handleDecodedValue(value);
    },
    [handleDecodedValue],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await lookupCode(code);
  };

  const resetScanner = () => {
    setIsScannerActive(true);
    setResult(null);
    setError(null);
    setCode('');
  };

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
        <header>
          <h1 className="text-3xl font-semibold text-white">
            Board game scanner
          </h1>
          <p className="text-sm text-slate-400">
            Scan the QR tag (or enter the code) to get catalog metadata.
          </p>
        </header>

        {!result && (
          <section className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-black shadow-lg">
              <Scanner
                onScan={handleScan}
                onError={(err) => {
                  console.error(err);
                  setError('Camera error—try manual entry');
                }}
                scanDelay={800}
                constraints={{ facingMode: 'environment' }}
                paused={!isScannerActive}
                sound={false}
                classNames={{
                  container: 'aspect-[3/4]',
                  video: 'h-full w-full object-cover',
                }}
              />
              <div className="pointer-events-none absolute inset-0 border border-white/30" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-2 rounded-2xl bg-slate-900 p-4">
              <label className="text-xs uppercase tracking-wide text-slate-500">
                Manual entry
              </label>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="47Z9PL"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base uppercase tracking-wide text-slate-100 placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900 disabled:text-emerald-300"
                >
                  {isSubmitting ? 'Lookup…' : 'Lookup'}
                </button>
              </div>
            </form>
          </section>
        )}

        {result && (
          <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5 text-white shadow-lg">
            <header>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Matched game
              </p>
              <h2 className="text-3xl font-semibold leading-tight">
                {result.game.title}
              </h2>
              <p className="text-sm text-slate-300">Code {result.code}</p>
            </header>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between">
                <DecisionPill verdict={result.score.verdict} />
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {result.score.reasons.map((reason) => (
                  <li
                    key={reason.id}
                    className={`flex items-center gap-2 ${
                      reason.type === 'positive'
                        ? 'text-emerald-200'
                        : 'text-red-200'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-base ${
                        reason.type === 'positive'
                          ? 'bg-emerald-500/20'
                          : 'bg-red-500/20'
                      }`}
                    >
                      {reason.type === 'positive' ? '✓' : '⚠'}
                    </span>
                    <span>{reason.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <StatItem
                label="Average rating"
                value={formatRating(result.game.average)}
              />
              <StatItem
                label="Bayes rating"
                value={formatRating(result.game.bayes)}
              />
              <StatItem
                label="Last loan"
                value={formatLastLoan(result.game.lastLoan)}
                className="col-span-2"
              />
            </div>

            <button
              type="button"
              onClick={resetScanner}
              className="w-full rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
            >
              Scan the next game
            </button>
          </section>
        )}

        {error && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

      </main>
    </div>
  );
}

function StatItem({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 ${className}`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function DecisionPill({ verdict }: { verdict: 'keep' | 'archive' }) {
  const isKeep = verdict === 'keep';
  const classes = isKeep
    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/60'
    : 'bg-red-500/20 text-red-200 border border-red-500/60';
  const label = isKeep ? 'Keep' : 'Archive';
  return (
    <span className={`rounded-full px-4 py-2 text-sm font-semibold ${classes}`}>
      {label}
    </span>
  );
}

function formatRating(value: number | null): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(1);
  }
  return 'No rating';
}

function formatLastLoan(value: string | null): string {
  return value ?? 'Unknown';
}
