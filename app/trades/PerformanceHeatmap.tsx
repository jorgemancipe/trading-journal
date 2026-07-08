"use client";

import { useTrades } from "../context/TradesContext";

export default function PerformanceHeatmap() {
  const { trades } = useTrades();

  // group by date
  const data: Record<string, number> = {};

  trades.forEach((t) => {
    const d = new Date(t.date).toISOString().split("T")[0];
    data[d] = (data[d] || 0) + (Number(t.profit) || 0);
  });

  const dates = Object.keys(data);

  function getColor(v: number) {
    if (v > 0) return "bg-green-500";
    if (v < 0) return "bg-red-500";
    return "bg-gray-300";
  }

  return (
    <div className="mt-6 bg-white border rounded-xl shadow p-6">

      {/* ✅ FIXED TITLE */}
      <h2 className="text-xl font-bold text-black mb-4">
        Performance Heatmap
      </h2>

      {/* Empty case */}
      {dates.length === 0 && (
        <div className="text-gray-600 text-sm">
          No data available yet.
        </div>
      )}

      {/* Heatmap */}
      <div className="grid grid-cols-7 gap-2">
        {dates.map((d) => {
          const val = data[d];

          return (
            <div
              key={d}
              title={`${d}: ${val.toFixed(2)}`}
              className={`h-10 w-full rounded text-center text-xs font-bold text-white flex items-center justify-center ${getColor(val)}`}
            >
              {val.toFixed(0)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
