"use client";

import { useMemo, useState } from "react";
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

  /* ✅ Split data (70/30 walk-forward) */
  const splitIndex = Math.floor(validTrades.length * 0.7);
  const trainTrades = validTrades.slice(0, splitIndex);
  const testTrades = validTrades.slice(splitIndex);

  /* ---------- rule generation (TRAIN ONLY) ---------- */

  const rules = useMemo(() => {
    const map = new Map<string, Map<Session, { sum: number; count: number }>>();

    for (const t of trainTrades) {
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
  }, [trainTrades, minTrades]);

  /* ---------- apply rules ---------- */

  function applyRules(trades: typeof validTrades, active: Rule[]) {
    return trades.filter(t => {
      const s = getSession(t.date);
      if (!s) return true;
      return !active.some(
        r => r.strategy === t.strategy && r.session === s
      );
    });
  }

  /* ---------- metrics ---------- */

  const trainBase = avgR(trainTrades);
  const trainFiltered = avgR(applyRules(trainTrades, rules));

  const testBase = avgR(testTrades);
  const testFiltered = avgR(applyRules(testTrades, rules));

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">
        Walk‑Forward Validation
      </h1>

      {/* Control */}
      <div className="bg-white border rounded p-4 mb-6">
        <label>Minimum trades: {minTrades}</label>
        <input
          type="range"
          min={1}
          max={20}
          value={minTrades}
          onChange={e => setMinTrades(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Train */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Train Performance (In-Sample)</h2>
        <div>Base Avg R: {trainBase.toFixed(2)}</div>
        <div>Filtered Avg R: {trainFiltered.toFixed(2)}</div>
        <div className="text-sm">
          Δ: {(trainFiltered - trainBase).toFixed(2)}
        </div>
      </div>

      {/* Test */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Test Performance (Out-of-Sample)</h2>
        <div>Base Avg R: {testBase.toFixed(2)}</div>
        <div>Filtered Avg R: {testFiltered.toFixed(2)}</div>
        <div
          className={
            testFiltered >= testBase
              ? "text-green-700"
              : "text-red-700"
          }
        >
          Δ: {(testFiltered - testBase).toFixed(2)}
        </div>
      </div>

      {/* Rules */}
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Generated Rules</h2>

        {rules.length === 0 ? (
          <p>No rules generated.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {rules.map((r, i) => (
              <li key={i}>
                Disable {r.strategy} @ {r.session}
              </li>
            ))}
          </ul>
        )}
      </div>

    </main>
  );
}
