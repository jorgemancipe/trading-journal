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

  /* ---------- trade gate ---------- */

  function evaluateTrade(t: any) {
    const strategy = t.strategy || "";

    if (regime === "DANGER") {
      return {
        status: "BLOCKED",
        size: 0,
        reason: "System unsafe (drawdown or negative edge)"
      };
    }

    if (!allowedStrategies.includes(strategy)) {
      return {
        status: "BLOCKED",
        size: 0,
        reason: "Wrong strategy for current regime"
      };
    }

    if (regime === "CHOPPY") {
      return {
        status: "REDUCED",
        size: 0.5,
        reason: "Choppy market requires smaller size"
      };
    }

    return {
      status: "APPROVED",
      size: 1,
      reason: "Optimal conditions"
    };
  }

  const evaluated = validTrades.map(t => ({
    ...t,
    decision: evaluateTrade(t),
  }));

  /* ---------- counts ---------- */

  const approved = evaluated.filter(t => t.decision.status === "APPROVED").length;
  const reduced = evaluated.filter(t => t.decision.status === "REDUCED").length;
  const blocked = evaluated.filter(t => t.decision.status === "BLOCKED").length;

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-6xl">

      <h1 className="text-3xl font-bold mb-6">
        🤖 Auto‑Filled Trade Gate
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

        <h2 className="font-semibold mb-2">Execution Summary</h2>

        <div className="text-green-700">✅ Approved: {approved}</div>
        <div className="text-yellow-600">⚠️ Reduced: {reduced}</div>
        <div className="text-red-700">❌ Blocked: {blocked}</div>

      </div>

      {/* Trade list */}
      <div className="bg-white border p-4 rounded">

        <h2 className="font-semibold mb-3">
          Trade Decisions
        </h2>

        {evaluated.length === 0 ? (
          <p>No trades available</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left">Strategy</th>
                <th className="text-left">Result</th>
                <th className="text-left">Decision</th>
                <th className="text-left">Reason</th>
              </tr>
            </thead>
            <tbody>
              {evaluated.map((t, i) => (
                <tr key={i} className="border-b">
                  <td>{t.strategy}</td>
                  <td>{t.profit.toFixed(2)}</td>
                  <td
                    className={
                      t.decision.status === "APPROVED"
                        ? "text-green-700"
                        : t.decision.status === "REDUCED"
                        ? "text-yellow-600"
                        : "text-red-700"
                    }
                  >
                    {t.decision.status}
                  </td>
                  <td>{t.decision.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

    </main>
  );
}
