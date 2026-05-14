"use client";

import { useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";

/* ───────────────── HELPERS ───────────────── */

function calculateMaxDrawdown(trades: { profit: number }[]) {
  let equity = 0;
  let peak = 0;
  let maxDD = 0;
  for (const t of trades) {
    equity += t.profit;
    peak = Math.max(peak, equity);
    maxDD = Math.max(maxDD, peak - equity);
  }
  return maxDD;
}

function calculateStreaks(trades: { profit: number }[]) {
  let winStreak = 0;
  let lossStreak = 0;
  let maxWin = 0;
  let maxLoss = 0;

  for (const t of trades) {
    if (t.profit > 0) {
      winStreak++;
      lossStreak = 0;
    } else if (t.profit < 0) {
      lossStreak++;
      winStreak = 0;
    } else {
      winStreak = 0;
      lossStreak = 0;
    }
    maxWin = Math.max(maxWin, winStreak);
    maxLoss = Math.max(maxLoss, lossStreak);
  }

  return { maxWin, maxLoss };
}

function buildRDistribution(rs: number[]) {
  const buckets = [
    { label: "< -2R", min: -Infinity, max: -2 },
    { label: "-2R to -1R", min: -2, max: -1 },
    { label: "-1R to 0R", min: -1, max: 0 },
    { label: "0R to 1R", min: 0, max: 1 },
    { label: "1R to 2R", min: 1, max: 2 },
    { label: "> 2R", min: 2, max: Infinity },
  ];

  return buckets.map((b) => ({
    label: b.label,
    count: rs.filter((r) => r >= b.min && r < b.max).length,
  }));
}

/* ───────────────── PAGE ───────────────── */

export default function DashboardPage() {
  const { trades } = useTrades();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (t.risk <= 0) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
  }, [trades, dateFrom, dateTo]);

  const metrics = useMemo(() => {
    const rs = filteredTrades.map((t) => t.profit / t.risk);

    const wins = filteredTrades.filter((t) => t.profit > 0);
    const losses = filteredTrades.filter((t) => t.profit < 0);

    const grossProfit = wins.reduce((s, t) => s + t.profit, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.profit, 0));

    const profitFactor =
      grossLoss === 0
        ? grossProfit > 0
          ? Infinity
          : 0
        : grossProfit / grossLoss;

    const avgR = rs.length ? rs.reduce((s, r) => s + r, 0) / rs.length : 0;

    const largestRWin =
      rs.length > 0 ? Math.max(...rs) : 0;

    const largestRLoss =
      rs.length > 0 ? Math.min(...rs) : 0;

    return {
      trades: filteredTrades.length,
      profitFactor,
      avgR,
      largestRWin,
      largestRLoss,
      maxDrawdown: calculateMaxDrawdown(filteredTrades),
      streaks: calculateStreaks(filteredTrades),
      rDist: buildRDistribution(rs),
    };
  }, [filteredTrades]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 border rounded flex gap-4">
        <div>
          <label className="text-xs">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <Metric label="Trades" value={metrics.trades} />
        <Metric
          label="Profit Factor"
          value={
            metrics.profitFactor === Infinity
              ? "∞"
              : metrics.profitFactor.toFixed(2)
          }
          positive={metrics.profitFactor >= 1}
          negative={metrics.profitFactor < 1}
        />
        <Metric
          label="Average R"
          value={metrics.avgR.toFixed(2)}
          positive={metrics.avgR >= 0}
          negative={metrics.avgR < 0}
        />
        <Metric
          label="Largest R Win"
          value={metrics.largestRWin.toFixed(2)}
          positive
        />
        <Metric
          label="Largest R Loss"
          value={metrics.largestRLoss.toFixed(2)}
          negative
        />
        <Metric
          label="Max Drawdown"
          value={`$${metrics.maxDrawdown.toFixed(2)}`}
          negative
        />
      </div>

      {/* R Distribution */}
      <div className="bg-white border rounded p-4">
        <h2 className="text-lg font-semibold mb-4">R Distribution</h2>
        <div className="flex items-end gap-4 h-48">
          {metrics.rDist.map((b) => (
            <div key={b.label} className="flex flex-col items-center w-16">
              <div
                className="bg-blue-600 w-full"
                style={{
                  height: `${b.count * 20}px`,
                  minHeight: b.count > 0 ? 8 : 0,
                }}
              />
              <div className="text-xs mt-2 text-center">{b.label}</div>
              <div className="text-xs text-gray-500">{b.count}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

/* ───────────────── METRIC CARD ───────────────── */

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
      <div className="text-sm text-gray-500">{label}</div>
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
