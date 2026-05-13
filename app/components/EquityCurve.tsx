"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Trade } from "../context/TradesContext";

function buildEquityCurve(trades: Trade[]) {
  let cumulative = 0;

  return trades.map((t, index) => {
    cumulative += t.profit;
    return {
      trade: index + 1,
      equity: Number(cumulative.toFixed(2)),
    };
  });
}

export default function EquityCurve({ trades }: { trades: Trade[] }) {
  const data = buildEquityCurve(trades);

  if (data.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm bg-white border rounded">
        No trades yet — equity curve will appear here.
      </div>
    );
  }

  return (
    <div className="w-full h-64 bg-white border rounded p-4">
      <h2 className="text-sm font-semibold mb-2">Equity Curve</h2>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="trade" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="equity"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
