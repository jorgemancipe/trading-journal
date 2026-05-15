"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";

/* ---------- helpers ---------- */

function avgR(trades: { profit: number; risk: number }[]) {
  if (!trades.length) return 0;
  let sum = 0;
  for (const t of trades) sum += t.profit / t.risk;
  return sum / trades.length;
}

function winRate(trades: { profit: number }[]) {
  if (!trades.length) return 0;
  return trades.filter(t => t.profit > 0).length / trades.length;
}

function equity(trades: { profit: number }[]) {
  let e = 0;
  return trades.map(t => (e += t.profit));
}

function maxDrawdown(curve: number[]) {
  let peak = 0;
  let maxDD = 0;

  for (const v of curve) {
    if (v > peak) peak = v;
    const dd = (peak - v) / (peak || 1);
    if (dd > maxDD) maxDD = dd;
  }

  return maxDD;
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

/* ✅ Kelly */
function kelly(win: number, avgWin: number, avgLoss: number) {
  if (avgLoss === 0) return 0;

  const b = avgWin / avgLoss;
  const p = win;
  const q = 1 - p;

  const f = (b * p - q) / b;

  return Math.max(0, f);
}

/* ✅ Adaptive drawdown scaling */
function riskMultiplier(drawdown: number) {
  if (drawdown < 0.1) return 1;
  if (drawdown < 0.2) return 0.75;
  if (drawdown < 0.3) return 0.5;
  return 0.25;
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ----- core metrics ----- */
  const avg = avgR(validTrades);
  const wr = winRate(validTrades);

  const { avgWin, avgLoss } = avgWinLoss(validTrades);

  const curve = equity(validTrades);
  const dd = maxDrawdown(curve);

  /* ----- sizing ----- */
  const kellySize = kelly(wr, avgWin, avgLoss);
  const adaptiveSize = kellySize * riskMultiplier(dd);

  /* ----- system state ----- */

  const hasEdge = avg > 0;
  const safeDrawdown = dd < 0.25;

  const systemON = hasEdge && safeDrawdown;

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-5xl">

      <h1 className="text-3xl font-bold mb-6">
        ✅ Production Trading System
      </h1>

      {/* Live Status */}
      <div className="bg-white border rounded p-4 mb-6">

        <h2 className="font-semibold mb-3">System Status</h2>

        <div className="text-lg font-bold">
          {systemON ? (
            <span className="text-green-700">
              ✅ SYSTEM ON (TRADE)
            </span>
          ) : (
            <span className="text-red-700">
              ❌ SYSTEM OFF (NO TRADE)
            </span>
          )}
        </div>

        <div className="mt-2 text-sm">
          Edge: {hasEdge ? "Positive" : "Negative"}  
          | Drawdown Safe: {safeDrawdown ? "Yes" : "No"}
        </div>

      </div>

      {/* Metrics */}
      <div className="bg-white border rounded p-4 mb-6">

        <h2 className="font-semibold mb-2">Performance</h2>

        <div>Avg R: {avg.toFixed(2)}</div>
        <div>Win Rate: {(wr * 100).toFixed(1)}%</div>
        <div>Max Drawdown: {(dd * 100).toFixed(1)}%</div>

      </div>

      {/* Position Sizing */}
      <div className="bg-white border rounded p-4 mb-6">

        <h2 className="font-semibold mb-3">
          Position Sizing (Live)
        </h2>

        <div className="space-y-2 text-sm">

          <div className="flex justify-between">
            <span>Kelly:</span>
            <span>{(kellySize * 100).toFixed(1)}%</span>
          </div>

          <div className="flex justify-between">
            <span>Adaptive Size:</span>
            <span className="text-green-700">
              {(adaptiveSize * 100).toFixed(1)}%
            </span>
          </div>

        </div>

      </div>

      {/* Risk */}
      <div className="bg-white border rounded p-4">

        <h2 className="font-semibold mb-2">Risk Control</h2>

        <div className="text-sm space-y-1">

          <div>
            ❌ Stop trading if Avg R ≤ 0
          </div>

          <div>
            ❌ Stop trading if Drawdown ≥ 25%
          </div>

          <div>
            ✅ Reduce size dynamically during drawdowns
          </div>

        </div>

      </div>

    </main>
  );
}
