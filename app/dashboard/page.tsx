"use client";

import { useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";

type Session = "Open" | "Midday" | "PowerHour";

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

export default function DashboardPage() {
  const { trades } = useTrades();
  const [minTrades, setMinTrades] = useState(5);
  const [simulate, setSimulate] = useState(false);

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  const rules = useMemo(() => {
    const map = new Map<string, Map<Session, { sum: number; count: number }>>();

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

    const out: { strategy: string; session: Session }[] = [];
    for (const [strategy, row] of map.entries()) {
      for (const [session, cell] of row.entries()) {
        if (cell.count >= minTrades && cell.sum / cell.count < 0) {
          out.push({ strategy, session });
        }
      }
    }
    return out;
  }, [validTrades, minTrades]);

  const simulatedTrades = useMemo(() => {
    if (!simulate) return validTrades;
    return validTrades.filter(t => {
      const s = getSession(t.date);
      if (!s) return true;
      return !rules.some(r => r.strategy === t.strategy && r.session === s);
    });
  }, [simulate, validTrades, rules]);

  const baseAvg = avgR(validTrades);
  const simAvg = avgR(simulatedTrades);

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Apply Rules Simulation</h1>

      <div className="bg-white border rounded p-4 mb-6 space-y-4">
        <div>
          <label className="text-sm font-medium">
            Minimum trades: {minTrades}
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

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={simulate}
            onChange={e => setSimulate(e.target.checked)}
          />
          <span>Simulate Apply Rules</span>
        </label>
      </div>

      <div className="bg-white border rounded p-4">
        <div>Original Avg R: {baseAvg.toFixed(2)}</div>
        <div>Simulated Avg R: {simAvg.toFixed(2)}</div>
        <div>
          Δ Avg R:{" "}
          <span className={simAvg >= baseAvg ? "text-green-700" : "text-red-700"}>
            {(simAvg - baseAvg).toFixed(2)}
          </span>
        </div>
      </div>
    </main>
  );
}
