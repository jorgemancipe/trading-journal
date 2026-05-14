"use client";

import { useMemo, useState/TradesContext";import { useMemo, useState } from "react";

type Session = "Open" | "Midday" | "Power Hour";

/* ---------- helpers ---------- */

function getSessionFromDate(dateStr: string): Session | null {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();

  if (h === 9 && m >= 30 && m < 45) return "Open";
  if ((h === 9 && m >= 45) || h === 10 || (h === 11 && m < 30))
    return "Midday";
  if (h === 15) return "Power Hour";
  return null;
}

function avgR(trades: { profit: number; risk: number }[]) {
  if (trades.length === 0) return 0;
  return (
    trades.reduce((s, t) => s + t.profit / t.risk, 0) / trades.length
  );
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();
  const [minTrades, setMinTrades] = useState(5);
  const [simulate, setSimulate] = useState(false);

  const validTrades = useMemo(
    () => trades.filter((t) => t.risk > 0),
    [trades]
  );

  const matrix = useMemo(() => {
    const map = new Map<
      string,
      Map<Session, { totalR: number; count: number }>
    >();

    for (const t of validTrades) {
      const session = getSessionFromDate(t.date);
      if (!session) continue;

      const strategy = t.strategy || "Unassigned";
      const r = t.profit / t.risk;

      if (!map.has(strategy)) {
        map.set(strategy, new Map());
      }

      const row = map.get(strategy)!;
      const cell = row.get(session) ?? { totalR: 0, count: 0 };
      cell.totalR += r;
      cell.count += 1;
      row.set(session, cell);
    }

    return map;
  }, [validTrades]);

  const rules = useMemo(() => {
    const out: { strategy: string; session: Session }[] = [];
    for (const [strategy, row] of matrix.entries()) {
      for (const [session, cell] of row.entries()) {
        const r = cell.totalR / cell.count;
        if (r < 0 && cell.count >= minTrades) {
          out.push({ strategy, session });
        }
      }
    }
    return out;
  }, [matrix, minTrades]);

  const simulatedTrades = useMemo(() => {
    if (!simulate) return validTrades;

    return validTrades.filter((t) => {
      const s = getSessionFromDate(t.date);
      if (!s) return true;
      return !rules.some(
        (r) => r.strategy === t.strategy && r.session === s
      );
    });
  }, [simulate, validTrades, rules]);

  const originalAvgR = avgR(validTrades);
  const simulatedAvgR = avgR(simulatedTrades);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">
        Simulated “Apply Rules”
      </h1>

      <div className="bg-white p-4 border rounded mb-6 space-y-4">
        <div>
          <label className="text-sm font-medium">
            Minimum trades: {minTrades}
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={minTrades}
            onChange={(e) => setMinTrades(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={simulate}
            onChange={(e) => setSimulate(e.target.checked)}
          />
          Simulate Apply Rules
        </label>
      </div>

      <div className="bg-white p-4 border rounded mb-6">
        <h2 className="font-semibold mb-2">Results</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>Original Avg R: {originalAvgR.toFixed(2)}</div>
          <div>Simulated Avg R: {simulatedAvgR.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white p-4 border rounded">
        <h2 className="font-semibold mb-2">Auto‑Rules</h2>
        {rules.length === 0 ? (
          <div>No rules triggered.</div>
        ) : (
          <ul className="list-disc list-inside">
            {rules.map((r, i) => (
              <li key={i}>
                Disable <strong>{r.strategy}</strong> during{" "}
                <strong>{r.session}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
