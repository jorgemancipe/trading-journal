"use client";

import { useEffect, useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function EquityChart() {
  const { trades } = useTrades() as any;

  const [mode, setMode] = useState<"NET" | "GROSS">("NET");
  const [maxDD, setMaxDD] = useState(-2000);
  const [dailyLimit, setDailyLimit] = useState(-1000);

  function n(value: any) {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
  }

  function fmt(value: number) {
    return value.toFixed(2);
  }

  useEffect(() => {
    function loadRiskSettings() {
      try {
        const saved = localStorage.getItem("riskSettings");

        if (!saved) return;

        const settings = JSON.parse(saved);

        setMaxDD(n(settings.maxDD) || -2000);
        setDailyLimit(n(settings.dailyLimit) || -1000);
      } catch {
        setMaxDD(-2000);
        setDailyLimit(-1000);
      }
    }

    loadRiskSettings();

    window.addEventListener("riskUpdated", loadRiskSettings);

    return () => {
      window.removeEventListener(
        "riskUpdated",
        loadRiskSettings
      );
    };
  }, []);

  const analytics = useMemo(() => {
    let equity = 0;
    let peak = 0;
    let maximumDrawdown = 0;

    const sortedTrades = [
      ...(Array.isArray(trades) ? trades : []),
    ].sort((a: any, b: any) => {
      return (
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
      );
    });
   

    const data = sortedTrades.map(
      (trade: any, index: number) => {
        const pnl =
          mode === "NET"
            ? n(trade.profit)
            : n(trade.grossProfit ?? trade.profit);

        equity += pnl;
        peak = Math.max(peak, equity);

        const drawdown = equity - peak;

        maximumDrawdown = Math.min(
          maximumDrawdown,
          drawdown
        );

        return {
          trade: index + 1,
          symbol: trade.symbol || "UNKNOWN",
          date:
            typeof trade.date === "string"
              ? trade.date.slice(0, 10)
              : "",
          pnl,
          equity,
          peak,
          drawdown,
        };
      }
    );

    return {
      data,
      currentEquity: equity,
      peak,
      maximumDrawdown,
      currentDrawdown:
        data.length > 0
          ? data[data.length - 1].drawdown
          : 0,
    };
  }, [trades, mode]);
 const dailyData = useMemo(() => {
  const byDay: Record<string, number> = {};

  for (const trade of trades || []) {
    const day =
      typeof trade.date === "string"
        ? trade.date.slice(0, 10)
        : "";

    const pnl =
      mode === "NET"
        ? n(trade.profit)
        : n(trade.grossProfit ?? trade.profit);

    byDay[day] = (byDay[day] || 0) + pnl;
  }

  let equity = 0;

  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, pnl]) => {
      equity += pnl;

      return {
        day,
        pnl,
        equity,
      };
    });
    }, [trades, mode]);
    
  return (
    <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl text-white space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">
            Equity and Drawdown
          </h2>

          <p className="text-sm text-slate-400">
            Cumulative trading performance
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("NET")}
            className={`px-4 py-2 rounded font-bold ${
              mode === "NET"
                ? "bg-green-600"
                : "bg-slate-800"
            }`}
          >
            NET
          </button>

          <button
            type="button"
            onClick={() => setMode("GROSS")}
            className={`px-4 py-2 rounded font-bold ${
              mode === "GROSS"
                ? "bg-blue-600"
                : "bg-slate-800"
            }`}
          >
            GROSS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric
          label="Current Equity"
          value={fmt(analytics.currentEquity)}
          color={
            analytics.currentEquity >= 0
              ? "text-green-400"
              : "text-red-400"
          }
        />

        <Metric
          label="High Watermark"
          value={fmt(analytics.peak)}
          color="text-sky-400"
        />

        <Metric
          label="Current Drawdown"
          value={fmt(analytics.currentDrawdown)}
          color="text-red-400"
        />

        <Metric
          label="Maximum Drawdown"
          value={fmt(analytics.maximumDrawdown)}
          color="text-red-500"
        />
      </div>

      {analytics.data.length === 0 ? (
        <div className="border border-dashed border-slate-700 rounded-xl p-10 text-center text-slate-400">
          Add or import trades to display the equity chart.
        </div>
      ) : (
        <div className="h-[400px] bg-slate-900 border border-slate-800 rounded-xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.data}>
              <CartesianGrid
                stroke="#1e293b"
                strokeDasharray="4 4"
              />

              <XAxis
                dataKey="trade"
                stroke="#94a3b8"
              />

              <YAxis stroke="#94a3b8" />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                labelFormatter={(value) =>
                  `Trade ${value}`
                }
                formatter={(value: any, name: any) => [
                  fmt(n(value)),
                  name,
                ]}
              />

              <ReferenceLine
                y={0}
                stroke="#64748b"
                strokeDasharray="4 4"
              />

              <ReferenceLine
                y={maxDD}
                stroke="#ef4444"
                strokeDasharray="6 4"
              />

              <ReferenceLine
                y={dailyLimit}
                stroke="#f59e0b"
                strokeDasharray="4 4"
              />

              <Area
                type="monotone"
                dataKey="equity"
                stroke="#22c55e"
                fill="#22c55e33"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="peak"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />

              <Line
                type="monotone"
                dataKey="drawdown"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {dailyData.length > 0 && (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
    <h3 className="font-semibold mb-4">
      Daily Equity Curve
    </h3>

    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dailyData}>
          <CartesianGrid
            stroke="#1e293b"
            strokeDasharray="4 4"
          />

          <XAxis
            dataKey="day"
            stroke="#94a3b8"
          />

          <YAxis
            stroke="#94a3b8"
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
            formatter={(value: any) => [
              fmt(n(value)),
              "Equity",
            ]}
          />

          <Line
            type="monotone"
            dataKey="equity"
            stroke="#22c55e"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
)}
      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        <span>Green: equity</span>
        <span>Blue: high watermark</span>
        <span>Red: drawdown</span>
        <span>Orange: daily loss limit</span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="text-xs text-slate-400">
        {label}
      </div>

      <div className={`text-xl font-bold mt-1 ${color}`}>
        {value}
      </div>
    </div>
  );
}