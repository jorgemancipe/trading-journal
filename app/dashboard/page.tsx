"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";

/* ---------- config ---------- */

// Minimum trades required before flagging a cell
const MIN_TRADES_FOR_FLAG = 5;

/* ---------- session helpers ---------- */

type Session = "Open" | "Midday" | "Power Hour";

function getSessionFromDate(dateStr: string): Session | null {
  const d = new Date(dateStr);
  const hour = d.getHours();
  const min = d.getMinutes();

  // Open: 09:30–09:45
  if (hour === 9 && min >= 30 && min < 45) return "Open";

  // Midday: 09:45–11:30
  if (
    (hour === 9 && min >= 45) ||
    hour === 10 ||
    (hour === 11 && min < 30)
  ) {
    return "Midday";
  }

  // Power Hour: 15:00–16:00
  if (hour === 15) return "Power Hour";

  return null;
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

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-2">
        Strategy × Session (R Analytics)
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        🚩 Cells are auto‑flagged when Avg R is negative with ≥{" "}
        {MIN_TRADES_FOR_FLAG} trades.
      </p>

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
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    {strategy}
                  </td>
                  {sessions.map((s) => {
                    const cell = row?.get(s);
                    const avgR =
                      cell && cell.count > 0
                        ? cell.totalR / cell.count
                        : null;

                    const shouldFlag =
                      avgR !== null &&
                      avgR < 0 &&
                      cell!.count >= MIN_TRADES_FOR_FLAG;

                    return (
                      <td
                        key={s}
                        className={`px-3 py-2 text-center font-semibold ${cellColor(
                          avgR
                        )} ${
                          shouldFlag
                            ? "border-2 border-red-500"
                            : "border border-transparent"
                        }`}
                        title={
                          avgR === null
                            ? "No trades"
                            : `Avg R: ${avgR.toFixed(
                                2
                              )}, Trades: ${cell!.count}${
                                shouldFlag
                                  ? " — Flagged (negative expectancy)"
                                  : ""
                              }`
                        }
                      >
                        {avgR === null ? (
                          "–"
                        ) : (
                          <>
                            {avgR.toFixed(2)}
                            {shouldFlag && (
                              <span className="ml-1" aria-label="flag">
                                🚩
                              </span>
                            )}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {strategies.length === 0 && (
              <tr>
                <td
                  colSpan={sessions.length + 1}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No trades with sufficient data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
