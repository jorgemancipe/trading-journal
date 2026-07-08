"use client";

import { useTrades } from "../context/TradesContext";
import { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";

export default function EquityChart() {
  const { trades } = useTrades() as any;

  const [mode, setMode] = useState<"NET" | "GROSS">("NET");

  const [maxDD, setMaxDD] = useState(-2000);
  const [dailyLimit, setDailyLimit] = useState(-1000);

  function n(v: any) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }

  function fmt(v: number) {
    return v.toFixed(2);
  }

  // ✅ REAL-TIME SYNC FIX
  useEffect(() => {
    function load() {
      const saved = localStorage.getItem("riskSettings");
      if (saved) {
        const s = JSON.parse(saved);
        setMaxDD(Number(s.maxDD) || -2000);
        setDailyLimit(Number(s.dailyLimit) || -1000);
      }
    }

    load();

    window.addEventListener("riskUpdated", load);

    return () => {
      window.removeEventListener("riskUpdated", load);
    };
  }, []);

  const data = useMemo(() => {
    let equity = 0;
    let peak = 0;

    return (trades || []).map((t: any, i: number) => {
      const pnl = mode === "NET" ? n(t.profit) : n(t.grossProfit || t.profit);

      equity += pnl;
      peak = Math.max(peak, equity);

      return {
        trade: i + 1,
        equity,
        peak,
        drawdown: equity - peak
      };
    });
  }, [trades, mode]);

  return (
    <div className="bg-slate-950 p-6 rounded-xl text-white space-y-4">

      <h2 className="text-xl font-bold">
        Equity + Drawdown
      </h2>

      <div className="flex gap-2">
        <button
          onClick={() => setMode("NET")}
          className="bg-green-600 px-3 py-1 rounded"
        >
          NET
        </button>
        <button
          onClick={() => setMode("GROSS")}
          className="bg-blue-600 px-3 py-1 rounded"
        >
          GROSS
        </button>
      </div>

      <div className="h-[400px]">

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>

            <CartesianGrid stroke="#1e293b" />
            <XAxis dataKey="trade" />
            <YAxis />

            <Tooltip />

            {/* ✅ Max DD */}
            <ReferenceLine
              y={maxDD}
              stroke="red"
              strokeDasharray="6 4"
            />

            {/* ✅ Daily Limit */}
            <ReferenceLine
              y={dailyLimit}
              stroke="#f59e0b"
              strokeDasharray="4 4"
            />

            {/* Equity */}
            <Area
              dataKey="equity"
              stroke="#22c55e"
              fill="#22c55e33"
              strokeWidth={3}
            />

            {/* Peak */}
            <Line
              dataKey="peak"
              stroke="#38bdf8"
              dot={false}
            />

            {/* Drawdown */}
            <Line
              dataKey="drawdown"
              stroke="#ef4444"
              dot={false}
            />

          </LineChart>
        </ResponsiveContainer>

      </div>

      {/* ✅ Values */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-4">

          <div>
            <div>Equity</div>
            <b>{fmt(data.at(-1).equity)}</b>
          </div>

          <div>
            <div>Drawdown</div>
            <b className="text-red-400">
              {fmt(data.at(-1).drawdown)}
            </b>
          </div>

          <div>
            <div>DD Limit</div>
            <b className="text-red-500">{fmt(maxDD)}</b>
          </div>

        </div>
      )}

    </div>
  );
}
