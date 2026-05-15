"use client";

import { useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";

/* ---------- helpers ---------- */

function avgR(trades: { profit: number; risk: number }[]) {
  if (trades.length === 0) return 0;
  let sum = 0;
  for (const t of trades) sum += t.profit / t.risk;
  return sum / trades.length;
}

function winRate(trades: { profit: number }[]) {
  if (trades.length === 0) return 0;
  const wins = trades.filter(t => t.profit > 0).length;
  return wins / trades.length;
}

function equity(trades: { profit: number }[]) {
  let e = 0;
  return trades.map(t => (e += t.profit));
}

function maxDrawdown(trades: { profit: number }[]) {
  const curve = equity(trades);
  let peak = 0;
  let maxDD = 0;

  for (const v of curve) {
    if (v > peak) peak = v;
    const dd = peak - v;
    if (dd > maxDD) maxDD = dd;
  }

  return maxDD;
}

function riskOfRuin(win: number, avgWin: number, avgLoss: number) {
  if (avgLoss === 0) return 0;

  const b = avgWin / Math.abs(avgLoss);
  const p = win;
  const q = 1 - p;

  if (b <= 0 || p <= 0 || p >= 1) return 1;

  return Math.pow(q / (p * b), 1);
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();
  const [minTrades, setMinTrades] = useState(5);

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ---------- metrics ---------- */

  const avg = avgR(validTrades);
  const wr = winRate(validTrades);

  const wins = validTrades.filter(t => t.profit > 0);
  const losses = validTrades.filter(t => t.profit < 0);

  const avgWin =
    wins.length === 0
      ? 0
      : wins.reduce((s, t) => s + t.profit / t.risk, 0) / wins.length;

  const avgLoss =
    losses.length === 0
      ? 0
      : losses.reduce((s, t) => s + t.profit / t.risk, 0) / losses.length;

  const drawdown = maxDrawdown(validTrades);

  const ruin = riskOfRuin(wr, avgWin, avgLoss);

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">
        Risk Engine Dashboard
      </h1>

      {/* Control */}
      <div className="bg-white border rounded p-4 mb-6">
        <label>Min trades: {minTrades}</label>
        <input
          type="range"
          min={1}
          max={20}
          value={minTrades}
          onChange={e => setMinTrades(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Core metrics */}
      <div className="bg-white border rounded p-4 mb-6 space-y-2">
        <h2 className="font-semibold">Performance</h2>

        <div>Avg R: {avg.toFixed(2)}</div>
        <div>Win rate: {(wr * 100).toFixed(1)}%</div>
        <div>Avg Win R: {avgWin.toFixed(2)}</div>
        <div>Avg Loss R: {avgLoss.toFixed(2)}</div>
      </div>

      {/* Risk metrics */}
      <div className="bg-white border rounded p-4">

        <h2 className="font-semibold mb-3">Risk Analysis</h2>

        <div className="space-y-2 text-sm">

          <div className="flex justify-between">
            <span>Max Drawdown:</span>
            <span className="text-red-700">
              {drawdown.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Risk of Ruin:</span>
            <span
              className={
                ruin < 0.2
                  ? "text-green-700"
                  : ruin < 0.5
                  ? "text-yellow-600"
                  : "text-red-700"
              }
            >
              {(ruin * 100).toFixed(1)}%
            </span>
          </div>

        </div>

        <p className="text-xs text-gray-500 mt-3">
          Risk of ruin is an approximation based on your win rate and R distribution.
        </p>

      </div>

    </main>
  );
}
