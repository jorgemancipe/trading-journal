"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";

export default function SessionAnalysis() {
  const ctx = useTrades() as any;
  const trades = Array.isArray(ctx?.trades) ? ctx.trades : [];

  const sessions = useMemo(() => {
    const data = {
      Open: 0,
      Midday: 0,
      PowerHour: 0,
      AfterHours: 0,
    };

    for (const t of trades) {
      const date = new Date(t.date);
      const hour = date.getHours();

      const pnl = Number(t.profit || 0);

      if (hour >= 9 && hour < 11) {
        data.Open += pnl;
      } else if (hour >= 11 && hour < 14) {
        data.Midday += pnl;
      } else if (hour >= 14 && hour < 16) {
        data.PowerHour += pnl;
      } else {
        data.AfterHours += pnl;
      }
    }

    return data;
  }, [trades]);

  const bestSession = Object.entries(sessions).sort(
    (a, b) => b[1] - a[1]
  )[0];

  return (
    <div className="bg-slate-900 p-6 rounded-xl text-white">

      <h2 className="text-xl font-bold mb-4">
        Session Analysis
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {Object.entries(sessions).map(([name, pnl]) => (
          <div
            key={name}
            className="bg-slate-800 p-4 rounded-lg"
          >
            <div className="text-sm text-gray-400">
              {name}
            </div>

            <div
              className={`text-2xl font-bold ${
                pnl >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {pnl.toFixed(2)}
            </div>
          </div>
        ))}

      </div>

      {bestSession && (
        <div className="mt-4 bg-green-900/30 border border-green-700 p-3 rounded-lg">
          <span className="font-bold">
            ✅ Best Session:
          </span>{" "}
          {bestSession[0]}
        </div>
      )}

    </div>
  );
}