import EquityCurve from "../components/EquityCurve";
"use client";

import { useMemo } from "react";

/**
 * NOTE:
 * For now, this uses the same structure as trades.
 * In the next step we will lift this data into shared state.
 */

type Trade = {
  profit: number;
};

const sampleTrades: Trade[] = [
  { profit: 250 },
  { profit: -120 },
  { profit: 90 },
  { profit: -60 },
  { profit: 180 },
];

export default function DashboardPage() {
  const metrics = useMemo(() => {
    const totalTrades = sampleTrades.length;

    const wins = sampleTrades.filter((t) => t.profit > 0);
    const losses = sampleTrades.filter((t) => t.profit < 0);

    const winRate =
      totalTrades === 0 ? 0 : (wins.length / totalTrades) * 100;

    const avgWin =
      wins.length === 0
        ? 0
        : wins.reduce((sum, t) => sum + t.profit, 0) / wins.length;

    const avgLoss =
      losses.length === 0
        ? 0
        : losses.reduce((sum, t) => sum + t.profit, 0) / losses.length;

    // Expectancy = (WinRate * AvgWin) + (LossRate * AvgLoss)
    const expectancy =
      totalTrades === 0
        ? 0
        : (winRate / 100) * avgWin +
          ((100 - winRate) / 100) * avgLoss;

    return {
      totalTrades,
      winRate,
      avgWin,
      avgLoss,
      expectancy,
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Trades"
          value={metrics.totalTrades}
        />

        <MetricCard
          label="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
        />

        <MetricCard
          label="Avg Win"
          value={`$${metrics.avgWin.toFixed(2)}`}
          positive
        />

        <MetricCard
          label="Avg Loss"
          value={`$${metrics.avgLoss.toFixed(2)}`}
          negative
        />

        <MetricCard
          label="Expectancy"
          value={`$${metrics.expectancy.toFixed(2)}`}
          positive={metrics.expectancy >= 0}
          negative={metrics.expectancy < 0}
        />
        <div className="mt-8">
          <EquityCurve trades={trades} />
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: string | number;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="bg-white border rounded p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div
        className={`text-2xl font-semibold ${
          positive
            ? "text-green-700"
            : negative
            ? "text-red-700"
            : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
