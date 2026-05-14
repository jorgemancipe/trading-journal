"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";
import EquityCurve from "../components/EquityCurve";
import WinLossChart from "../components/WinLossChart";
import PLHistogram from "../components/PLHistogram";

/** Max Drawdown = biggest peak-to-trough drop in cumulative P/L */
function calculateMaxDrawdown(trades: { profit: number }[]) {
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;

  for (const t of trades) {
    equity += t.profit;

    if (equity > peak) {
      peak = equity;
    }

    const drawdown = peak - equity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/** Export dashboard metrics to CSV */
function exportDashboardMetrics(metrics: {
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  maxDrawdown: number;
}) {
  const rows = [
    ["Metric", "Value"],
    ["Total Trades", String(metrics.totalTrades)],
    ["Win Rate (%)", metrics.winRate.toFixed(2)],
    ["Average Win", metrics.avgWin.toFixed(2)],
    ["Average Loss", metrics.avgLoss.toFixed(2)],
    ["Expectancy", metrics.expectancy.toFixed(2)],
    ["Max Drawdown", metrics.maxDrawdown.toFixed(2)],
  ];

  const csv = rows.map((r) => r.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "dashboard-metrics.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

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

    const maxDrawdown = calculateMaxDrawdown(trades);

    return {
      totalTrades,
      winRate,
      avgWin,
      avgLoss,
      expectancy,
      maxDrawdown,
    };
  }, [trades]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <button
          onClick={() => exportDashboardMetrics(metrics)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition"
        >
          Export Metrics CSV
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
        <Metric
          label="Max Drawdown"
          value={`-$${metrics.maxDrawdown.toFixed(2)}`}
          negative
        />
      </div>

      {/* Top charts row */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EquityCurve trades={trades} />
        <WinLossChart trades={trades} />
      </div>

      {/* Histogram full width */}
      <div className="mt-6">
        <PLHistogram trades={trades} />
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
          positive ? "text-green-700" : negative ? "text-red-700" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
