"use client";

import { useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
function f(v: number) {
  return v.toFixed(2);
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Dashboard() {
  const ctx = useTrades() as any;
  const trades = Array.isArray(ctx?.trades) ? ctx.trades : [];

  const [mode, setMode] = useState<"NET" | "GROSS">("NET");

  const pnl = (t: any) =>
    mode === "NET" ? n(t.profit) : n(t.grossProfit || t.profit);

  const stats = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let winSum = 0;
    let lossSum = 0;
    let equity = 0;
    let peak = 0;
    let maxDD = 0;
    let winStreak = 0;
    let lossStreak = 0;
    let maxWin = 0;
    let maxLoss = 0;

    const byHour: any = {};
    const byDay: any = {};
    const bySymbol: any = {};
    const byDate: Record<
      string,
      {
        pnl: number;
        trades: number;
        wins: number;
        losses: number;
      }
    > = {};

    let totalFees = 0;

    for (const t of trades) {
      const p = pnl(t);

      equity += p;
      peak = Math.max(peak, equity);
      maxDD = Math.max(maxDD, peak - equity);

      if (p > 0) {
        wins++;
        winSum += p;
        winStreak++;
        lossStreak = 0;
      } else if (p < 0) {
        losses++;
        lossSum += Math.abs(p);
        lossStreak++;
        winStreak = 0;
      }

      maxWin = Math.max(maxWin, winStreak);
      maxLoss = Math.max(maxLoss, lossStreak);

      const d = new Date(t.date);
      const hour = d.getHours();
      const day = d.getDay();
      const dateKey = d.toISOString().slice(0, 10);
      const symbol = t.symbol || "UNK";

      if (!byHour[hour]) byHour[hour] = { pnl: 0 };
      if (!byDay[day]) byDay[day] = { pnl: 0 };
      if (!bySymbol[symbol]) bySymbol[symbol] = { pnl: 0 };
      if (!byDate[dateKey]) byDate[dateKey] = { pnl: 0, trades: 0, wins: 0, losses: 0 };

      byHour[hour].pnl += p;
      byDay[day].pnl += p;
      bySymbol[symbol].pnl += p;

      byDate[dateKey].pnl += p;
      byDate[dateKey].trades += 1;
      if (p > 0) byDate[dateKey].wins += 1;
      if (p < 0) byDate[dateKey].losses += 1;

      totalFees += n(t.fees);
    }

    const total = trades.length || 0;
    const winRate = total ? (wins / total) * 100 : 0;
    const avgWin = wins ? winSum / wins : 0;
    const avgLoss = losses ? lossSum / losses : 0;
    const pf = lossSum ? winSum / lossSum : 0;

    const bestHour = Object.entries(byHour).sort((a: any, b: any) => b[1].pnl - a[1].pnl)[0];
    const worstHour = Object.entries(byHour).sort((a: any, b: any) => a[1].pnl - b[1].pnl)[0];

    const bestDay = Object.entries(byDay).sort((a: any, b: any) => b[1].pnl - a[1].pnl)[0];
    const worstDay = Object.entries(byDay).sort((a: any, b: any) => a[1].pnl - b[1].pnl)[0];

    const bestSymbol = Object.entries(bySymbol).sort((a: any, b: any) => b[1].pnl - a[1].pnl)[0];
    const worstSymbol = Object.entries(bySymbol).sort((a: any, b: any) => a[1].pnl - b[1].pnl)[0];

    // ✅ Daily scoring engine
    const dailyScores = Object.entries(byDate)
      .map(([date, d]: any) => {
        let score = 100;

        const dailyWinRate = d.trades ? (d.wins / d.trades) * 100 : 0;

        if (d.pnl < 0) score -= 25;
        if (dailyWinRate < 40) score -= 20;
        if (d.losses >= 3) score -= 15;
        if (d.trades > 10) score -= 10; // overtrading signal
        if (d.pnl > 0 && dailyWinRate > 60) score += 5;

        score = Math.max(0, Math.min(100, Math.round(score)));

        return {
          date,
          pnl: d.pnl,
          trades: d.trades,
          winRate: dailyWinRate,
          score,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    const latestDailyScore = dailyScores.length
      ? dailyScores[dailyScores.length - 1]
      : null;

    return {
      pnl: equity,
      winRate,
      avgWin,
      avgLoss,
      pf,
      maxDD,
      maxWin,
      maxLoss,
      total,
      totalFees,
      bestHour,
      worstHour,
      bestDay,
      worstDay,
      bestSymbol,
      worstSymbol,
      dailyScores,
      latestDailyScore,
    };
  }, [trades, mode]);

  const { score, breakdown } = useMemo(() => {
    let s = 100;
    const notes: { text: string; impact: number }[] = [];

    if (stats.winRate < 40) {
      s -= 25;
      notes.push({ text: "Low win rate", impact: -25 });
    } else if (stats.winRate < 50) {
      s -= 10;
      notes.push({ text: "Below average win rate", impact: -10 });
    } else {
      notes.push({ text: "Strong win rate", impact: +5 });
    }

    if (stats.pf < 1) {
      s -= 30;
      notes.push({ text: "Unprofitable edge", impact: -30 });
    } else if (stats.pf < 1.5) {
      s -= 10;
      notes.push({ text: "Weak profitability", impact: -10 });
    } else {
      notes.push({ text: "Strong profitability", impact: +10 });
    }

    if (stats.avgLoss > stats.avgWin) {
      s -= 20;
      notes.push({ text: "Losses larger than wins", impact: -20 });
    } else {
      notes.push({ text: "Good risk control", impact: +5 });
    }

    if (stats.maxDD > Math.abs(stats.pnl)) {
      s -= 15;
      notes.push({ text: "High drawdown vs PnL", impact: -15 });
    }

    if (stats.maxLoss >= 3) {
      s -= 10;
      notes.push({ text: "Losing streak behavior", impact: -10 });
    }

    return { score: Math.max(0, Math.round(s)), breakdown: notes };
  }, [stats]);

  const insights: string[] = [];

  if (stats.winRate < 40) insights.push("⚠️ Low win rate — improve trade selection.");
  if (stats.avgLoss > stats.avgWin) insights.push("⚠️ Losses bigger than wins — fix exits.");
  if (stats.pf < 1) insights.push("🚨 Strategy not profitable.");
  if (stats.bestHour) insights.push(`✅ Best hour: ${stats.bestHour[0]}:00`);
  if (stats.worstHour) insights.push(`⚠️ Avoid hour: ${stats.worstHour[0]}:00`);
  if (stats.bestDay) insights.push(`✅ Best day: ${DAY_NAMES[+stats.bestDay[0]]}`);
  if (stats.worstDay) insights.push(`⚠️ Weak day: ${DAY_NAMES[+stats.worstDay[0]]}`);
  if (stats.bestSymbol) insights.push(`✅ Top symbol: ${stats.bestSymbol[0]}`);
  if (stats.worstSymbol) insights.push(`⚠️ Weak symbol: ${stats.worstSymbol[0]}`);
  if (stats.totalFees > Math.abs(stats.pnl) * 0.25) insights.push("💸 Fees too high — reduce overtrading.");
  if (insights.length === 0) insights.push("✅ Trading looks stable — maintain discipline.");

  const coach: string[] = [];
  if (stats.maxLoss >= 3) coach.push("🚨 Stop trading after 2 losses — avoid tilt.");
  if (stats.pf < 1) coach.push("❌ Reduce size until profitable.");
  if (stats.total > 20) coach.push("⚠️ High trade count — possible overtrading.");
  if (stats.avgLoss > stats.avgWin) coach.push("⚠️ Cut losers faster.");
  if (coach.length === 0) coach.push("✅ Behavior stable — stay consistent.");

  function scoreColor() {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  }

  function scoreLabel() {
    if (score >= 85) return "A - Excellent";
    if (score >= 70) return "B - Good";
    if (score >= 50) return "C - Average";
    if (score >= 30) return "D - Weak";
    return "F - Failing";
  }

  function dailyScoreColor(score: number) {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  }

  return (
    <div className="bg-slate-950 text-white p-6 rounded-2xl space-y-6">
      {/* HEADER */}
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Trading Dashboard</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setMode("NET")}
            className={`px-3 py-2 rounded ${mode === "NET" ? "bg-green-600" : "bg-slate-800"}`}
          >
            NET
          </button>

          <button
            onClick={() => setMode("GROSS")}
            className={`px-3 py-2 rounded ${mode === "GROSS" ? "bg-blue-600" : "bg-slate-800"}`}
          >
            GROSS
          </button>
        </div>
      </div>

      {/* SCORE */}
      <div className="bg-purple-900/40 border border-purple-700 p-6 rounded-xl text-center">
        <div className="text-sm text-gray-300">Trading Score</div>
        <div className={`text-5xl font-extrabold ${scoreColor()}`}>{score}</div>
        <div className="text-lg mt-2">{scoreLabel()}</div>
      </div>

      {/* DAILY SCORE */}
      <div className="bg-slate-900 p-4 rounded-xl">
        <h3 className="font-bold mb-3">📅 Daily Performance Score</h3>

        {stats.latestDailyScore ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-lg">
              <div>
                <div className="text-sm text-gray-400">Latest Day</div>
                <div className="font-bold">{stats.latestDailyScore.date}</div>
              </div>

              <div>
                <div className="text-sm text-gray-400">P&amp;L</div>
                <div className={stats.latestDailyScore.pnl >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {f(stats.latestDailyScore.pnl)}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400">Trades</div>
                <div className="font-bold">{stats.latestDailyScore.trades}</div>
              </div>

              <div>
                <div className="text-sm text-gray-400">Score</div>
                <div className={`text-2xl font-extrabold ${dailyScoreColor(stats.latestDailyScore.score)}`}>
                  {stats.latestDailyScore.score}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {stats.dailyScores.slice(-5).map((d: any) => (
                <div key={d.date} className="bg-slate-800 p-3 rounded-lg text-center">
                  <div className="text-xs text-gray-400">{d.date}</div>
                  <div className={`text-xl font-bold ${dailyScoreColor(d.score)}`}>{d.score}</div>
                  <div className="text-xs">{f(d.pnl)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-gray-400">No daily data yet.</div>
        )}
      </div>

      {/* SCORE BREAKDOWN */}
      <div className="bg-slate-900 p-4 rounded-xl">
        <h3 className="font-bold mb-3">📊 Score Breakdown</h3>

        <div className="space-y-2 text-sm">
          {breakdown.map((b, i) => (
            <div
              key={i}
              className={`flex justify-between px-3 py-2 rounded ${
                b.impact < 0 ? "bg-red-900/40" : "bg-green-900/40"
              }`}
            >
              <span>{b.text}</span>
              <span className={b.impact < 0 ? "text-red-400" : "text-green-400"}>
                {b.impact > 0 ? "+" : ""}
                {b.impact}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Metric label="Win %" value={stats.winRate.toFixed(1) + "%"} />
        <Metric label="PF" value={f(stats.pf)} />
        <Metric label="Avg Win" value={f(stats.avgWin)} />
        <Metric label="Avg Loss" value={f(stats.avgLoss)} />
        <Metric label="Drawdown" value={f(stats.maxDD)} />
      </div>

      {/* AI INSIGHTS */}
      <div className="bg-slate-900 p-4 rounded-xl">
        <h3 className="font-bold mb-2">🤖 AI Insights</h3>
        {insights.map((x, i) => (
          <div key={i}>{x}</div>
        ))}
      </div>

      {/* AI COACH */}
      <div className="bg-purple-900 p-4 rounded-xl">
        <h3 className="font-bold mb-2">🧠 AI Trading Coach</h3>
        {coach.map((x, i) => (
          <div key={i}>{x}</div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: any) {
  return (
    <div className="bg-slate-900 p-4 rounded-xl">
      <div className="text-gray-400 text-xs">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}