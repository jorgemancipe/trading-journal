"use client";

/* ---------- helpers ---------- */
function avgR(trades: { profit: number; risk: number }[]) {
  if (!trades.length) return 0;
  return trades.reduce((s, t) => s + t.profit / t.risk, 0) / trades.length;
}

function equityCurve(trades: { profit: number }[]) {
  let e = 0;
  return trades.map((t) => (e += t.profit));
}

function maxDDFromEquity(curve: number[]) {
  let peak = 0;
  let maxDD = 0;
  for (const v of curve) {
    if (v > peak) peak = v;
    const dd = peak - v;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

function normalize(values: number[]) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return values.map((v, i) => ({
    x: i,
    y: 100 - ((v - min) / span) * 100,
  }));
}

function pointsAttr(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

type Grade = "A" | "B" | "F";

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const validTrades = useMemo(
    () => trades.filter((t) => t.risk > 0),
    [trades]
  );

  /* ---------- regime + allowed strategies (same spirit as your prior logic) ---------- */

  const avg = avgR(validTrades);
  const recent = avgR(validTrades.slice(-20));
  const dd = maxDDFromEquity(equityCurve(validTrades));

  let regime: "TRENDING" | "CHOPPY" | "DANGER" | "NEUTRAL" = "NEUTRAL";
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

  function gradeTrade(t: any): Grade {
    const strat = t.strategy || "";
    if (regime === "DANGER") return "F";
    if (!allowedStrategies.includes(strat)) return "F";
    if (regime === "CHOPPY") return "B";
    return "A";
  }

  const gradedTrades = useMemo(() => {
    return validTrades.map((t) => ({
      ...t,
      grade: gradeTrade(t),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validTrades, regime, allowedStrategies.join("|")]);

  /* ---------- buckets ---------- */

  const A = gradedTrades.filter((t) => t.grade === "A");
  const AB = gradedTrades.filter((t) => t.grade === "A" || t.grade === "B");
  const ALL = gradedTrades;

  /* ---------- curves ---------- */

  const curveA = equityCurve(A);
  const curveAB = equityCurve(AB);
  const curveALL = equityCurve(ALL);

  const pointsA = normalize(curveA);
  const pointsAB = normalize(curveAB);
  const pointsALL = normalize(curveALL);

  const width = Math.max(pointsA.length, pointsAB.length, pointsALL.length, 1);

  /* ---------- summary stats ---------- */

  const finalA = curveA[curveA.length - 1] ?? 0;
  const finalAB = curveAB[curveAB.length - 1] ?? 0;
  const finalALL = curveALL[curveALL.length - 1] ?? 0;

  const ddA = maxDDFromEquity(curveA);
  const ddAB = maxDDFromEquity(curveAB);
  const ddALL = maxDDFromEquity(curveALL);

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">📈 A‑Only Equity</h1>

      {/* Context */}
      <div className="bg-white border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Context</h2>
        <div>Regime: {regime}</div>
        <div className="text-sm text-gray-600 mt-1">
          Allowed strategies: {allowedStrategies.length ? allowedStrategies.join(", ") : "None"}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card
          title="A‑Only (Ideal)"
          color="text-green-700"
          final={finalA}
          dd={ddA}
          count={A.length}
        />
        <Card
          title="A + B (Acceptable)"
          color="text-yellow-700"
          final={finalAB}
          dd={ddAB}
          count={AB.length}
        />
        <Card
          title="All Trades (Includes F)"
          color="text-blue-700"
          final={finalALL}
          dd={ddALL}
          count={ALL.length}
        />
      </div>

      {/* Equity curves */}
      <div className="bg-white border p-4 rounded">
        <h2 className="font-semibold mb-2">Equity Curves (Normalized)</h2>

        <div className="flex gap-4 text-sm mb-3">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-600 inline-block" />
            A‑Only
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 inline-block" />
            A + B
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-600 inline-block" />
            All
          </span>
        </div>

        <svg viewBox={`0 0 ${width} 100`} className="w-full h-56">
          {/* All */}
          <polyline
            points={pointsAttr(pointsALL)}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
          />
          {/* A+B */}
          <polyline
            points={pointsAttr(pointsAB)}
            fill="none"
            stroke="#eab308"
            strokeWidth="2"
          />
          {/* A */}
          <polyline
            points={pointsAttr(pointsA)}
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
          />
        </svg>

        <p className="text-xs text-gray-500 mt-2">
          Curves are normalized (0–100) to compare shape/drawdown rather than absolute dollars.
        </p>
      </div>
    </main>
  );
}

/* ---------- components ---------- */

function Card({
  title,
  color,
  final,
  dd,
  count,
}: {
  title: string;
  color: string;
  final: number;
  dd: number;
  count: number;
}) {
  return (
    <div className="bg-white border rounded p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`text-2xl font-semibold ${color}`}>{final.toFixed(2)}</div>
      <div className="text-sm text-gray-700 mt-2">Trades: {count}</div>
      <div className="text-sm text-red-700 mt-1">Max DD: {dd.toFixed(2)}</div>
    </div>
  );
}

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";

