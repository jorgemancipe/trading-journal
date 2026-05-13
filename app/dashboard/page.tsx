"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";
import EquityCurve from "../components/EquityCurve";
import WinLossChart from "../components/WinLossChart";
export default function DashboardPage() {
  const { trades } = useTrades();

  const metrics = useMemo(() => {
    const totalTrades = trades.length;
    const wins = trades.filter((t) => t.profit > 0);
    const losses = trades.filter((t) => t.profit < 0);

    const winRate =
      totalTrades === 0 ? 0 : (wins.length / totalTrades) * 100;

    const avgWin =
      wins.length === 0
        ? 0
        : wins.reduce((s, t) => s + t.profit, 0) / wins.length;

    const avgLoss =
      losses.length === 0
        ? 0
        : losses.reduce((s, t) => s + t.profit, 0) / losses.length;

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
  }, [trades]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Metric label="Total Trades" value={metrics.totalTrades} />
        <Metric label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} />
        <Metric label="Avg Win" value={`$${metrics.avgWin.toFixed(2)}`} positive />
        <Metric label="Avg Loss" value={`$${metrics.avgLoss.toFixed(2)}`} negative />
        <Metric
          label="Expectancy"
          value={`$${metrics.expectancy.toFixed(2)}`}
          positive={metrics.expectancy >= 0}
          negative={metrics.expectancy < 0}
        />
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
  <EquityCurve trades={trades} />
  <WinLossChart trades={trades} />
</div>
      <div className="mt-8">
        <EquityCurve trades={trades} />
      </div>
    </main>
  );
}

function Metric({
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
