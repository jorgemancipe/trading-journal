"use client";

import { useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";
import EquityCurve from "../components/EquityCurve";
import WinLossChart from "../components/WinLossChart";
import PLHistogram from "../components/PLHistogram";

/* ================= CSV HELPERS ================= */

function timestampString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function csvCell(v: unknown) {
  if (v === null || v === undefined) return '""';
  return `"${String(v).replace(/"/g, '""')}"`;
}

function buildCSV(rows: unknown[][]) {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

function downloadCSV(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ================= METRIC HELPERS ================= */

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

/* ================= PAGE ================= */

export default function DashboardPage() {
  const { trades } = useTrades();

  /* Date filters */
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
  }, [trades, dateFrom, dateTo]);

  const metrics = useMemo(() => {
    const totalTrades = filteredTrades.length;
    const wins = filteredTrades.filter((t) => t.profit > 0);
    const losses = filteredTrades.filter((t) => t.profit < 0);

    const grossProfit = wins.reduce((s, t) => s + t.profit, 0);
    const grossLoss = Math.abs(
      losses.reduce((s, t) => s + t.profit, 0)
    );

    const profitFactor =
      grossLoss === 0
        ? grossProfit > 0
          ? Infinity
          : 0
        : grossProfit / grossLoss;

    const winRate =
      totalTrades === 0 ? 0 : (wins.length / totalTrades) * 100;

    const avgWin =
      wins.length === 0 ? 0 : grossProfit / wins.length;

    const avgLoss =
      losses.length === 0
        ? 0
        : losses.reduce((s, t) => s + t.profit, 0) / losses.length;

    const expectancy =
      totalTrades === 0
        ? 0
        : (winRate / 100) * avgWin +
          ((100 - winRate) / 100) * avgLoss;

    const largestWin =
      wins.length === 0 ? 0 : Math.max(...wins.map((t) => t.profit));

    const largestLoss =
      losses.length === 0
        ? 0
        : Math.min(...losses.map((t) => t.profit));

    const maxDrawdown = calculateMaxDrawdown(filteredTrades);
    const filteredPL = filteredTrades.reduce(
      (s, t) => s + t.profit,
      0
    );

    return {
      totalTrades,
      winRate,
      avgWin,
      avgLoss,
      expectancy,
      profitFactor,
      largestWin,
      largestLoss,
      maxDrawdown,
      filteredPL,
    };
  }, [filteredTrades]);

  /* ================= EXPORT ================= */

  function exportMetricsCSV() {
    const rows: unknown[][] = [
      ["Filter Summary", ""],
      ["Date From", dateFrom || "All"],
      ["Date To", dateTo || "All"],
      ["Filtered Trades", metrics.totalTrades],
      ["Filtered P/L", metrics.filteredPL.toFixed(2)],
      ["Exported At", timestampString()],
      ["", ""],

      ["Metric", "Value"],
      ["Total Trades", metrics.totalTrades],
      ["Win Rate (%)", metrics.winRate.toFixed(2)],
      [
        "Profit Factor",
        metrics.profitFactor === Infinity
          ? "∞"
          : metrics.profitFactor.toFixed(2),
      ],
      ["Largest Win", metrics.largestWin.toFixed(2)],
      ["Largest Loss", metrics.largestLoss.toFixed(2)],
      ["Average Win", metrics.avgWin.toFixed(2)],
      ["Average Loss", metrics.avgLoss.toFixed(2)],
      ["Expectancy", metrics.expectancy.toFixed(2)],
      ["Max Drawdown", metrics.maxDrawdown.toFixed(2)],
    ];

    downloadCSV(
      buildCSV(rows),
      `dashboard-metrics-${timestampString()}.csv`
    );
  }

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <button
          onClick={exportMetricsCSV}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
        >
          Export Metrics CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white border rounded p-4 flex gap-4">
        <div>
          <label className="text-xs text-gray-600">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4">
        <Metric label="Total Trades" value={metrics.totalTrades} />
        <Metric label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} />
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
          label="Largest Win"
          value={`$${metrics.largestWin.toFixed(2)}`}
          positive
        />
        <Metric
          label="Largest Loss"
          value={`$${metrics.largestLoss.toFixed(2)}`}
          negative
        />
        <Metric label="Avg Win" value={`$${metrics.avgWin.toFixed(2)}`} positive />
        <Metric label="Avg Loss" value={`$${metrics.avgLoss.toFixed(2)}`} negative />
        <Metric
          label="Max Drawdown"
          value={`-$${metrics.maxDrawdown.toFixed(2)}`}
          negative
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EquityCurve trades={filteredTrades} />
        <WinLossChart trades={filteredTrades} />
      </div>

      <div className="mt-6">
        <PLHistogram trades={filteredTrades} />
      </div>
    </main>
  );
}

/* ================= METRIC CARD ================= */

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
