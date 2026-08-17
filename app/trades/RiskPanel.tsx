"use client";

import { useMemo, useState, useEffect } from "react";
import { useTrades } from "../context/TradesContext";

export default function RiskPanel() {
  const { trades } = useTrades() as any;

  const [profitTarget, setProfitTarget] = useState(5000);
  const [maxDDLimit, setMaxDDLimit] = useState(-2000);
  const [dailyLimit, setDailyLimit] = useState(-1000);

  function n(v: any) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }

  useEffect(() => {
    const saved = localStorage.getItem("riskSettings");

    if (saved) {
      const s = JSON.parse(saved);

      setProfitTarget(s.profitTarget ?? 5000);
      setMaxDDLimit(s.maxDD ?? -2000);
      setDailyLimit(s.dailyLimit ?? -1000);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "riskSettings",
      JSON.stringify({
        profitTarget,
        maxDD: maxDDLimit,
        dailyLimit,
      })
    );

    window.dispatchEvent(new Event("riskUpdated"));
  }, [profitTarget, maxDDLimit, dailyLimit]);

  const stats = useMemo(() => {
    let netPnL = 0;

    let grossWins = 0;
    let grossLosses = 0;

    let wins = 0;
    let losses = 0;

    let largestWinner = 0;
    let largestLoser = 0;

    let equity = 0;
    let peak = 0;
    let drawdown = 0;

    let totalR = 0;
    let rTrades = 0;

    let longTrades = 0;
    let shortTrades = 0;

    let longPnL = 0;
    let shortPnL = 0;

    let currentWinStreak = 0;
    let currentLossStreak = 0;

    let bestWinStreak = 0;
    let worstLossStreak = 0;

    const daily: Record<string, number> = {};

    const orderedTrades = [...(trades || [])].sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );

    for (const t of orderedTrades) {
      const p = n(t.profit);

      netPnL += p;

      equity += p;
      peak = Math.max(peak, equity);
      drawdown = Math.max(drawdown, peak - equity);

      largestWinner = Math.max(largestWinner, p);
      largestLoser = Math.min(largestLoser, p);

      if (p > 0) {
        wins++;
        grossWins += p;

        currentWinStreak++;
        currentLossStreak = 0;

        bestWinStreak = Math.max(
          bestWinStreak,
          currentWinStreak
        );
      }

      if (p < 0) {
        losses++;
        grossLosses += Math.abs(p);

        currentLossStreak++;
        currentWinStreak = 0;

        worstLossStreak = Math.max(
          worstLossStreak,
          currentLossStreak
        );
      }

      const risk = n(t.risk);

      if (risk > 0) {
        totalR += p / risk;
        rTrades++;
      }

      const side = String(
        t.direction || t.side || ""
      ).toLowerCase();

      if (
        side.includes("long") ||
        side.includes("buy")
      ) {
        longTrades++;
        longPnL += p;
      }

      if (
        side.includes("short") ||
        side.includes("sell")
      ) {
        shortTrades++;
        shortPnL += p;
      }

      const day =
        typeof t.date === "string"
          ? t.date.slice(0, 10)
          : "";

      if (day) {
        daily[day] = (daily[day] || 0) + p;
      }
    }

    const totalTrades = wins + losses;

    const winRate =
      totalTrades > 0
        ? (wins / totalTrades) * 100
        : 0;

    const avgWinner =
      wins > 0 ? grossWins / wins : 0;

    const avgLoser =
      losses > 0 ? grossLosses / losses : 0;

    const profitFactor =
      grossLosses > 0
        ? grossWins / grossLosses
        : 0;

    const expectancy =
      totalTrades > 0
        ? netPnL / totalTrades
        : 0;

    const avgR =
      rTrades > 0
        ? totalR / rTrades
        : 0;

    const recoveryFactor =
      drawdown > 0
        ? netPnL / drawdown
        : 0;

    let greenDays = 0;
    let redDays = 0;

    Object.values(daily).forEach((v) => {
      if (v >= 0) {
        greenDays++;
      } else {
        redDays++;
      }
    });

    const today =
      new Date().toISOString().slice(0, 10);

    return {
      netPnL,
      totalTrades,
      winRate,
      avgWinner,
      avgLoser,
      profitFactor,
      expectancy,
      avgR,
      recoveryFactor,
      drawdown,
      largestWinner,
      largestLoser,
      bestWinStreak,
      worstLossStreak,
      greenDays,
      redDays,
      longTrades,
      shortTrades,
      longPnL,
      shortPnL,
      todayPnL: daily[today] || 0,
    };
  }, [trades]);

  function Metric({
    label,
    value,
  }: {
    label: string;
    value: string;
  }) {
    return (
      <div className="bg-slate-800 p-4 rounded-xl">
        <div className="text-xs text-gray-400">
          {label}
        </div>

        <div className="text-xl font-bold">
          {value}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white p-6 rounded-xl space-y-6">

      <h2 className="text-xl font-bold">
        Professional Risk Analytics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div>
          <label>Profit Target</label>

          <input
            type="number"
            value={profitTarget}
            onChange={(e) =>
              setProfitTarget(Number(e.target.value))
            }
            className="w-full bg-slate-800 p-2 rounded mt-1"
          />
        </div>

        <div>
          <label>Max Drawdown Limit</label>

          <input
            type="number"
            value={maxDDLimit}
            onChange={(e) =>
              setMaxDDLimit(Number(e.target.value))
            }
            className="w-full bg-slate-800 p-2 rounded mt-1"
          />
        </div>

        <div>
          <label>Daily Loss Limit</label>

          <input
            type="number"
            value={dailyLimit}
            onChange={(e) =>
              setDailyLimit(Number(e.target.value))
            }
            className="w-full bg-slate-800 p-2 rounded mt-1"
          />
        </div>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">

        <Metric
          label="Net P&L"
          value={stats.netPnL.toFixed(2)}
        />

        <Metric
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
        />

        <Metric
          label="Profit Factor"
          value={stats.profitFactor.toFixed(2)}
        />

        <Metric
          label="Expectancy"
          value={stats.expectancy.toFixed(2)}
        />

        <Metric
          label="Avg R"
          value={stats.avgR.toFixed(2)}
        />

        <Metric
          label="Recovery Factor"
          value={stats.recoveryFactor.toFixed(2)}
        />

      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

        <Metric
          label="Largest Winner"
          value={stats.largestWinner.toFixed(2)}
        />

        <Metric
          label="Largest Loser"
          value={stats.largestLoser.toFixed(2)}
        />

        <Metric
          label="Max Drawdown"
          value={stats.drawdown.toFixed(2)}
        />

        <Metric
          label="Avg Winner"
          value={stats.avgWinner.toFixed(2)}
        />

        <Metric
          label="Avg Loser"
          value={stats.avgLoser.toFixed(2)}
        />

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Metric
          label="Best Win Streak"
          value={String(stats.bestWinStreak)}
        />

        <Metric
          label="Worst Loss Streak"
          value={String(stats.worstLossStreak)}
        />

        <Metric
          label="Long P&L"
          value={stats.longPnL.toFixed(2)}
        />

        <Metric
          label="Short P&L"
          value=