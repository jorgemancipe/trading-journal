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

  /* ---------- system state ---------- */

  const avg = avgR(validTrades);
  const recent = avgR(validTrades.slice(-20));
  const curve = equity(validTrades);
  const dd = maxDD(curve);

  /* ---------- regime ---------- */

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

  /* ---------- grading logic ---------- */

  function gradeTrade(t: any) {
    const strategy = t.strategy || "";

    // 🚨 F-grade (should NOT trade)
    if (regime === "DANGER" || !allowedStrategies.includes(strategy)) {
      return {
        grade: "F",
        color: "text-red-700",
        reason: "Trade violates system rules"
      };
    }

    // ⚠️ B-grade (okay but reduced)
    if (regime === "CHOPPY") {
      return {
        grade: "B",
        color: "text-yellow-600",
        reason: "Trade allowed but conditions not ideal"
      };
    }

    // ✅ A-grade (perfect)
    return {
      grade: "A",
      color: "text-green-700",
      reason: "Trade aligned with system"
    };
  }

  const gradedTrades = validTrades.map(t => ({
    ...t,
    grade: gradeTrade(t),
  }));

  /* ---------- stats ---------- */

  const Acount = gradedTrades.filter(t => t.grade.grade === "A").length;
  const Bcount = gradedTrades.filter(t => t.grade.grade === "B").length;
  const Fcount = gradedTrades.filter(t => t.grade.grade === "F").length;

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-6xl">

      <h1 className="text-3xl font-bold mb-6">
        🎯 Trade Grading System
      </h1>

      {/* System */}
      <div className="bg-white border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">System State</h2>
        <div>Regime: {regime}</div>
        <div>Avg R: {avg.toFixed(2)}</div>
        <div>Drawdown: {(dd * 100).toFixed(1)}%</div>
      </div>

      {/* Summary */}
      <div className="bg-white border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Grade Summary</h2>

        <div className="text-green-700">A: {Acount}</div>
        <div className="text-yellow-600">B: {Bcount}</div>
        <div className="text-red-700">F: {Fcount}</div>
      </div>

      {/* Trade Table */}
      <div className="bg-white border p-4 rounded">

        <h2 className="font-semibold mb-3">Trade Evaluation</h2>

        {gradedTrades.length === 0 ? (
          <p>No trades available</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left">Strategy</th>
                <th>Result</th>
                <th>Grade</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {gradedTrades.map((t, i) => (
                <tr key={i} className="border-b">
                  <td>{t.strategy}</td>
                  <td>{t.profit.toFixed(2)}</td>
                  <td className={t.grade.color}>
                    {t.grade.grade}
                  </td>
                  <td>{t.grade.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

    </main>
  );
}
``
