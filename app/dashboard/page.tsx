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
  let peak = 0,
    max = 0;
  for (const v of curve) {
    if (v > peak) peak = v;
    const dd = (peak - v) / (peak || 1);
    if (dd > max) max = dd;
  }
  return max;
}

function winRate(trades: { profit: number }[]) {
  if (!trades.length) return 0;
  return trades.filter((t) => t.profit > 0).length / trades.length;
}

type Grade = "A" | "B" | "F";

type GradeInfo = {
  grade: Grade;
  reason: string;
};

type GradeStats = {
  grade: Grade;
  count: number;
  totalPnL: number;
  avgPnL: number;
  avgR: number;
  winRate: number; // 0..1
};

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const validTrades = useMemo(() => trades.filter((t) => t.risk > 0), [trades]);

  /* ---------- system state (same as before) ---------- */

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

  function gradeTrade(t: any): GradeInfo {
    const strategy = t.strategy || "";

    // F: violates system rules
    if (regime === "DANGER" || !allowedStrategies.includes(strategy)) {
      return { grade: "F", reason: "Violates system rules / wrong regime" };
    }

    // B: allowed but suboptimal
    if (regime === "CHOPPY") {
      return { grade: "B", reason: "Allowed but conditions not ideal (choppy)" };
    }

    // A: aligned with system
    return { grade: "A", reason: "Aligned with system conditions" };
  }

  const gradedTrades = useMemo(() => {
    return validTrades.map((t) => {
      const g = gradeTrade(t);
      const r = t.risk > 0 ? t.profit / t.risk : 0;
      return { ...t, grade: g.grade, reason: g.reason, r };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validTrades, regime, allowedStrategies.join("|")]);

  /* ---------- performance by grade ---------- */

  const statsByGrade = useMemo<GradeStats[]>(() => {
    const grades: Grade[] = ["A", "B", "F"];

    return grades.map((g) => {
      const bucket = gradedTrades.filter((t) => t.grade === g);

      const totalPnL = bucket.reduce((s, t) => s + t.profit, 0);
      const avgPnL = bucket.length ? totalPnL / bucket.length : 0;
      const avgRVal = bucket.length ? bucket.reduce((s, t) => s + t.r, 0) / bucket.length : 0;
      const wr = winRate(bucket);

      return {
        grade: g,
        count: bucket.length,
        totalPnL,
        avgPnL,
        avgR: avgRVal,
        winRate: wr,
      };
    });
  }, [gradedTrades]);

  const pnlF = statsByGrade.find((s) => s.grade === "F")?.totalPnL ?? 0;

  const tradesNoF = useMemo(() => gradedTrades.filter((t) => t.grade !== "F"), [gradedTrades]);
  const equityAll = useMemo(() => equity(gradedTrades), [gradedTrades]);
  const equityNoF = useMemo(() => equity(tradesNoF), [tradesNoF]);

  const finalAll = equityAll[equityAll.length - 1] ?? 0;
  const finalNoF = equityNoF[equityNoF.length - 1] ?? 0;

  const disciplineTax = pnlF; // negative means you paid a cost

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">📊 Performance by Grade</h1>

      {/* System context */}
      <div className="bg-white border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">System Context</h2>
        <div>Regime: {regime}</div>
        <div>Avg R: {avg.toFixed(2)} | Recent Avg R: {recent.toFixed(2)}</div>
        <div>Drawdown: {(dd * 100).toFixed(1)}%</div>
        <div className="text-sm text-gray-600 mt-1">
          Allowed strategies: {allowedStrategies.length ? allowedStrategies.join(", ") : "None"}
        </div>
      </div>

      {/* Grade Stats */}
      <div className="bg-white border p-4 rounded mb-6">
        <h2 className="font-semibold mb-3">Grade Breakdown</h2>

        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left py-2">Grade</th>
              <th className="text-right py-2">Trades</th>
              <th className="text-right py-2">Total P/L</th>
              <th className="text-right py-2">Avg P/L</th>
              <th className="text-right py-2">Avg R</th>
              <th className="text-right py-2">Win %</th>
            </tr>
          </thead>
          <tbody>
            {statsByGrade.map((s) => (
              <tr key={s.grade} className="border-b">
                <td className="py-2 font-semibold">
                  {s.grade === "A" ? "🟢 A" : s.grade === "B" ? "🟡 B" : "🔴 F"}
                </td>
                <td className="text-right">{s.count}</td>
                <td
                  className={`text-right font-semibold ${
                    s.totalPnL >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {s.totalPnL.toFixed(2)}
                </td>
                <td className="text-right">{s.avgPnL.toFixed(2)}</td>
                <td
                  className={`text-right ${
                    s.avgR >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {s.avgR.toFixed(2)}
                </td>
                <td className="text-right">{(s.winRate * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Discipline Tax */}
      <div className="bg-white border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Discipline Tax</h2>
        <div className="text-sm text-gray-700">
          Total P/L from <strong>F trades</strong>:{" "}
          <span className={disciplineTax >= 0 ? "text-green-700" : "text-red-700"}>
            {disciplineTax.toFixed(2)}
          </span>
        </div>
        <div className="text-sm text-gray-700 mt-1">
          Final equity (all trades): <strong>{finalAll.toFixed(2)}</strong>
        </div>
        <div className="text-sm text-gray-700 mt-1">
          Final equity (without F trades):{" "}
          <strong className={finalNoF >= finalAll ? "text-green-700" : "text-red-700"}>
            {finalNoF.toFixed(2)}
          </strong>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          If F-trades are negative overall, removing them shows the “what if I followed the system” outcome.
        </p>
      </div>

      {/* Trade Table */}
