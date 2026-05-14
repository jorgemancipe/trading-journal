"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";

export default function DashboardPage() {
  const { trades } = useTrades();

  const avgR = useMemo(() => {
    const valid = trades.filter((t) => t.risk > 0);
    if (!valid.length) return 0;
    return (
      valid.reduce((s, t) => s + t.profit / t.risk, 0) / valid.length
    );
  }, [trades]);

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="bg-white p-4 border rounded">
        <div className="text-sm text-gray-500">Average R</div>
        <div className={`text-3xl font-bold ${avgR >= 0 ? "text-green-700" : "text-red-700"}`}>
          {avgR.toFixed(2)}R
        </div>
      </div>
    </main>
  );
}
