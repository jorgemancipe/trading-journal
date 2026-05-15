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

/* ---------- discipline score ---------- */

function computeScore(trades: any[]) {
  const total = trades.length;
  if (!total) return 0;

  const F = trades.filter(t => t.grade === "F");

  const fRate = F.length / total;

  const absTotal = trades.reduce((s, t) => s + Math.abs(t.profit), 0);
  const absF = F.reduce((s, t) => s + Math.abs(t.profit), 0);

  const taxRatio = absTotal > 0 ? absF / absTotal : 0;

  let score = 100 - (70 * fRate + 30 * taxRatio);

  return Math.max(0, Math.min(100, score));
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ---------- system ---------- */

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
      return "F";
    }

    if (regime === "CHOPPY") {
      return "B";
    }

    return "A";
  }

  const graded = validTrades.map(t => ({
    ...t,
    grade: gradeTrade(t),
  }));

  /* ---------- current score ---------- */

  const score = computeScore(graded);

  /* ✅ rolling discipline trend */

  const chunkSize = 10; // trades per segment

  const trend = useMemo(() => {
    const chunks = [];

    for (let i = 0; i < graded.length; i += chunkSize) {
      const slice = graded.slice(i, i + chunkSize);
      if (slice.length > 0) {
        chunks.push(computeScore(slice));
      }
    }

    return chunks;
  }, [graded]);

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-6xl">

      <h1 className="text-3xl font-bold mb-6">
        📊 Discipline Evolution
      </h1>

      {/* Current score */}
      <div className="bg-white border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Current Score</h2>
        <div className="text-2xl font-bold">
          {score.toFixed(0)} / 100
        </div>
      </div>

      {/* Trend */}
      <div className="bg-white border p-4 rounded mb-6">

        <h2 className="font-semibold mb-3">
          Discipline Trend (by Trade Groups)
        </h2>

        {trend.length === 0 ? (
          <p>No data yet</p>
        ) : (
          <div className="space-y-2">
            {trend.map((s, i) => (
              <div
                key={i}
                className="flex justify-between text-sm border-b py-1"
              >
                <span>Segment {i + 1}</span>
                <span
                  className={
                    s >= 80
                      ? "text-green-700"
                      : s >= 60
                      ? "text-yellow-600"
                      : "text-red-700"
                  }
                >
                  {s.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Interpretation */}
      <div className="bg-white border p-4 rounded">

        <h2 className="font-semibold mb-2">How to Read It</h2>

        <div className="text-sm space-y-1">
          <div>✅ Rising scores → improving discipline</div>
          <div>⚠️ Flat → stagnation</div>
          <div>❌ Falling → losing control / overtrading</div>
        </div>

      </div>

    </main>
  );
}
``
