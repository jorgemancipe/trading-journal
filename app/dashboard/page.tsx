"use client";

import { useMemo, useState } from "react";
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

function maxDD(curve: number[]) {
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

  const [strategyInput, setStrategyInput] = useState("ORB");

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ---------- system metrics ---------- */

  const avg = avgR(validTrades);
  const recent = avgR(validTrades.slice(-20));

  const curve = equity(validTrades);
  const dd = maxDD(curve);

  /* ---------- regime detection ---------- */

  let regime = "NEUTRAL";
  let allowedStrategies: string[] = [];

  if (avg <= 0 || dd >= 0.25) {
    regime = "DANGER";
    allowedStrategies = [];
  } else if (Math.abs(recent - avg) > 0.2 || dd >= 0.15) {
    regime = "CHOPPY";
    allowedStrategies = ["VWAP Reversion"];
  } else {
    regime = "TRENDING";
    allowedStrategies = ["ORB", "Momentum"];
  }

  /* ---------- trade gate logic ---------- */

  function evaluateTrade(strategy: string) {

    if (regime === "DANGER") {
      return {
        status: "BLOCKED",
        size: 0,
        reason: "System in danger state (drawdown or negative edge)"
      };
    }

    if (!allowedStrategies.includes(strategy)) {
      return {
        status: "BLOCKED",
        size: 0,
        reason: "Not allowed in current market regime"
      };
    }

    if (regime === "CHOPPY") {
      return {
        status: "REDUCED",
        size: 0.5,
        reason: "Choppy market — reduce exposure"
      };
    }

    return {
      status: "APPROVED",
      size: 1,
      reason: "System conditions optimal"
    };
  }

  const decision = evaluateTrade(strategyInput);

  /* ---------- UI colors ---------- */

  const statusColor =
    decision.status === "APPROVED"
      ? "bg-green-600"
      : decision.status === "REDUCED"
      ? "bg-yellow-500"
      : "bg-red-600";

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-5xl">

      <h1 className="text-3xl font-bold mb-6">
        🧠 Trade Gate UI
      </h1>

      {/* System State */}
      <div className="bg-white border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">System State</h2>

        <div>Regime: {regime}</div>
        <div>Avg R: {avg.toFixed(2)}</div>
        <div>Drawdown: {(dd * 100).toFixed(1)}%</div>
      </div>

      {/* Trade Input */}
      <div className="bg-white border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Trade Input</h2>

        <select
          value={strategyInput}
          onChange={(e) => setStrategyInput(e.target.value)}
          className="border px-2 py-1"
        >
          <option>ORB</option>
          <option>Momentum</option>
          <option>VWAP Reversion</option>
        </select>
      </div>

      {/* ✅ Trade Decision */}
      <div className={`${statusColor} text-white p-5 rounded mb-6`}>

        <div className="text-xl font-semibold">
          {decision.status}
        </div>

        <div className="mt-2">
          Size Multiplier: {decision.size}
        </div>

        <div className="text-sm mt-2">
          {decision.reason}
        </div>

      </div>

      {/* Allowed strategies */}
      <div className="bg-white border p-4 rounded">
        <h2 className="font-semibold mb-2">
          Allowed Strategies
        </h2>

        {allowedStrategies.length > 0
          ? allowedStrategies.join(", ")
          : "🚫 No trading allowed"}
      </div>

    </main>
  );
}
