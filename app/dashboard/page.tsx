"use client";

import { useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";

/* ---------- config ---------- */

type Session = "Open" | "Midday" | "Power Hour";

/* ---------- helpers ---------- */

function getSessionFromDate(dateStr: string): Session | null {
  const d = new Date(dateStr);
  const hour = d.getHours();
  const min = d.getMinutes();

  if (hour === 9 && min >= 30 && min < 45) return "Open";
  if ((hour === 9 && min >= 45) || hour === 10 || (hour === 11 && min < 30))
    return "Midday";
  if (hour === 15) return "Power Hour";
  return null;
}

function cellColor(avgR: number | null, count: number, minTrades: number) {
  if (avgR === null) return "bg-gray-100 text-gray-400";
  if (count < minTrades) return "bg-gray-50 text-gray-400";
  if (avgR > 0) return "bg-green-100 text-green-800";
  if (avgR < 0) return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-600";
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();
  const [minTrades, setMinTrades] = useState(5);

  const validTrades = useMemo(
    () => trades.filter((t) => t.risk > 0),
    [trades]
  );

  const strategies = useMemo(
    () =>
      Array.from(
        new Set(validTrades.map((t) => t.strategy || "Unassigned"))
      ).sort(),
    [validTrades]
  );

  const sessions: Session[] = ["Open", "Midday", "Power Hour"];

  // Strategy × Session aggregation
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

      if (!map.has(strategy)) map.set(strategy, new Map());
      const row = map.get(strategy)!;

      const cell = row.get(session) ?? { totalR: 0, count: 0 };
      cell.totalR += r;
      cell.count += 1;
      row.set(session, cell);
    }

    return map;
  }, [validTrades]);

  // ✅ Auto‑summary of worst combos
  const worstCombos = useMemo(() => {
    const rows: {
      strategy: string;
      session: Session;
      avgR: number;
      trades: number;
    }[] = [];

    for (const [strategy, row] of matrix.entries()) {
      for (const [session, cell] of row.entries()) {
        const avgR = cell.totalR / cell.count;
        if (avgR < 0 && cell.count >= minTrades) {
          rows.push({ strategy, session, avgR, trades: cell.count });
        }
      }
    }

    return rows.sort((a, b) => a.avgR - b.avgR);
  }, [matrix, minTrades]);

  // ✅ Auto‑rules preview
  const autoRules = useMemo(() => {
    return worstCombos.map((c) => ({
      rule: `Disable "${c.strategy}" during ${c.session} session`,
      reason: `Avg R ${c.avgR.toFixed(2)} over ${c.trades} trades`,
    }));
  }, [worstCombos]);

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-2">
        Strategy × Session (R Analytics)
      </h1>

      {/* Controls */}
      <div className="bg-white border rounded p-4 mb-6">
        <label className="block text-sm font-medium mb-2">
          Minimum trades to evaluate: <strong>{minTrades}</strong>
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

      {/* ✅ Auto‑Rules Preview */}
      <div className="bg-white border rounded p-4 mb-8">
        <h2 className="text-lg font-semibold mb-2">
          ✅ Auto‑Rules Preview
        </h2>
        <p className="text-xs text-gray-600 mb-3">
          Suggested rules based on statistically significant negative expectancy.
        </p>

        {autoRules.length === 0 ? (
          <div className="text-sm text-gray-500">
            No auto‑rules triggered at this threshold.
          </div>
        ) : (
          <ul className="space-y-2">
            {autoRules.map((r, i) => (
              <li
                key={i}
                className="border rounded px-3 py-2 bg-red-50 text-red-800"
              >
                🚫 <strong>{r.rule}</strong>
                <div className="text-xs text-red-700 mt-1">
                  Reason: {r.reason}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Heatmap */}
      <div className="bg-white border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Strategy</th>
              {sessions.map((s) => (
                <th key={s} className="px-3 py-2 text-center">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {strategies.map((strategy) => {
              const row = matrix.get(strategy);
              return (
                <tr key={strategy} className="border-t">
                  <td className="px-3 py-2 font-medium">{strategy}</td>
                  {sessions.map((s) => {
                    const cell = row?.get(s);
                    const avgR =
                      cell && cell.count > 0
                        ? cell.totalR / cell.count
                        : null;

                    const flag =
                      avgR !== null &&
                      avgR < 0 &&
                      (cell?.count ?? 0) >= minTrades;

                    return (
                      <td
                        key={s}
                        className={`px-3 py-2 text-center font-semibold ${cellColor(
                          avgR,
                          cell?.count ?? 0,
                          minTrades
                        )} ${flag ? "border-2 border-red-500" : ""}`}
                      >
                        {avgR === null ? "–" : avgR.toFixed(2)}
                        {flag && <span className="ml-1">🚩</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
