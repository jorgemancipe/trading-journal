"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";

/* ---------- helpers ---------- */

function hourLabel(h: number) {
  return `${h}:00`;
}

function cellColor(avgR: number | null) {
  if (avgR === null) return "bg-gray-100 text-gray-400";
  if (avgR > 0) return "bg-green-100 text-green-800";
  if (avgR < 0) return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-600";
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  // Only trades usable for R analytics
  const validTrades = useMemo(
    () => trades.filter((t) => t.risk > 0),
    [trades]
  );

  /* Collect unique strategies and hours */
  const strategies = useMemo(
    () =>
      Array.from(
        new Set(validTrades.map((t) => t.strategy || "Unassigned"))
      ).sort(),
    [validTrades]
  );

  const hours = useMemo(() => {
    const hs = new Set<number>();
    for (const t of validTrades) {
      const h = new Date(t.date).getHours();
      hs.add(h);
    }
    return Array.from(hs).sort((a, b) => a - b);
  }, [validTrades]);

  /* Build Strategy × Hour matrix */
  const matrix = useMemo(() => {
    const map = new Map<string, Map<number, { totalR: number; count: number }>>();

    for (const t of validTrades) {
      const strategy = t.strategy || "Unassigned";
      const hour = new Date(t.date).getHours();
      const r = t.profit / t.risk;

      if (!map.has(strategy)) {
        map.set(strategy, new Map());
      }
      const row = map.get(strategy)!;
      const cell = row.get(hour) ?? { totalR: 0, count: 0 };
      cell.totalR += r;
      cell.count += 1;
      row.set(hour, cell);
    }

    return map;
  }, [validTrades]);

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-6">
        Strategy × Time‑of‑Day Heatmap
      </h1>

      <div className="bg-white border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Strategy</th>
              {hours.map((h) => (
                <th key={h} className="px-3 py-2 text-center">
                  {hourLabel(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {strategies.map((strategy) => {
              const row = matrix.get(strategy);
              return (
                <tr key={strategy} className="border-t">
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    {strategy}
                  </td>
                  {hours.map((h) => {
                    const cell = row?.get(h);
                    const avgR =
                      cell && cell.count > 0
                        ? cell.totalR / cell.count
                        : null;
                    return (
                      <td
                        key={h}
                        className={`px-3 py-2 text-center font-semibold ${cellColor(
                          avgR
                        )}`}
                        title={
                          cell
                            ? `${cell.count} trades`
                            : "No trades"
                        }
                      >
                        {avgR === null ? "–" : avgR.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {strategies.length === 0 && (
              <tr>
                <td
                  colSpan={hours.length + 1}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No trades with strategy and risk data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
