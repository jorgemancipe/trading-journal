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

function maxDD(curve: number[]) {
  let peak = 0, max = 0;
  for (const v of curve) {
    if (v > peak) peak = v;
    const dd = (peak - v) / (peak || 1);
    if (dd > max) max = dd;
  }
  return max;
}

function notify(msg: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(msg);
  }
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();

  const [alert, setAlert] = useState("");
  const [lastAlert, setLastAlert] = useState("");

  const validTrades = useMemo(
    () => trades.filter(t => t.risk > 0),
    [trades]
  );

  /* ---------- metrics ---------- */

  const avg = avgR(validTrades);
  const curve = equity(validTrades);
  const dd = maxDD(curve);

  /* ✅ Rolling edge (recent performance) */
  const recentTrades = validTrades.slice(-20);
  const recentAvg = avgR(recentTrades);

  /* ---------- Pro Alert Engine ---------- */

  useEffect(() => {
    let msg = "";

    /* ✅ GREEN */
    if (avg > 0.3 && dd < 0.1 && recentAvg >= avg) {
      msg = "✅ STRONG SYSTEM — Trade aggressively";
    }

    /* ⚠️ YELLOW */
    else if (avg > 0 && dd < 0.2) {
      msg = "⚠️ DEFENSIVE MODE — Reduce size";
    }

    /* 🚨 RED */
    if (avg <= 0 || dd >= 0.25) {
      msg = "🚨 STOP — System OFF";
    }

    /* ⚡ BREAKDOWN ALERT */
    if (recentAvg < avg * 0.5) {
      msg = "⚡ BREAKDOWN DETECTED — Sudden performance drop";
    }

    /* 📉 EDGE DECAY */
    if (recentAvg < avg) {
      msg = "📉 EDGE DECAY — Performance weakening";
    }

    setAlert(msg);

    if (msg !== lastAlert) {
      notify(msg);
      setLastAlert(msg);
    }
  }, [avg, dd, recentAvg]);

  /* ✅ request notification permission */
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  /* ---------- UI ---------- */

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">
        🚨 Pro Alert Engine
      </h1>

      {/* Alert */}
      {alert && (
        <div
          className={`p-4 rounded mb-6 text-white font-semibold ${
            alert.includes("STOP")
              ? "bg-red-600"
              : alert.includes("BREAKDOWN")
              ? "bg-purple-600"
              : alert.includes("DECAY")
              ? "bg-orange-500"
              : alert.includes("DEFENSIVE")
              ? "bg-yellow-500"
              : "bg-green-600"
          }`}
        >
          {alert}
        </div>
      )}

      {/* Metrics */}
      <div className="bg-white border rounded p-4 space-y-2">

        <h2 className="font-semibold">System Metrics</h2>

        <div>Avg R: {avg.toFixed(2)}</div>
        <div>Recent Avg R: {recentAvg.toFixed(2)}</div>
        <div>Drawdown: {(dd * 100).toFixed(1)}%</div>

      </div>

      {/* Guidance */}
      <div className="bg-white border rounded p-4 mt-6">

        <h2 className="font-semibold mb-2">Trading Instructions</h2>

        <div className="text-sm space-y-1">
          <div>✅ GREEN → Trade normally / increase size</div>
          <div>⚠️ YELLOW → Reduce risk / selective trades</div>
          <div>🚨 RED → Do NOT trade</div>
          <div>⚡ BREAKDOWN → Stop immediately, review system</div>
          <div>📉 EDGE DECAY → Avoid scaling up</div>
        </div>

      </div>

    </main>
  );
}
