"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";

/* ---------- helpers ---------- */

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

/* ✅ Adaptive risk function */
function riskMultiplier(drawdown: number) {
  if (drawdown < 0.1) return 1.0;
  if (drawdown < 0.2) return 0.75;
  if (drawdown < 0.3) return 0.5;
  return 0.25;
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ---------- baseline ---------- */

  const baseCurve = useMemo(() => equity(validTrades), [validTrades]);
  const baseDD = maxDrawdown(baseCurve);

  /* ---------- adaptive simulation ---------- */

  const adaptiveCurve = useMemo(() => {
    let equityValue = 0;
    let peak = 0;

    const out: number[] = [];

    for (const t of validTrades) {
      const dd = peak > 0 ? (peak - equityValue) / peak : 0;
      const multiplier = riskMultiplier(dd);

      const adjustedProfit = t.profit * multiplier;

      equityValue += adjustedProfit;
      if (equityValue > peak) peak = equityValue;

      out.push(equityValue);
    }

    return out;
  }, [validTrades]);

  const adaptiveDD = maxDrawdown(adaptiveCurve);

  /* ---------- metrics ---------- */

  const baseFinal = baseCurve[baseCurve.length - 1] || 0;
  const adaptiveFinal =
    adaptiveCurve[adaptiveCurve.length - 1] || 0;

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">
        Adaptive Risk Engine
      </h1>

      {/* Baseline */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Baseline</h2>
        <div>Final Equity: {baseFinal.toFixed(2)}</div>
        <div className="text-red-700">
          Max Drawdown: {(baseDD * 100).toFixed(1)}%
        </div>
      </div>

      {/* Adaptive */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">
          Adaptive Risk Engine
        </h2>

        <div>Final Equity: {adaptiveFinal.toFixed(2)}</div>

        <div
          className={
            adaptiveDD <= baseDD
              ? "text-green-700"
              : "text-red-700"
          }
        >
          Max Drawdown: {(adaptiveDD * 100).toFixed(1)}%
        </div>
      </div>

      {/* Comparison */}
      <div className="bg-white border rounded p-4">

        <h2 className="font-semibold mb-2">Comparison</h2>

        <div className="text-sm space-y-1">
          <div>
            Δ Equity: {(adaptiveFinal - baseFinal).toFixed(2)}
          </div>

          <div>
            Drawdown Reduction:{" "}
            {((baseDD - adaptiveDD) * 100).toFixed(1)}%
          </div>
        </div>

      </div>

    </main>
  );
}
``
