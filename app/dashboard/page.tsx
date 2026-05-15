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
  return trades.map((t) => (e += t.profit));
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

function winRate(trades: { profit: number }[]) {
  if (!trades.length) return 0;
  return trades.filter(t => t.profit > 0).length / trades.length;
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ---------- system state ---------- */

  const avg = avgR(validTrades);
  const recent = avgR(validTrades.slice(-20));
  const curve = equity(validTrades);
  const dd = maxDD(curve);

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

  /* ---------- grading ---------- */

  function gradeTrade(t: any) {
    const strat = t.strategy || "";

    if (regime === "DANGER" || !allowedStrategies.includes(strat)) {
      return { grade: "F", reason: "Rule violation / wrong regime" };
    }

    if (regime === "CHOPPY") {
      return { grade: "B", reason: "Allowed but not ideal" };
    }

    return { grade: "A", reason: "Optimal trade" };
  }

  const graded = validTrades.map(t => {
    const g = gradeTrade(t);
    return { ...t, grade: g.grade, reason: g.reason };
  });

  /* ---------- discipline score ---------- */

  const total = graded.length;
  const F = graded.filter(t => t.grade === "F");

  const fRate = total > 0 ? F.length / total : 0;

  const absTotal = graded.reduce((s, t) => s + Math.abs(t.profit), 0);
  const absF = F.reduce((s, t) => s + Math.abs(t.profit), 0);

  const taxRatio = absTotal > 0 ? absF / absTotal : 0;

  let score = 100 - (70 * fRate + 30 * taxRatio);
  score = Math.max(0, Math.min(100, score));

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-6xl">

      <h1 className="text-3xl font-bold mb-6">
        🧭 Discipline Score
      </h1>

      {/* System */}
      <div className="bg-white border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">System</h2>
        <div>Regime: {regime}</div>
        <div>Avg R: {avg.toFixed(2)}</div>
        <div>Drawdown: {(dd * 100).toFixed(1)}%</div>
      </div>

      {/* Score */}
      <div className="bg-white border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Discipline Score</h2>

        <div className="text-2xl font-bold">
          {score.toFixed(0)} / 100
        </div>

        <div className="text-sm text-gray-600 mt-2">
          F-rate: {(fRate * 100).toFixed(1)}% | Discipline tax: {(taxRatio * 100).toFixed(1)}%
        </div>
      </div>

      {/* Trades */}
      <div className="bg-white border p-4 rounded">

        <h2 className="font-semibold mb-3">Trades</h2>

        {graded.length === 0 ? (
          <p>No trades</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left">Strategy</th>
                <th>Profit</th>
                <th>Grade</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {graded.map((t, i) => (
                <tr key={i} className="border-b">
                  <td>{t.strategy}</td>
                  <td>{t.profit.toFixed(2)}</td>
                  <td>{t.grade}</td>
                  <td>{t.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

    </main>
  );
}
