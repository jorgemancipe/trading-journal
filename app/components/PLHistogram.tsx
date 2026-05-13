"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Trade } from "../context/TradesContext";

type Bin = {
  range: string;
  count: number;
  mid: number; // midpoint used to color bin
};

function buildBins(values: number[], binCount = 10): Bin[] {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);

  // If all values are identical, create a single bin
  if (min === max) {
    return [
      {
        range: `${min.toFixed(2)} to ${max.toFixed(2)}`,
        count: values.length,
        mid: min,
      },
    ];
  }

  const width = (max - min) / binCount;

  // Create bin edges
  const bins: Bin[] = Array.from({ length: binCount }, (_, i) => {
    const start = min + i * width;
    const end = i === binCount - 1 ? max : start + width;
    const mid = (start + end) / 2;

    return {
      range: `${start.toFixed(2)} to ${end.toFixed(2)}`,
      count: 0,
      mid,
    };
  });

  // Count values per bin
  for (const v of values) {
    const idx =
      v === max ? binCount - 1 : Math.max(0, Math.min(binCount - 1, Math.floor((v - min) / width)));
    bins[idx].count += 1;
  }

  return bins;
}

export default function PLHistogram({ trades }: { trades: Trade[] }) {
  const profits = trades.map((t) => t.profit);

  if (profits.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm bg-white border rounded">
        No trades yet — P/L distribution will appear here.
      </div>
    );
  }

  const data = buildBins(profits, 10);

  return (
    <div className="w-full h-72 bg-white border rounded p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">P/L Distribution</h2>
        <div className="text-xs text-gray-500">
          Trades: <span className="font-semibold">{trades.length}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 18 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="range"
            angle={-20}
            textAnchor="end"
            interval={0}
            height={50}
            tick={{ fontSize: 10 }}
          />
          <YAxis allowDecimals={false} />
          <Tooltip
            formatter={(value: any) => [`${value}`, "Count"]}
            labelFormatter={(label) => `Range: ${label}`}
          />
          <Bar dataKey="count">
            {data.map((bin, i) => (
              <Cell
                key={i}
                fill={
                  bin.mid > 0 ? "#16a34a" : bin.mid < 0 ? "#dc2626" : "#6b7280"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-2 text-xs text-gray-500">
        Green bins = profitable ranges, Red bins = losing ranges.
      </div>
    </div>
  );
}

