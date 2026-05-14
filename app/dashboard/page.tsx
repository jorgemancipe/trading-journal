"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";

type StrategyStats = {
  strategy: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgR: number;
  profitFactor: number;
  netR: number;
};

export default function DashboardPage() {
  const { trades } = useTrades();

  const strategyStats = useMemo<StrategyStats[]>(() => {
    const map = new Map<string, StrategyStats>();

    for (const t of trades) {
      if (t.risk <= 0) continue;

      const r = t.profit / t.risk;
      const key = t.strategy || "Unassigned";

      if (!map.has(key)) {
        map.set(key, {
          strategy: key,
          trades: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          avgR: 0,
          profitFactor: 0,
          netR: 0,
        });
      }

      const s = map.get(key)!;
      s.trades += 1;
      s.netR += r;

      if (r > 0) s.wins += 1;
      if (r < 0) s.losses += 1;
    }

    return Array.from(map.values()).map((s) => {
      const grossWinR = trades
        .filter((t) => t.strategy === s.strategy && t.profit > 0 && t.risk > 0)
        .reduce((sum, t) => sum + t.profit / t.risk, 0);

      const grossLossR = Math.abs(
        trades
          .filter((t) => t.strategy === s.strategy && t.profit < 0 && t.risk > 0)
          .reduce((sum, t) => sum + t.profit / t.risk, 0)
      );

      return {
        ...s,
        winRate: s.trades > 0 ? (s.wins / s.trades) * 100 : 0,
        avgR: s.trades > 0 ? s.netR / s.trades : 0,
        profitFactor:
          grossLossR === 0 ? (grossWinR > 0 ? Infinity : 0) : grossWinR / grossLossR,
      };
    });
  }, [trades]);

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Strategy Analytics</h1>

      <div className="bg-white border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Strategy</th>
              <th className="px-4 py-2 text-right">Trades</th>
              <th className="px-4 py-2 text-right">Win %</th>
              <th className="px-4 py-2 text-right">Avg R</th>
              <th className="px-4 py-2 text-right">Profit Factor</th>
              <th className="px-4 py-2 text-right">Net R</th>
            </tr>
          </thead>
          <tbody>
            {strategyStats.map((s) => (
              <tr key={s.strategy} className="border-t">
                <td className="px-4 py-2 font-medium">{s.strategy}</td>
                <td className="px-4 py-2 text-right">{s.trades}</td>
                <td
                  className={`px-4 py-2 text-right font-semibold ${
                    s.winRate >= 50 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {s.winRate.toFixed(1)}%
                </td>
                <td
                  className={`px-4 py-2 text-right font-semibold ${
                    s.avgR >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {s.avgR.toFixed(2)}
                </td>
                <td
                  className={`px-4 py-2 text-right font-semibold ${
                    s.profitFactor >= 1 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2)}
                </td>
                <td
                  className={`px-4 py-2 text-right font-semibold ${
                    s.netR >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {s.netR.toFixed(2)}
                </td>
              </tr>
            ))}

            {strategyStats.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No strategy data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
``
