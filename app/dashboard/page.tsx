"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";

/* ---------- helpers ---------- */

function avgR(trades: { profit: number; risk: number }[]) {
  if (!trades.length) return 0;
  return trades.reduce((s, t) => s + t.profit / t.risk, 0) / trades.length;
}

function equity(trades: { profit: number }[]) {
  let e = 0;
  return trades.map(t => (e += t.profit));
}

function maxDrawdown(curve: number[]) {
  let peak = 0, max = 0;
  for (const v of curve) {
    if (v > peak) peak = v;
    const dd = (peak - v) / (peak || 1);
    if (dd > max) max = dd;
  }
  return max;
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ---------- metrics ---------- */

  const avg = avgR(validTrades);
  const recent = avgR(validTrades.slice(-20));

  const curve = equity(validTrades);
  const dd = maxDrawdown(curve);

  /* ---------- regime ---------- */

  let regime = "";
  let color = "";
  let allowedStrategies: string[] = [];

  if (avg <= 0 || dd >= 0.25) {
    regime = "DANGER";
    color = "bg-red-600";
    allowedStrategies = [];
  }

  else if (Math.abs(recent - avg) > 0.2 || dd >= 0.15) {
    regime = "CHOPPY";
    color = "bg-yellow-500";
    allowedStrategies = ["VWAP Reversion"];
  }

  else {
    regime = "TRENDING";
    color = "bg-green-600";
    allowedStrategies = ["ORB", "Momentum"];
  }

  /* ---------- strategy enforcement ---------- */

  const tradeAllowed = (strategy: string) => {
    if (allowedStrategies.length === 0) return false;
    return allowedStrategies.includes(strategy);
  };

  const blockedTrades = validTrades.filter(
    t => !tradeAllowed(t.strategy || "")
  );

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">
        Strategy by Market Regime
      </h1>

      {/* Regime */}
      <div className={`${color} text-white p-5 rounded mb-6`}>
        <div className="text-xl font-semibold">
          {regime} MARKET
        </div>

        <div className="text-sm mt-1">
          Allowed strategies:
          {" "}
          {allowedStrategies.length > 0
            ? allowedStrategies.join(", ")
            : "NONE"}
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-white border rounded p-4 mb-6 space-y-2">
        <h2 className="font-semibold">Metrics</h2>

        <div>Avg R: {avg.toFixed(2)}</div>
        <div>Recent Avg R: {recent.toFixed(2)}</div>
        <div>Drawdown: {(dd * 100).toFixed(1)}%</div>
      </div>

      {/* Strategy enforcement */}
      <div className="bg-white border rounded p-4">

        <h2 className="font-semibold mb-2">
          Strategy Control
        </h2>

        <div className="text-sm space-y-1">
          <div>Total trades: {validTrades.length}</div>
          <div>
            Blocked trades: {blockedTrades.length}
          </div>
        </div>

        {allowedStrategies.length === 0 && (
          <div className="text-red-700 mt-3 font-semibold">
            🚨 Trading Disabled
          </div>
        )}

      </div>

    </main>
  );
}
