"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";

export default function MonthlyAnalysis() {
  const ctx = useTrades() as any;
  const trades = Array.isArray(ctx?.trades) ? ctx.trades : [];

  const months = useMemo(() => {
    const data: Record<
      string,
      {
        pnl: number;
        trades: number;
        wins: number;
      }
    > = {};

    for (const t of trades) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!data[key]) {
        data[key] = {
          pnl: 0,
          trades: 0,
          wins: 0,
        };
      }

      const pnl = Number(t.profit || 0);

      data[key].pnl += pnl;
      data[key].trades++;

      if (pnl > 0) {
        data[key].wins++;
      }
    }

    return Object.entries(data)
      .map(([month, v]) => ({
        month,
        pnl: v.pnl,
        trades: v.trades,
        winRate:
          v.trades > 0
            ? (v.wins / v.trades) * 100
            : 0,
      }))
      .sort((a, b) =>
        a.month.localeCompare(b.month)
      );
  }, [trades]);

  const bestMonth =
    months.length > 0
      ? [...months].sort((a, b) => b.pnl - a.pnl)[0]
      : null;

  const worstMonth =
    months.length > 0
      ? [...months].sort((a, b) => a.pnl - b.pnl)[0]
      : null;

  return (
    <div className="bg-slate-900 p-6 rounded-xl text-white">

      <h2 className="text-xl font-bold mb-4">
        Monthly Analysis
      </h2>

      <div className="grid md:grid-cols-2 gap-4 mb-4">

        {bestMonth && (
          <div className="bg-green-900/30 border border-green-700 p-4 rounded">
            <div className="text-sm text-gray-300">
              Best Month
            </div>

            <div className="text-xl font-bold text-green-400">
              {bestMonth.month}
            </div>

            <div>
              {bestMonth.pnl.toFixed(2)}
            </div>
          </div>
        )}

        {worstMonth && (
          <div className="bg-red-900/30 border border-red-700 p-4 rounded">
            <div className="text-sm text-gray-300">
              Worst Month
            </div>

            <div className="text-xl font-bold text-red-400">
              {worstMonth.month}
            </div>

            <div>
              {worstMonth.pnl.toFixed(2)}
            </div>
          </div>
        )}

      </div>

      <div className="space-y-2">

        {months.map((m) => (
          <div
            key={m.month}
            className="bg-slate-800 p-3 rounded flex justify-between items-center"
          >
            <div>{m.month}</div>

            <div>
              Trades: {m.trades}
            </div>

            <div>
              WR: {m.winRate.toFixed(1)}%
            </div>

            <div
              className={
                m.pnl >= 0
                  ? "text-green-400 font-bold"
                  : "text-red-400 font-bold"
              }
            >
              {m.pnl.toFixed(2)}
            </div>
          </div>
        ))}

      </div>

    </div>
  );
}