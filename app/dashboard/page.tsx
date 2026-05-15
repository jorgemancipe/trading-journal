"use client";

import { useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";

/* ---------- helpers ---------- */

function avgR(trades: { profit: number; risk: number }[]) {
  if (trades.length === 0) return 0;
  let sum = 0;
  for (const t of trades) sum += t.profit / t.risk;
  return sum / trades.length;
}

function shuffle<T>(arr: T[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function equity(trades: { profit: number }[]) {
  let e = 0;
  return trades.map(t => (e += t.profit));
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();
  const [runs, setRuns] = useState(50);

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ✅ Monte Carlo simulation */

  const simulations = useMemo(() => {
    if (validTrades.length === 0) return [];

    const results: number[] = [];

    for (let i = 0; i < runs; i++) {
      const shuffled = shuffle(validTrades);
      const eq = equity(shuffled);
      const final = eq[eq.length - 1] || 0;
      results.push(final);
    }

    return results;
  }, [validTrades, runs]);

  /* ✅ metrics */

  const avgResult =
    simulations.length === 0
      ? 0
      : simulations.reduce((s, v) => s + v, 0) / simulations.length;

  const best = Math.max(...simulations, 0);
  const worst = Math.min(...simulations, 0);

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">
        Monte Carlo Simulation
      </h1>

      {/* Control */}
      <div className="bg-white border rounded p-4 mb-6">
        <label>Simulation runs: {runs}</label>
        <input
          type="range"
          min={10}
          max={200}
          value={runs}
          onChange={e => setRuns(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Results */}
      <div className="bg-white border rounded p-4">

        <h2 className="font-semibold mb-3">Results</h2>

        <div className="space-y-2 text-sm">
          <div>Average outcome: {avgResult.toFixed(2)}</div>
          <div className="text-green-700">Best: {best.toFixed(2)}</div>
          <div className="text-red-700">Worst: {worst.toFixed(2)}</div>
        </div>

      </div>

    </main>
  );
}
