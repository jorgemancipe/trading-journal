"use client";

import { useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";

/* ---------- types ---------- */

type Session = "Open" | "Midday" | "Power Hour";

type Rule = {
  strategy: string;
  session: Session;
};

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

  /* Build strategy × session stats */
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

  /* Auto‑rules */
  const rules: Rule[] = useMemo(() => {
    const out: Rule[] = [];

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

  /* Simulated application */
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
  const deltaCombined = simulatedAvgR - originalAvgR;

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-6">
        Simulated “Apply Rules”
      </h1>

      {/* Controls */}
      <div className="bg-white border rounded p-4 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">
            Minimum trades for rules: {minTrades}
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

      {/* Overall simulation result */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Overall Impact</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>Original Avg R: {originalAvgR.toFixed(2)}</div>
          <div>Simulated Avg R: {simulatedAvgR.toFixed(2)}</div>
          <div
            className={
              deltaCombined >= 0
                ? "text-green-700 font-semibold"
                : "text-red-700 font-semibold"
            }
          >
            Δ Avg R: {deltaCombined >= 0 ? "+" : ""}
            {deltaCombined.toFixed(2)}
          </div>
        </div>
      </div>

      {/* ✅ Per‑Rule Impact Breakdown */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-3">
          Per‑Rule Impact Breakdown
        </h2>

        {rules.length === 0 ? (
          <div className="text-sm text-gray-500">
            No rules available at this threshold.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Rule</th>
                <th className="px-3 py-2 text-right">Trades Removed</th>
                <th className="px-3 py-2 text-right">Δ Avg R</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, i) => {
                const filtered = validTrades.filter((t) => {
                  const s = getSessionFromDate(t.date);
                  return !(
                    t.strategy === rule.strategy && s === rule.session
                  );
                });

                const delta = avgR(filtered) - originalAvgR;
                const removed = validTrades.length - filtered.length;

                return (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">
                      Disable <strong>{rule.strategy}</strong> during{" "}
                      <strong>{rule.session}</strong>
                    </td>
                    <td className="px-3 py-2 text-right">{removed}</td>
                    <td
                      className={`px-3 py-2 text-right font-semibold ${
                        delta >= 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {delta >= 0 ? "+" : ""}
                      {delta.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
