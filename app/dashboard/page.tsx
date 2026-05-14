"use client";

import { useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";

/* ---------- config ---------- */

type Session = "Open" | "Midday" | "Power Hour";

/* ---------- helpers ---------- */

function getSessionFromDate(dateStr: string): Session | null {
  const d = new Date(dateStr);
  const hour = d.getHours();
  const min = d.getMinutes();

  if (hour === 9 && min >= 30 && min < 45) return "Open";
  if ((hour === 9 && min >= 45) || hour === 10 || (hour === 11 && min < 30))
    return "Midday";
  if (hour === 15) return "Power Hour";
  return null;
}

function cellColor(avgR: number | null, count: number, minTrades: number) {
  if (avgR === null) return "bg-gray-100 text-gray-400";
  if (count < minTrades) return "bg-gray-50 text-gray-400";
  if (avgR > 0) return "bg-green-100 text-green-800";
  if (avgR < 0) return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-600";
}

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();
  const [minTrades, setMinTrades] = useState(5);

  const validTrades = useMemo(
    () => trades.filter((t) => t.risk > 0),
    [trades]
  );

  const strategies = useMemo(
    () =>
      Array.from(
        new Set(validTrades.map((t) => t.strategy || "Unassigned"))
      ).sort(),
    [validTrades]
  );

  const sessions: Session[] = ["Open", "Midday", "Power Hour"];

  const matrix = useMemo(() => {
    const map = new Map<
      string,
      Map<Session, { totalR: number; count: number }>
    >();

    for (const t of validTrades) {
      const session = getSessionFromDate(t.date);
      if (!session) continue;

      const strategy = t.strategy || "Unassigned";
      const r = t.profit / t.risk;

      if (!map.has(strategy)) map.set(strategy, new Map());
      const row = map.get(strategy)!;

      const cell = row.get(session) ?? { totalR: 0, count: 0 };
      cell.totalR += r;
      cell.count += 1;
      row.set(session, cell);
    }

    return map;
  }, [validTrades]);

  const autoRules = useMemo(() => {
    const rules: {
      strategy: string;
      session: Session;
      avgR: number;
      trades: number;
      action: string;
      reason: string;
    }[] = [];

    for (const [strategy, row] of matrix.entries()) {
      for (const [session, cell] of row.entries()) {
        const avgR = cell.totalR / cell.count;
        if (avgR < 0 && cell.count >= minTrades) {
          rules.push({
            strategy,
            session,
            avgR,
            trades: cell.count,
            action: `Disable ${strategy} during ${session}`,
            reason: "Negative expectancy with sufficient sample size",
          });
        }
      }
    }

    return rules.sort((a, b) => a.avgR - b.avgR);
  }, [matrix, minTrades]);

  function exportRulesCSV() {
    if (autoRules.length === 0) return;

    const rows = [
      ["Strategy", "Session", "Avg R", "Trades", "Action", "Reason"],
      ...autoRules.map((r) => [
        r.strategy,
        r.session,
        r.avgR.toFixed(2),
        String(r.trades),
        r.action,
        r.reason,
      ]),
    ];

    downloadCSV(rows, "auto-rules.csv");
  }

  function exportRulesJSON() {
    if (autoRules.length === 0) return;
    downloadJSON(autoRules, "auto-rules.json");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-2">
        Strategy × Session (R Analytics)
      </h1>

      {/* Controls */}
      <div className="bg-white border rounded p-4 mb-6 flex gap-4 items-center">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">
            Minimum trades: <strong>{minTrades}</strong>
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
        <div className="flex gap-2">
          <button
            onClick={exportRulesCSV}
            disabled={autoRules.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Export Rules CSV
          </button>
          <button
            onClick={exportRulesJSON}
            disabled={autoRules.length === 0}
            className="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50"
          >
            Export Rules JSON
          </button>
        </div>
      </div>

      {/* Auto‑Rules Preview */}
      <div className="bg-white border rounded p-4 mb-8">
        <h2 className="text-lg font-semibold mb-2">✅ Auto‑Rules Preview</h2>
        {autoRules.length === 0 ? (
          <div className="text-sm text-gray-500">
            No rules triggered at this threshold.
          </div>
        ) : (
          <ul className="space-y-2">
            {autoRules.map((r, i) => (
              <li
                key={i}
                className="border rounded px-3 py-2 bg-red-50 text-red-800"
              >
                🚫 <strong>{r.action}</strong>
                <div className="text-xs mt-1">
                  Avg R: {r.avgR.toFixed(2)} • Trades: {r.trades}
                </div>
              </li>
            ))}
