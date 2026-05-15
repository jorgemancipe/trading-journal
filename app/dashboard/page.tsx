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
  let peak = 0;
  let maxDD = 0;

  for (const v of curve) {
    if (v > peak) peak = v;
    const dd = (peak - v) / (peak || 1);
    if (dd > maxDD) maxDD = dd;
  }

  return maxDD;
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

  /* ---------- regime detection ---------- */

  let regime = "";
  let color = "";
  let guidance = "";

  // 🚨 DANGER
  if (avg <= 0 || dd >= 0.25) {
    regime = "DANGER MARKET";
    color = "bg-red-600";
    guidance = "STOP trading — system conditions are unsafe.";
  }

  // ⚠️ CHOPPING
  else if (Math.abs(recent - avg) > 0.2 || dd >= 0.15) {
    regime = "CHOPPY MARKET";
    color = "bg-yellow-500";
    guidance = "Reduce size — trades are inconsistent.";
  }

  // ✅ TRENDING
  else if (avg > 0.2 && recent >= avg && dd < 0.1) {
    regime = "TRENDING MARKET";
    color = "bg-green-600";
    guidance = "Increase size — strong and stable edge.";
  }

  // DEFAULT
  else {
    regime = "NEUTRAL MARKET";
    color = "bg-gray-500";
    guidance = "Normal trading — no strong signals.";
  }

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">
        Market Regime Detection
      </h1>

      {/* Regime */}
      <div className={`${color} text-white p-5 rounded mb-6`}>
        <div className="text-xl font-semibold">
          {regime}
        </div>
        <div className="text-sm mt-1">
          {guidance}
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-white border rounded p-4 space-y-2">

        <h2 className="font-semibold">System Metrics</h2>

        <div>Avg R: {avg.toFixed(2)}</div>
        <div>Recent Avg R: {recent.toFixed(2)}</div>
        <div>Drawdown: {(dd * 100).toFixed(1)}%</div>

      </div>

      {/* Interpretation */}
      <div className="bg-white border rounded p-4 mt-6">

        <h2 className="font-semibold mb-2">
          How to Trade Each Regime
        </h2>

        <div className="text-sm space-y-1">
          <div>✅ TRENDING → Full size trades</div>
          <div>⚠️ CHOPPY → Half size / selective entries</div>
          <div>🚨 DANGER → No trades</div>
          <div>⚪ NEUTRAL → Regular size</div>
        </div>

      </div>

    </main>
  );
}
``
