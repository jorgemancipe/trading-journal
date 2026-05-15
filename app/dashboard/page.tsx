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

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ---------- system stats ---------- */

  const avg = avgR(validTrades);
  const recent = avgR(validTrades.slice(-20));

  const curve = equity(validTrades);
  const dd = maxDD(curve);

  /* ---------- regime ---------- */

  let regime = "NEUTRAL";

  if (avg <= 0 || dd >= 0.25) regime = "DANGER";
  else if (Math.abs(recent - avg) > 0.2 || dd >= 0.15) regime = "CHOPPY";
  else if (avg > 0.2 && recent >= avg && dd < 0.1) regime = "TRENDING";

  /* ---------- allowed strategies ---------- */

  const allowedStrategies =
    regime === "TRENDING"
      ? ["ORB", "Momentum"]
      : regime === "CHOPPY"
      ? ["VWAP Reversion"]
      : [];

  /* ---------- execution engine ---------- */

  function evaluateTrade(trade: any) {
    const strategy = trade.strategy || "Unknown";

    // ❌ FULL BLOCK
    if (regime === "DANGER") {
      return { status: "BLOCKED", size: 0 };
    }

    // ❌ STRATEGY BLOCK
    if (!allowedStrategies.includes(strategy)) {
      return { status: "BLOCKED", size: 0 };
    }

    // ⚠️ REDUCE SIZE
    if (regime === "CHOPPY") {
      return { status: "REDUCED", size: 0.5 };
    }

    // ✅ FULL APPROVE
    return { status: "APPROVED", size: 1.0 };
  }

  const evaluatedTrades = validTrades.map(t => ({
    ...t,
    decision: evaluateTrade(t),
  }));

  const blocked = evaluatedTrades.filter(t => t.decision.status === "BLOCKED").length;
  const reduced = evaluatedTrades.filter(t => t.decision.status === "REDUCED").length;
  const approved = evaluatedTrades.filter(t => t.decision.status === "APPROVED").length;

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-5xl">

      <h1 className="text-3xl font-bold mb-6">
        ⚙️ Auto Execution Engine
      </h1>

      {/* System Status */}
      <div className="bg-white border p-4 rounded mb-6">

