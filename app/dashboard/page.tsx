"use client";

import { useMemo, useState, useEffect } from "react";
import { useTrades } from "../context/TradesContext";

/* ---------- helpers ---------- */

function avgR(trades: { profit: number; risk: number }[]) {
  if (!trades.length) return 0;
  return trades.reduce((s, t) => s + t.profit / t.risk, 0) / trades.length;
}

function winRate(trades: { profit: number }[]) {
  if (!trades.length) return 0;
  return trades.filter(t => t.profit > 0).length / trades.length;
}

function equity(trades: { profit: number }[]) {
  let e = 0;
  return trades.map(t => (e += t.profit));
}

function maxDrawdown(curve: number[]) {
  let peak = 0;
  let maxDD = 0;

  for (const v of curve) {
    if (v > peak) peak = v;
    const dd = (peak - v) / (peak || 1);
    if (dd > maxDD) maxDD = dd;
  }

  return maxDD;
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const [alert, setAlert] = useState<string | null>(null);

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ---------- metrics ---------- */

  const avg = avgR(validTrades);
  const wr = winRate(validTrades);

  const curve = equity(validTrades);
  const dd = maxDrawdown(curve);

  /* ---------- system logic ---------- */

  const edgeStrong = avg > 0.2;
  const edgeWeak = avg > 0 && avg <= 0.2;
  const noEdge = avg <= 0;

  const safeDD = dd < 0.15;
  const warningDD = dd >= 0.15 && dd < 0.25;
  const badDD = dd >= 0.25;

  /* ---------- alert engine ---------- */

  useEffect(() => {
    if (noEdge || badDD) {
      setAlert("❌ STOP TRADING — Edge lost or drawdown too high");
    } else if (edgeWeak || warningDD) {
      setAlert("⚠️ CAUTION — Reduce risk / be selective");
    } else if (edgeStrong && safeDD) {
      setAlert("✅ SYSTEM OK — You can trade");
    }
  }, [avg, dd]);

  /* ✅ optional browser alert */
  useEffect(() => {
    if (!alert) return;

    // basic notification (safe)
    console.log("ALERT:", alert);
  }, [alert]);

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">
        Live Trading Alerts
      </h1>

      {/* Alert banner */}
      {alert && (
        <div className={`p-4 rounded mb-6 text-white font-semibold ${
          alert.includes("STOP")
            ? "bg-red-600"
            : alert.includes("CAUTION")
            ? "bg-yellow-500"
            : "bg-green-600"
        }`}>
          {alert}
        </div>
      )}

      {/* Metrics */}
      <div className="bg-white border rounded p-4 space-y-2">

        <h2 className="font-semibold">Live Metrics</h2>

        <div>Avg R: {avg.toFixed(2)}</div>
        <div>Win Rate: {(wr * 100).toFixed(1)}%</div>
        <div>Drawdown: {(dd * 100).toFixed(1)}%</div>

      </div>

      {/* Interpretation */}
      <div className="bg-white border rounded p-4 mt-6">

        <h2 className="font-semibold mb-2">How to Use</h2>

        <div className="text-sm space-y-1">
          <div>✅ Trade normally when system is GREEN</div>
          <div>⚠️ Reduce size when system is YELLOW</div>
          <div>❌ Stop trading when system is RED</div>
        </div>

      </div>

    </main>
  );
}
