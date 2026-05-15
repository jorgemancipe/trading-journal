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

  /* ✅ rolling windows */

  const results = useMemo(() => {
    if (validTrades.length < 20) return [];

    const windowSize = Math.floor(validTrades.length * 0.5);
    const step = Math.floor(validTrades.length * 0.2);

    const out: {
      trainAvg: number;
      testAvg: number;
      delta: number;
    }[] = [];

    for (let start = 0; start + windowSize * 2 < validTrades.length; start += step) {
      const train = validTrades.slice(start, start + windowSize);
      const test = validTrades.slice(start + windowSize, start + windowSize * 2);

      /* ----- build rules on TRAIN ----- */

      const map = new Map<string, Map<Session, { sum: number; count: number }>>();

      for (const t of train) {
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

      const rules: Rule[] = [];

      for (const [strat, row] of map.entries()) {
        for (const [session, cell] of row.entries()) {
          if (cell.count >= minTrades && cell.sum / cell.count < 0) {
            rules.push({ strategy: strat, session });
          }
        }
      }

      /* ----- apply to TEST ----- */

      const filtered = test.filter(t => {
        const s = getSession(t.date);
        if (!s) return true;
        return !rules.some(
          r => r.strategy === t.strategy && r.session === s
        );
      });

      const trainAvg = avgR(train);
      const testBase = avgR(test);
      const testFiltered = avgR(filtered);

      out.push({
        trainAvg,
        testAvg: testFiltered,
        delta: testFiltered - testBase,
      });
    }

    return out;
  }, [validTrades, minTrades]);

  /* ✅ aggregate */

  const avgDelta =
    results.length === 0
      ? 0
      : results.reduce((s, r) => s + r.delta, 0) / results.length;

  const positiveRuns = results.filter(r => r.delta > 0).length;

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">
        Rolling Walk‑Forward Validation
      </h1>

      {/* control */}
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

      {/* summary */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Summary</h2>

        <div>Windows tested: {results.length}</div>
        <div>Avg Δ R: {avgDelta.toFixed(2)}</div>

        <div
          className={
            avgDelta >= 0 ? "text-green-700" : "text-red-700"
          }
        >
          Positive runs: {positiveRuns} / {results.length}
        </div>
      </div>

      {/* detailed */}
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Detailed Runs</h2>

        {results.length === 0 ? (
          <p>Not enough data.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b">
                  <td>Run {i + 1}</td>
                  <td>Train R: {r.trainAvg.toFixed(2)}</td>
                  <td>Test R: {r.testAvg.toFixed(2)}</td>
                  <td
                    className={
                      r.delta >= 0 ? "text-green-700" : "text-red-700"
                    }
                  >
                    Δ {r.delta.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </main>
  );
}
