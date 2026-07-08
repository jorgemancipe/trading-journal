"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";

export default function CalendarHeatmap() {
  const ctx = useTrades() as any;
  const trades = Array.isArray(ctx?.trades) ? ctx.trades : [];

  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};

    for (const t of trades) {
      const date = new Date(t.date)
        .toISOString()
        .slice(0, 10);

      days[date] = (days[date] || 0) + Number(t.profit || 0);
    }

    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, pnl]) => ({
        date,
        pnl,
      }));
  }, [trades]);

  function getColor(pnl: number) {
    if (pnl > 500) return "bg-green-600";
    if (pnl > 0) return "bg-green-400";
    if (pnl < -500) return "bg-red-600";
    if (pnl < 0) return "bg-red-400";
    return "bg-yellow-500";
  }

  return (
    <div className="bg-slate-900 p-6 rounded-xl text-white">

      <h2 className="text-xl font-bold mb-4">
        Trading Calendar Heatmap
      </h2>

      <div className="grid grid-cols-7 gap-2">

        {dailyData.map((d) => (
          <div
            key={d.date}
            className={`
              ${getColor(d.pnl)}
              rounded-lg
              p-2
              text-center
              text-xs
              min-h-[70px]
              flex
              flex-col
              justify-center
            `}
            title={`${d.date} | ${d.pnl.toFixed(2)}`}
          >
            <div>
              {d.date.slice(8)}
            </div>

            <div className="font-bold">
              {d.pnl.toFixed(0)}
            </div>
          </div>
        ))}

      </div>

      <div className="mt-4 flex gap-4 text-xs">

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded"></div>
          Strong Win
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          Win
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          Breakeven
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 rounded"></div>
          Loss
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          Large Loss
        </div>

      </div>

    </div>
  );
}
