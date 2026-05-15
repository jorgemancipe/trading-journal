"use client";

import { useMemo, useState, useEffect } from "react";
import { useTrades } from "../context/TradesContext";

/* ---------- helpers ---------- */

function avgR(trades: { profit: number; risk: number }[]) {
  if (!trades.length) return 0;
  return trades.reduce((s, t) => s + t.profit / t.risk, 0) / trades.length;
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

/* ✅ trigger browser notification */
function notify(message: string) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(message);
  }
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const [alert, setAlert] = useState<string | null>(null);
  const [lastAlert, setLastAlert] = useState<string | null>(null);

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  const avg = avgR(validTrades);
  const curve = equity(validTrades);
  const dd = maxDrawdown(curve);

  /* ✅ request permission once */
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  /* ✅ alert logic */
  useEffect(() => {
    let message = "";

    if (avg <= 0 || dd >= 0.25) {
      message = "❌ STOP TRADING — Edge lost or risk too high";
    } else if (avg < 0.2 || dd >= 0.15) {
      message = "⚠️ CAUTION — Reduce size";
    } else {
      message = "✅ SYSTEM OK — Trade allowed";
    }

    setAlert(message);

    /* ✅ only notify if changed */
    if (message !== lastAlert) {
      notify(message);
      setLastAlert(message);
    }
  }, [avg, dd]);

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">
        🔔 Live Alert System
      </h1>

      {alert && (
        <div
          className={`p-4 rounded mb-6 text-white font-semibold ${
            alert.includes("STOP")
              ? "bg-red-600"
              : alert.includes("CAUTION")
              ? "bg-yellow-500"
              : "bg-green-600"
          }`}
        >
          {alert}
        </div>
      )}

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Live Metrics</h2>

        <div>Avg R: {avg.toFixed(2)}</div>
        <div>Drawdown: {(dd * 100).toFixed(1)}%</div>
      </div>

    </main>
  );
}
