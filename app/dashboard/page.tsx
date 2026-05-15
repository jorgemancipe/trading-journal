"use client";

import { useMemo } from "react";
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

function avgWinLoss(trades: { profit: number; risk: number }[]) {
  const wins = trades.filter(t => t.profit > 0);
  const losses = trades.filter(t => t.profit < 0);

  const avgWin =
    wins.length === 0
      ? 0
      : wins.reduce((s, t) => s + t.profit / t.risk, 0) / wins.length;

  const avgLoss =
    losses.length === 0
      ? 0
      : Math.abs(
          losses.reduce((s, t) => s + t.profit / t.risk, 0) / losses.length
        );

  return { avgWin, avgLoss };
}

/* ✅ Kelly-style sizing */
function kelly(win: number, avgWin: number, avgLoss: number) {
  if (avgLoss === 0) return 0;

  const b = avgWin / avgLoss;
  const p = win;
  const q = 1 - p;

  const f = (b * p - q) / b;

  return Math.max(0, f); // no negative sizing
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  const wr = winRate(validTrades);
  const avg = avgR(validTrades);
  const { avgWin, avgLoss } = avgWinLoss(validTrades);

  const kellyFraction = kelly(wr, avgWin, avgLoss);

  /* ✅ safer fractional sizing */
  const conservative = kellyFraction / 2;
  const ultraSafe = kellyFraction / 4;

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">
        Position Sizing Engine
      </h1>

      {/* Core stats */}
      <div className="bg-white border rounded p-4 mb-6 space-y-2">
        <h2 className="font-semibold">System Stats</h2>

        <div>Avg R: {avg.toFixed(2)}</div>
        <div>Win Rate: {(wr * 100).toFixed(1)}%</div>
        <div>Avg Win R: {avgWin.toFixed(2)}</div>
        <div>Avg Loss R: {avgLoss.toFixed(2)}</div>
      </div>

      {/* Sizing */}
      <div className="bg-white border rounded p-4 mb-6">

        <h2 className="font-semibold mb-3">
          Optimal Position Sizing (Kelly)
        </h2>

        <div className="space-y-2 text-sm">

          <div className="flex justify-between">
            <span>Full Kelly:</span>
            <span className="text-blue-700">
              {(kellyFraction * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between">
            <span>Half Kelly (recommended):</span>
            <span className="text-green-700">
              {(conservative * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between">
            <span>Quarter Kelly (safe):</span>
            <span className="text-gray-700">
              {(ultraSafe * 100).toFixed(1)}%
            </span>
          </div>

        </div>

        <p className="text-xs text-gray-500 mt-3">
          Kelly maximizes long‑term growth but can be aggressive. Most traders
          use half or quarter Kelly for stability.
        </p>
      </div>

      {/* Interpretation */}
      <div className="bg-white border rounded p-4">

        <h2 className="font-semibold mb-2">Interpretation</h2>

        <div className="text-sm space-y-1">
          <div>✅ Higher Kelly = stronger edge</div>
          <div>⚠️ Large Kelly = higher volatility</div>
          <div>❌ Kelly near 0 = no real edge</div>
        </div>

      </div>

    </main>
  );
}
