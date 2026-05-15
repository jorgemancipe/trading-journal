"use client";

import { useMemo, useState, useEffect } from "react";
import { useTrades } from "../context/TradesContext";

type Session = "Open" | "Midday" | "PowerHour";
type Rule = { strategy: string; session: Session };

/* ---------- helpers ---------- */

function getSession(date: string): Session | null {
  if (!date.includes("T")) return null;

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  const h = d.getHours();
  const m = d.getMinutes();

  if (h === 9 && m >= 30 && m < 45) return "Open";
  if ((h === 9 && m >= 45) || h === 10 || (h === 11 && m < 30))
    return "Midday";
  if (h === 15) return "PowerHour";

  return null;
}

function avgR(trades: { profit: number; risk: number }[]) {
  if (trades.length === 0) return 0;
  let sum = 0;
  for (const t of trades) sum += t.profit / t.risk;
  return sum / trades.length;
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const [minTrades, setMinTrades] = useState(5);

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ---------- build rules ---------- */

  const rules = useMemo(() => {
    const map = new Map<string, Map<Session, { sum: number; count: number }>>();

    for (const t of validTrades) {
      const s = getSession(t.date);
      if (!s) continue;

      const strat = t.strategy || "Unassigned";
      const r = t.profit / t.risk;

      if (!map.has(strat)) map.set(strat, new Map());
      const row = map.get(strat)!;

      const cell = row.get(s) ?? { sum: 0, count: 0 };
      cell.sum += r;
      cell.count += 1;
      row.set(s, cell);
    }

    const out: Rule[] = [];
    for (const [strat, row] of map.entries()) {
      for (const [session, cell] of row.entries()) {
        if (cell.count >= minTrades && cell.sum / cell.count < 0) {
          out.push({ strategy: strat, session });
        }
      }
    }
    return out;
  }, [validTrades, minTrades]);

  /* ---------- filter helper ---------- */

  function applyRules(trades: typeof validTrades, active: Rule[]) {
    return trades.filter(t => {
      const s = getSession(t.date);
      if (!s) return true;
      return !active.some(r => r.strategy === t.strategy && r.session === s);
    });
  }

  const baseAvg = avgR(validTrades);

  /* ---------- RULE OPTIMIZER ---------- */

  const optimized = useMemo(() => {
    if (rules.length === 0) return null;

    // Limit to top 5 rules first (avoid combinatorial explosion)
    const candidates = rules.slice(0, 5);

    let bestAvg = baseAvg;
    let bestSet: Rule[] = [];

    function testCombination(combo: Rule[]) {
      const filtered = applyRules(validTrades, combo);
      const value = avgR(filtered);

      if (value > bestAvg) {
        bestAvg = value;
        bestSet = combo;
      }
    }

    function generateCombos(arr: Rule[], start = 0, current: Rule[] = []) {
      if (current.length > 0) testCombination(current);

      for (let i = start; i < arr.length; i++) {
        generateCombos(arr, i + 1, [...current, arr[i]]);
      }
    }

    generateCombos(candidates);

    return {
      bestAvg,
      delta: bestAvg - baseAvg,
      rules: bestSet,
    };
  }, [rules, validTrades, baseAvg]);

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">Rule Optimizer</h1>

      {/* Controls */}
      <div className="bg-white border rounded p-4 mb-6">
        <label>Min trades: {minTrades}</label>
        <input
          type="range"
          min={1}
          max={20}
          value={minTrades}
          onChange={e => setMinTrades(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Base performance */}
      <div className="bg-white border rounded p-4 mb-6">
        <div>Base Avg R: {baseAvg.toFixed(2)}</div>
      </div>

      {/* ✅ Optimizer result */}
      <div className="bg-white border rounded p-4">

        <h2 className="font-semibold mb-3">Best Rule Combination</h2>

        {optimized === null ? (
          <p>No rules available.</p>
        ) : (
          <>
            <div className="mb-2">
              Optimized Avg R: {optimized.bestAvg.toFixed(2)}
            </div>

            <div
              className={
                optimized.delta >= 0
                  ? "text-green-700"
                  : "text-red-700"
              }
            >
              Improvement: {optimized.delta.toFixed(2)}
            </div>

            <ul className="mt-3 text-sm space-y-1">
              {optimized.rules.map((r, i) => (
                <li key={i}>
                  Disable {r.strategy} @ {r.session}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

    </main>
  );
}
