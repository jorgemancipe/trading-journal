"use client";

import { useMemo, useState, useEffect } from "react";
import { useTrades } from "../context/TradesContext";

type Session = "Open" | "Midday" | "PowerHour";
type Rule = { strategy: string; session: Session };

/* ---------- Helpers ---------- */

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

/* ---------- Page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const [minTrades, setMinTrades] = useState(5);
  const [mode, setMode] = useState<"none" | "all" | "accepted">("accepted");

  const [acceptedRules, setAcceptedRules] = useState<Rule[]>([]);

  /* ✅ Safe localStorage */
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

  /* ---------- Rule Generation ---------- */

  const rules = useMemo<Rule[]>(() => {
    const map = new Map<
      string,
      Map<Session, { sum: number; count: number }>
    >();

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

  /* ---------- Apply Rules ---------- */

  function shouldRemove(t: any) {
    const s = getSession(t.date);
    if (!s) return false;

    if (mode === "none") return false;

    if (mode === "all") {
      return rules.some(
        (r) => r.strategy === t.strategy && r.session === s
      );
    }

    if (mode === "accepted") {
      return acceptedRules.some(
        (r) => r.strategy === t.strategy && r.session === s
      );
    }

    return false;
  }

  const simulatedTrades = useMemo(() => {
    return validTrades.filter((t) => !shouldRemove(t));
  }, [validTrades, rules, acceptedRules, mode]);

  const baseAvg = avgR(validTrades);
  const simAvg = avgR(simulatedTrades);

  /* ---------- Per‑Rule Impact ---------- */

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
        Rule Simulation Engine
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
            onChange={(e) => setMinTrades(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* ✅ Mode selector */}
        <div className="flex gap-2">
          {["none", "all", "accepted"].map((m) => (
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
        <div>Original Avg R: {baseAvg.toFixed(2)}</div>
        <div>Simulated Avg R: {simAvg.toFixed(2)}</div>
        <div
          className={
            simAvg >= baseAvg
              ? "text-green-700 font-semibold"
              : "text-red-700 font-semibold"
          }
        >
          Δ: {(simAvg - baseAvg).toFixed(2)}
        </div>
      </div>

      {/* Per‑rule impact */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Per‑Rule Impact</h2>

        {perRuleImpact.length === 0 ? (
          <p>No rules yet</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {perRuleImpact.map((r, i) => (
                <tr key={i}>
                  <td>
                    Disable {r.rule.strategy} @ {r.rule.session}
                  </td>
                  <td className="text-right">{r.removed}</td>
                  <td
                    className={
                      r.delta >= 0 ? "text-green-700" : "text-red-700"
                    }
                  >
                    {r.delta.toFixed(2)}
                  </td>
                  <td>
                    <button
                      onClick={() => toggleRule(r.rule)}
                      className="px-2 border rounded"
                    >
                      Toggle
                    </button>
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
``
