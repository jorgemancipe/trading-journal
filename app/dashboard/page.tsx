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
  if ((h === 9 && m >= 45) || h === 10 || (h === 11 && m < 30)) return "Midday";
  if (h === 15) return "PowerHour";
  return null;
}

function avgR(trades: { profit: number; risk: number }[]) {
  if (trades.length === 0) return 0;
  let sum = 0;
  for (const t of trades) sum += t.profit / t.risk;
  return sum / trades.length;
}

function equity(trades: { profit: number }[]) {
  let e = 0;
  return trades.map(t => (e += t.profit));
}

function maxDD(curve: number[]) {
  let peak = 0, max = 0;
  for (const v of curve) {
    if (v > peak) peak = v;
    const dd = peak - v;
    if (dd > max) max = dd;
  }
  return max;
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

function points(p: { x: number; y: number }[]) {
  return p.map(v => `${v.x},${v.y}`).join(" ");
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const [minTrades, setMinTrades] = useState(5);
  const [mode, setMode] = useState<"none" | "all" | "accepted" | "top">("top");

  const [acceptedRules, setAcceptedRules] = useState<Rule[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("acceptedRules");
    if (raw) setAcceptedRules(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem("acceptedRules", JSON.stringify(acceptedRules));
  }, [acceptedRules]);

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ---------- rules ---------- */

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

  /* ---------- ranking ---------- */

  const ranked = useMemo(() => {
    return rules
      .map(rule => {
        const filtered = validTrades.filter(t => {
          const s = getSession(t.date);
          if (!s) return true;
          return !(t.strategy === rule.strategy && s === rule.session);
        });
        return { rule, delta: avgR(filtered) - avgR(validTrades) };
      })
      .sort((a, b) => b.delta - a.delta);
  }, [rules, validTrades]);

  const topRules = ranked.slice(0, 3).map(r => r.rule);

  /* ---------- filtering ---------- */

  function filter(tradesArr: typeof validTrades, active: Rule[]) {
    return tradesArr.filter(t => {
      const s = getSession(t.date);
      if (!s) return true;
      return !active.some(r => r.strategy === t.strategy && r.session === s);
    });
  }

  const noRules = validTrades;
  const allRules = filter(validTrades, rules);
  const accepted = filter(validTrades, acceptedRules);
  const top = filter(validTrades, topRules);

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

  const baseCurve = normalize(equity(noRules));
  const allCurve = normalize(equity(allRules));
  const accCurve = normalize(equity(accepted));
  const topCurve = normalize(equity(top));

  const width = Math.max(
    baseCurve.length,
    allCurve.length,
    accCurve.length,
    topCurve.length,
    1
  );

  /* ---------- monte carlo ---------- */

  const mc = useMemo(() => {
    const results = [];
    for (let i = 0; i < 30; i++) {
      const shuffled = shuffle(validTrades);
      const eq = equity(shuffled);
      results.push(eq[eq.length - 1] || 0);
    }
    return results;
  }, [validTrades]);

  const mcAvg = mc.reduce((s, v) => s + v, 0) / (mc.length || 1);

  /* ---------- risk ---------- */

  const curve = equity(validTrades);
  const dd = maxDD(curve);

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 max-w-6xl">

      <h1 className="text-3xl font-bold mb-6">
        ✅ Final Trading System Dashboard
      </h1>

      {/* Controls */}
      <div className="bg-white border p-4 mb-6 rounded space-y-3">

        <label>Min Trades: {minTrades}</label>
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
              {m}
            </button>
          ))}
        </div>

      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="bg-white p-3 border rounded">
          Avg R: {baseAvg.toFixed(2)}
        </div>

        <div className="bg-white p-3 border rounded">
          Selected R: {selectedAvg.toFixed(2)}
        </div>

        <div className="bg-white p-3 border rounded text-red-700">
          Max DD: {dd.toFixed(2)}
        </div>

      </div>

      {/* Equity */}
      <div className="bg-white border p-4 mb-6 rounded">
        <h2 className="mb-2 font-medium">Equity</h2>

        <svg viewBox={`0 0 ${width} 100`} className="w-full h-48">

          <polyline points={points(baseCurve)} stroke="blue" fill="none" />
          <polyline points={points(allCurve)} stroke="red" fill="none" />
          <polyline points={points(accCurve)} stroke="green" fill="none" />
          <polyline points={points(topCurve)} stroke="purple" fill="none" />

        </svg>
      </div>

      {/* Rules */}
      <div className="bg-white border p-4 rounded">

        <h2 className="mb-2">Rule Ranking</h2>

        {ranked.map((r,i)=>(
          <div key={i} className="flex justify-between text-sm">
            <span>{r.rule.strategy} @ {r.rule.session}</span>
            <span>{r.delta.toFixed(2)}</span>
          </div>
        ))}

      </div>

      {/* Monte Carlo */}
      <div className="bg-white border p-4 rounded mt-6">
        Monte Carlo Avg Outcome: {mcAvg.toFixed(2)}
      </div>

    </main>
  );
}
