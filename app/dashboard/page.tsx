"use client";

import { useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";

type Session = "Open" | "Midday" | "PowerHour";

type Rule = {
  strategy: string;
  session: Session;
};

/* ---------- helpers ---------- */

function getSession(date: string): Session | null {
  // Requires time in date string: YYYY-MM-DDTHH:mm
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
  const [simulate, setSimulate] = useState(false);

  const validTrades = useMemo(
    () => trades.filter((t) => t.risk > 0),
    [trades]
  );

  /* ---- build rules (strategy × session) ---- */

  const rules = useMemo<Rule[]>(() => {
    const map = new Map<
      string,
      Map<Session, { sum: number; count: number }>
    >();

    for (const t of validTrades) {
      const session = getSession(t.date);
      if (!session) continue;

      const strategy = t.strategy || "Unassigned";
      const r = t.profit / t.risk;

      if (!map.has(strategy)) map.set(strategy, new Map());
      const row = map.get(strategy)!;

      const cell = row.get(session) ?? { sum: 0, count: 0 };
      cell.sum += r;
      cell.count += 1;
      row.set(session, cell);
    }

    const out: Rule[] = [];
    for (const [strategy, row] of map.entries()) {
      for (const [session, cell] of row.entries()) {
        if (cell.count >= minTrades && cell.sum / cell.count < 0) {
          out.push({ strategy, session });
        }
      }
    }
    return out;
  }, [validTrades, minTrades]);

  /* ---- simulation ---- */

  const simulatedTrades = useMemo(() => {
    if (!simulate) return validTrades;

    return validTrades.filter((t) => {
      const s = getSession(t.date);
      if (!s) return true;
      return !rules.some(
        (r) => r.strategy === t.strategy && r.session === s
      );
    });
  }, [simulate, validTrades, rules]);

  const baseAvg = avgR(validTrades);
  const simAvg = avgR(simulatedTrades);

  /* ---- per‑rule impact ---- */

  const perRuleImpact = useMemo(() => {
    return rules
      .map((rule) => {
        const filtered = validTrades.filter((t) => {
          const s = getSession(t.date);
          if (!s) return true;
          return !(t.strategy === rule.strategy && s === rule.session);
        });

        return {
          rule,
          removed: validTrades.length - filtered.length,
          delta: avgR(filtered) - baseAvg,
        };
      })
      .sort((a, b) => b.delta - a.delta);
  }, [rules, validTrades, baseAvg]);

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        Simulated Apply Rules
      </h1>

      {/* Controls */}
      <div className="bg-white border rounded p-4 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">
            Minimum trades: {minTrades}
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={minTrades}
            onChange={(e) => setMinTrades(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={simulate}
            onChange={(e) => setSimulate(e.target.checked)}
          />
          <span>Simulate Apply Rules</span>
        </label>
      </div>

      {/* Overall impact */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Overall Impact</h2>
        <div className="space-y-1 text-sm">
          <div>Original Avg R: {baseAvg.toFixed(2)}</div>
          <div>Simulated Avg R: {simAvg.toFixed(2)}</div>
          <div
            className={
              simAvg - baseAvg >= 0
                ? "text-green-700 font-semibold"
                : "text-red-700 font-semibold"
            }
          >
            Δ Avg R: {(simAvg - baseAvg).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Per‑rule impact */}
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">
          Per‑Rule Impact Breakdown
        </h2>

        {perRuleImpact.length === 0 ? (
          <p className="text-sm text-gray-500">
            No rules triggered (insufficient data or no session time).
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">Rule</th>
                <th className="text-right py-1">Trades Removed</th>
                <th className="text-right py-1">Δ Avg R</th>
              </tr>
            </thead>
            <tbody>
              {perRuleImpact.map((r, i) => (
                <tr key={i} className="border-b">
                  <td className="py-1">
                    Disable <strong>{r.rule.strategy}</strong> during{" "}
                    <strong>{r.rule.session}</strong>
                  </td>
                  <td className="text-right">{r.removed}</td>
                  <td
                    className={`text-right ${
                      r.delta >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {r.delta.toFixed(2)}
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
