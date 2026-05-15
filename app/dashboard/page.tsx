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
  return trades.map((t) => (e += t.profit));
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

function pointsAttr(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const [minTrades, setMinTrades] = useState(5);
  const [simulate, setSimulate] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState<Rule[]>([]);

  /* ✅ Safe client‑side persistence */
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
    setAcceptedRules((prev) =>
      prev.some(
        (r) => r.strategy === rule.strategy && r.session === rule.session
      )
        ? prev.filter(
            (r) =>
              !(r.strategy === rule.strategy && r.session === rule.session)
          )
        : [...prev, rule]
    );
  }

  const validTrades = useMemo(
    () => trades.filter((t) => t.risk > 0),
    [trades]
  );

  /* ---------- rule generation ---------- */

  const rules = useMemo<Rule[]>(() => {
    const map = new Map<
      string,
      Map<Session, { sum: number; count: number }>
    >();

    for (const t of validTrades) {
      const s = getSession(t.date);
      if (!s) continue;

      const strategy = t.strategy || "Unassigned";
      const r = t.profit / t.risk;

      if (!map.has(strategy)) map.set(strategy, new Map());
      const row = map.get(strategy)!;

      const cell = row.get(s) ?? { sum: 0, count: 0 };
      cell.sum += r;
      cell.count += 1;
      row.set(s, cell);
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

  /* ---------- simulation (accepted rules only) ---------- */

  const simulatedTrades = useMemo(() => {
    if (!simulate) return validTrades;

    return validTrades.filter((t) => {
      const s = getSession(t.date);
      if (!s) return true;
      return !acceptedRules.some(
        (r) => r.strategy === t.strategy && r.session === s
      );
    });
  }, [simulate, validTrades, acceptedRules]);

  /* ---------- metrics ---------- */

  const baseAvg = avgR(validTrades);
  const simAvg = avgR(simulatedTrades);

  /* ---------- equity curves ---------- */

  const baseCurve = normalize(equityCurve(validTrades));
  const simCurve = normalize(equityCurve(simulatedTrades));
  const width = Math.max(baseCurve.length, simCurve.length, 1);

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">
        Strategy Rules + Equity Curve
      </h1>

      {/* Controls */}
      <div className="bg-white border rounded p-4 mb-6 space-y-4">
        <div>
          <label className="text-sm font-medium">
            Minimum trades for rules: {minTrades}
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
          <span>Simulate Apply Accepted Rules</span>
        </label>
      </div>

      {/* Overall impact */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Overall Impact</h2>
        <div className="text-sm space-y-1">
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

      {/* Equity Curve Comparison */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-3">
          Equity Curve (Before vs After)
        </h2>

        <div className="flex gap-4 text-sm mb-2">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-600 inline-block" />
            Original
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-600 inline-block" />
            Simulated
          </span>
        </div>

        <svg viewBox={`0 0 ${width} 100`} className="w-full h-64">
          <polyline
            points={pointsAttr(baseCurve)}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
          />
          <polyline
            points={pointsAttr(simCurve)}
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
          />
        </svg>

        <p className="text-xs text-gray-500 mt-2">
          Curves are normalized to compare shape and drawdown, not dollar size.
        </p>
      </div>

      {/* Rule selection */}
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">Rule Control</h2>

        {rules.length === 0 ? (
          <p className="text-sm text-gray-500">
            No rules triggered (insufficient data or no session time).
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rules.map((rule, i) => {
              const active = acceptedRules.some(
                (r) =>
                  r.strategy === rule.strategy &&
                  r.session === rule.session
              );

              return (
                <li key={i} className="flex justify-between items-center">
                  <span>
                    Disable <strong>{rule.strategy}</strong> during{" "}
                    <strong>{rule.session}</strong>
                  </span>
                  <button
                    onClick={() => toggleRule(rule)}
                    className={`px-3 py-1 border rounded ${
                      active
                        ? "bg-green-600 text-white"
                        : "bg-gray-100"
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
