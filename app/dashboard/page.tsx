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
  const [mode, setMode] = useState<"none" | "all" | "accepted">("accepted");

  const [acceptedRules, setAcceptedRules] = useState<Rule[]>([]);

  /* ✅ safe persistence */
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
        ? prev.filter(
            r => !(r.strategy === rule.strategy && r.session === rule.session)
          )
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

  /* ---------- filtering modes ---------- */

  function filterTrades(trades: typeof validTrades, useRules: Rule[]) {
    return trades.filter(t => {
      const s = getSession(t.date);
      if (!s) return true;
      return !useRules.some(
        r => r.strategy === t.strategy && r.session === s
      );
    });
  }

  const noRulesTrades = validTrades;

  const allRulesTrades = useMemo(
    () => filterTrades(validTrades, rules),
    [validTrades, rules]
  );

  const acceptedTrades = useMemo(
    () => filterTrades(validTrades, acceptedRules),
    [validTrades, acceptedRules]
  );

  /* ---------- selected mode ---------- */

  const selectedTrades =
    mode === "none"
      ? noRulesTrades
      : mode === "all"
      ? allRulesTrades
      : acceptedTrades;

  /* ---------- metrics ---------- */

  const baseAvg = avgR(validTrades);
  const selectedAvg = avgR(selectedTrades);

  /* ---------- equity curves ---------- */

  const baseCurve = normalize(equityCurve(noRulesTrades));
  const allCurve = normalize(equityCurve(allRulesTrades));
  const acceptedCurve = normalize(equityCurve(acceptedTrades));

  const width = Math.max(
    baseCurve.length,
    allCurve.length,
    acceptedCurve.length,
    1
  );

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-5xl">

      <h1 className="text-3xl font-bold mb-6">
        Rule Engine + Equity Curve
      </h1>

      {/* Controls */}
      <div className="bg-white border rounded p-4 mb-6 space-y-4">

        <div>
          <label className="text-sm font-medium">
            Min trades: {minTrades}
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={minTrades}
            onChange={e => setMinTrades(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* ✅ Mode selector */}
        <div className="flex gap-2">
          {["none", "all", "accepted"].map(m => (
            <button
              key={m}
              onClick={() => setMode(m as any)}
              className={`px-3 py-1 border rounded ${
                mode === m ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-white border rounded p-4 mb-6">
        <div>Base Avg R: {baseAvg.toFixed(2)}</div>
        <div>Selected Avg R: {selectedAvg.toFixed(2)}</div>
      </div>

      {/* ✅ Equity Curve */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-3">Equity Curve Comparison</h2>

        <div className="flex gap-4 text-sm mb-2">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500" /> None
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-500" /> All Rules
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-500" /> Accepted
          </span>
        </div>

        <svg viewBox={`0 0 ${width} 100`} className="w-full h-64">

          {/* Base */}
          <polyline
            points={toPoints(baseCurve)}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />

          {/* All Rules */}
          <polyline
            points={toPoints(allCurve)}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
          />

          {/* Accepted Rules */}
          <polyline
            points={toPoints(acceptedCurve)}
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
          />

        </svg>

      </div>

      {/* Rule selection */}
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">Rules</h2>

        {rules.length === 0 ? (
          <p>No rules</p>
        ) : (
          <ul className="space-y-2">
            {rules.map((r, i) => {
              const active = acceptedRules.some(
                x => x.strategy === r.strategy && x.session === r.session
              );

              return (
                <li key={i} className="flex justify-between">
                  <span>
                    {r.strategy} @ {r.session}
                  </span>
                  <button
                    onClick={() => toggleRule(r)}
                    className={`px-2 border rounded ${
                      active ? "bg-green-600 text-white" : ""
                    }`}
                  >
                    {active ? "Accepted" : "Ignore"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

    </main>
  );
}
