"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";

export default function TradeCountByDate() {
  const ctx = useTrades() as any;
  const trades = Array.isArray(ctx?.trades) ? ctx.trades : [];

  const data = useMemo(() => {
    const counts: Record<
      string,
      {
        trades: number;
        pnl: number;
      }
    > = {};

    for (const t of trades) {
      const date = new Date(t.date)
        .toISOString()
        .slice(0, 10);

      if (!counts[date]) {
        counts[date] = {
          trades: 0,
          pnl: 0,
        };
      }

      counts[date].trades++;
      counts[date].pnl += Number(t.profit || 0);
    }

    return Object.entries(counts)
      .map(([date, v]) => ({
        date,
        trades: v.trades,
        pnl: v.pnl,
      }))
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      );
  }, [trades]);

  return (
    <div className="bg-slate-900 p-6 rounded-xl text-white">

      <h2 className="text-xl font-bold mb-4">
        Trade Count By Date
      </h2>

      <div className="space-y-2">

        {data.map((d) => (
          <div
            key={d.date}
            className="bg-slate-800 p-3 rounded flex justify-between items-center"
          >
            <div>
              {d.date}
            </div>

            <div>
              Trades:{" "}
              <b>{d.trades}</b>
            </div>

            <div
              className={
                d.pnl >= 0
                  ? "text-green-400 font-bold"
                  : "text-red-400 font-bold"
              }
            >
              {d.pnl.toFixed(2)}
            </div>
          </div>
        ))}

      </div>

    </div>
  );
}