"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DailyScoreChart() {
  const ctx = useTrades() as any;
  const trades = Array.isArray(ctx?.trades) ? ctx.trades : [];

  const data = useMemo(() => {
    const byDay: Record<
      string,
      {
        pnl: number;
        trades: number;
        wins: number;
        losses: number;
      }
    > = {};

    for (const t of trades) {
      const day = new Date(t.date)
        .toISOString()
        .slice(0, 10);

      if (!byDay[day]) {
        byDay[day] = {
          pnl: 0,
          trades: 0,
          wins: 0,
          losses: 0,
        };
      }

      const p = Number(t.profit || 0);

      byDay[day].pnl += p;
      byDay[day].trades++;

      if (p > 0) byDay[day].wins++;
      if (p < 0) byDay[day].losses++;
    }

    return Object.entries(byDay)
      .map(([date, d]) => {
        let score = 100;

        const winRate =
          d.trades > 0
            ? (d.wins / d.trades) * 100
            : 0;

        if (d.pnl < 0) score -= 25;
        if (winRate < 40) score -= 20;
        if (d.losses >= 3) score -= 15;
        if (d.trades > 10) score -= 10;

        score = Math.max(
          0,
          Math.min(100, score)
        );

        return {
          date,
          score,
        };
      })
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      );
  }, [trades]);

  return (
    <div className="bg-slate-900 p-6 rounded-xl text-white">

      <h2 className="text-xl font-bold mb-4">
        Daily Discipline Score
      </h2>

      <div className="h-[300px]">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart data={data}>

            <CartesianGrid
              stroke="#334155"
              strokeDasharray="3 3"
            />

            <XAxis dataKey="date" />

            <YAxis domain={[0, 100]} />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="score"
              stroke="#22c55e"
              strokeWidth={3}
            />

          </LineChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}