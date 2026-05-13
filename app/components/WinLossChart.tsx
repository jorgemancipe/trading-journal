"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Trade } from "../context/TradesContext";

export default function WinLossChart({ trades }: { trades: Trade[] }) {
  const wins = trades.filter((t) => t.profit > 0).length;
  const losses = trades.filter((t) => t.profit < 0).length;
  const breakeven = trades.filter((t) => t.profit === 0).length;

  const total = trades.length;

  if (total === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm bg-white border rounded">
        No trades yet — win/loss chart will appear here.
      </div>
    );
  }

  const data = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
    { name: "Break-even", value: breakeven },
  ].filter((d) => d.value > 0);

  const COLORS = ["#16a34a", "#dc2626", "#6b7280"]; // green, red, gray

  return (
    <div className="w-full h-64 bg-white border rounded p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">Win / Loss Distribution</h2>
        <div className="text-xs text-gray-500">
          Total: <span className="font-semibold">{total}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
