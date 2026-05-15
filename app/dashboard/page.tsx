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

function equityCurve(trades: { profit: number }[]) {
  let e = 0;
  return trades.map(t => (e += t.profit));
}

function normalize(values: number[]) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return values.map((v, i) => ({
    x: i,
    y: 100 - ((v - min) / span) * 100,
  }));
}

function toPoints(points: { x: number; y: number }[]) {
  return points.map(p => `${p.x},${p.y}`).join(" ");
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const [minTrades, setMinTrades] = useState(5);
  const [mode, setMode] = useState<"none" | "all" | "accepted" | "top">("top");

  const [acceptedRules, setAcceptedRules] = useState<Rule[]>([]);

  /* ✅ persistence */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("acceptedRules");
      if (raw) setAcceptedRules(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("acceptedRules", JSON.stringify(acceptedRules));
    } catch {}
  }, [acceptedRules]);

  function toggleRule(rule: Rule) {
    setAcceptedRules(prev =>
      prev.some(r => r.strategy === rule.strategy && r.session === rule.session)
        ? prev.filter(r => !(r.strategy === rule.strategy && r.session === rule.session))
        : [...prev, rule]
    );
  }

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ---------- rule engine ---------- */

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

  /* ---------- rule ranking ---------- */

  const rankedRules = useMemo(() => {
    return rules
      .map(rule => {
        const filtered = validTrades.filter(t => {
          const s = getSession(t.date);
          if (!s) return true;
          return !(t.strategy === rule.strategy && s === rule.session);
        });

        return {
          rule,
          delta: avgR(filtered) - avgR(validTrades),
        };
      })
      .sort((a, b) => b.delta - a.delta);
  }, [rules, validTrades]);

  /* ✅ Top N rules (auto-selection) */
  const topRules = rankedRules.slice(0, 3).map(r => r.rule);

  function filterTrades(trades: typeof validTrades, activeRules: Rule[]) {
    return trades.filter(t => {
      const s = getSession(t.date);
      if (!s) return true;
      return !activeRules.some(
        r => r.strategy === t.strategy && r.session === s
      );
    });
  }

  const noRules = validTrades;
  const allRules = filterTrades(validTrades, rules);
  const accepted = filterTrades(validTrades, acceptedRules);
  const top = filterTrades(validTrades, topRules);

  const selected =
    mode === "none"
      ? noRules
      : mode === "all"
      ? allRules
      : mode === "accepted"
      ? accepted
      : top;

  /* ---------- metrics ---------- */

  const baseAvg = avgR(validTrades);
  const selectedAvg = avgR(selected);

  /* ---------- equity ---------- */

  const baseCurve = normalize(equityCurve(noRules));
  const allCurve = normalize(equityCurve(allRules));
  const accCurve = normalize(equityCurve(accepted));
  const topCurve = normalize(equityCurve(top));

  const width = Math.max(
    baseCurve.length,
    allCurve.length,
    accCurve.length,
    topCurve.length,
    1
  );

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-5xl">

      <h1 className="text-3xl font-bold mb-6">Rule Ranking Engine</h1>

      {/* Controls */}
      <div className="bg-white border rounded p-4 mb-6 space-y-4">
        <input
          type="range"
          min={1}
          max={20}
          value={minTrades}
          onChange={e => setMinTrades(Number(e.target.value))}
          className="w-full"
        />

        <div className="flex gap-2">
          {["none","all","accepted","top"].map(m => (
            <button
              key={m}
              onClick={() => setMode(m as any)}
              className={`px-3 py-1 border rounded ${
                mode === m ? "bg-blue-600 text-white" : ""
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Ranking */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Rule Ranking</h2>

        {rankedRules.map((r,i)=>(
          <div key={i} className="flex justify-between text-sm border-b py-1">
            <span>{r.rule.strategy} @ {r.rule.session}</span>
            <span className={r.delta>=0?"text-green-700":"text-red-700"}>
              {r.delta.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Equity */}
      <div className="bg-white border rounded p-4">
        <svg viewBox={`0 0 ${width} 100`} className="w-full h-64">
          <polyline points={toPoints(baseCurve)} fill="none" stroke="#3b82f6"/>
          <polyline points={toPoints(allCurve)} fill="none" stroke="#ef4444"/>
          <polyline points={toPoints(accCurve)} fill="none" stroke="#16a34a"/>
          <polyline points={toPoints(topCurve)} fill="none" stroke="#a855f7"/>
        </svg>
      </div>

    </main>
  );
}
