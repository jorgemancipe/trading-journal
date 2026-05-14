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
    if (equity > peak) peak = equity;

    const drawdown = peak - equity;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return maxDrawdown;
}

/** Timestamp like 2026-05-14_14-33-07 (local time) */
function timestampString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}`;
}

/** RFC4180-ish CSV escaping: wrap in quotes, escape quotes, preserve commas/newlines */
function csvCell(value: unknown) {
  if (value === null || value === undefined) return '""';
  const s = String(value).replace(/"/g, '""');
  return `"${s}"`;
}

function buildCSV(rows: unknown[][]) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

/** Shared downloader */
function downloadCSV(csvText: string, filename: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/** Export dashboard metrics to CSV (quoted + timestamp) */
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
    ["Total Trades", metrics.totalTrades],
    ["Win Rate (%)", metrics.winRate.toFixed(2)],
    ["Average Win", metrics.avgWin.toFixed(2)],
    ["Average Loss", metrics.avgLoss.toFixed(2)],
    ["Expectancy", metrics.expectancy.toFixed(2)],
    ["Max Drawdown", metrics.maxDrawdown.toFixed(2)],
  ];

  const csv = buildCSV(rows);
  downloadCSV(csv, `dashboard-metrics-${timestampString()}.csv`);
}

/** Export all trades to CSV (quoted + timestamp) */
function exportAllTrades(trades: any[]) {
  if (!trades || trades.length === 0) return;

  const rows: unknown[][] = [
    ["Date", "Symbol", "Side", "Quantity", "Entry", "Exit", "Profit"],
    ...trades.map((t) => [
      t.date ?? "",
      t.symbol ?? "",
      t.side ?? "",
      t.quantity ?? "",
      t.entry ?? "",
      t.exit ?? "",
      typeof t.profit === "number" ? t.profit.toFixed(2) : (t.profit ?? ""),
    ]),
  ];

  const csv = buildCSV(rows);
  downloadCSV(csv, `trades-${timestampString()}.csv`);
}

export default function DashboardPage() {
  const { trades } = useTrades();

  const metrics = useMemo(() => {
    const totalTrades = trades.length;
    const wins = trades.filter((t: any) => t.profit > 0);
    const losses = trades.filter((t: any) => t.profit < 0);

    const winRate = totalTrades === 0 ? 0 : (wins.length / totalTrades) * 100;

    const avgWin =
      wins.length === 0 ? 0 : wins.reduce((s: number, t: any) => s + t.profit, 0) / wins.length;

    const avgLoss =
      losses.length === 0 ? 0 : losses.reduce((s: number, t: any) => s + t.profit, 0) / losses.length;

    const expectancy =
      totalTrades === 0
        ? 0
        : (winRate / 100) * avgWin + ((100 - winRate) / 100) * avgLoss;

    const maxDrawdown = calculateMaxDrawdown(trades);

    return { totalTrades, winRate, avgWin, avgLoss, expectancy, maxDrawdown };
  }, [trades]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => exportDashboardMetrics(metrics)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition"
          >
            Export Metrics CSV
          </button>

          <button
            onClick={() => exportAllTrades(trades)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition"
            disabled={!trades || trades.length === 0}
            title={!trades || trades.length === 0 ? "No trades to export" : "Export all trades"}
          >
            Export Trades CSV
          </button>
        </div>
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
        <Metric label="Max Drawdown" value={`-$${metrics.maxDrawdown.toFixed(2)}`} negative />
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
      <div className={`text-2xl font-semibold ${positive ? "text-green-700" : negative ? "text-red-700" : ""}`}>
        {value}
      </div>
    </div>
  );
}
