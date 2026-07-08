"use client";

import { useMemo, useState, useEffect } from "react";
import { useTrades } from "../context/TradesContext";

export default function RiskPanel() {
  const { trades } = useTrades() as any;

  const [profitTarget, setProfitTarget] = useState(5000);
  const [maxDD, setMaxDD] = useState(-2000);
  const [dailyLimit, setDailyLimit] = useState(-1000);

  function n(v: any) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }

  // ✅ Load settings
  useEffect(() => {
    const saved = localStorage.getItem("riskSettings");
    if (saved) {
      const s = JSON.parse(saved);
      setProfitTarget(s.profitTarget ?? 5000);
      setMaxDD(s.maxDD ?? -2000);
      setDailyLimit(s.dailyLimit ?? -1000);
    }
  }, []);

  // ✅ Save + trigger real-time update
  useEffect(() => {
    const data = { profitTarget, maxDD, dailyLimit };

    localStorage.setItem("riskSettings", JSON.stringify(data));

    // 🔥 THIS FIXES YOUR PROBLEM
    window.dispatchEvent(new Event("riskUpdated"));

  }, [profitTarget, maxDD, dailyLimit]);

  // ✅ Stats
  const stats = useMemo(() => {
    let balance = 0;
    const daily: Record<string, number> = {};

    for (const t of trades || []) {
      const p = n(t.profit);
      balance += p;

      const day = new Date(t.date).toISOString().slice(0, 10);
      daily[day] = (daily[day] || 0) + p;
    }

    const today = new Date().toISOString().slice(0, 10);

    return {
      balance,
      todayPnL: daily[today] || 0
    };
  }, [trades]);

  return (
    <div className="bg-slate-900 text-white p-6 rounded-xl">

      <h2 className="text-xl font-bold mb-4">
        Prop Risk System
      </h2>

      <div className="grid grid-cols-3 gap-4">

        <div>
          <label className="text-sm">Profit Target</label>
          <input
            type="number"
            value={profitTarget}
            onChange={(e) => setProfitTarget(Number(e.target.value))}
            className="w-full bg-slate-800 p-2 rounded mt-1"
          />
        </div>

        <div>
          <label className="text-sm">Max Drawdown</label>
          <input
            type="number"
            value={maxDD}
            onChange={(e) => setMaxDD(Number(e.target.value))}
            className="w-full bg-slate-800 p-2 rounded mt-1"
          />
        </div>

        <div>
          <label className="text-sm">Daily Loss</label>
          <input
            type="number"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(Number(e.target.value))}
            className="w-full bg-slate-800 p-2 rounded mt-1"
          />
        </div>

      </div>

      <div className="mt-4 space-y-2">

        <div>Balance: <b>{stats.balance.toFixed(2)}</b></div>
        <div>Today: <b>{stats.todayPnL.toFixed(2)}</b></div>

      </div>

    </div>
  );
}
``