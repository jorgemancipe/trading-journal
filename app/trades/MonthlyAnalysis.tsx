"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlyResult = {
  month: string;
  pnl: number;
  trades: number;
  winRate: number;
};

type StrategyResult = {
  strategy: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  averagePnL: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
};

function numberValue(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function money(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function dateValue(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const dateText = value.slice(0, 10);
  const parts = dateText.split("-");

  if (parts.length !== 3) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return {
    year,
    month,
    key: `${year}-${String(month).padStart(2, "0")}`,
  };
}

function strategyName(value: unknown) {
  const name = String(value || "").trim();

  return name || "Unassigned";
}

export default function MonthlyAnalysis() {
  const context = useTrades() as any;
  const trades = Array.isArray(context?.trades)
    ? context.trades
    : [];

  const months = useMemo<MonthlyResult[]>(() => {
    const results: Record<
      string,
      {
        pnl: number;
        trades: number;
        wins: number;
      }
    > = {};

    for (const trade of trades) {
      const parsedDate = dateValue(trade.date);

      if (!parsedDate) {
        continue;
      }

      if (!results[parsedDate.key]) {
        results[parsedDate.key] = {
          pnl: 0,
          trades: 0,
          wins: 0,
        };
      }

      const pnl = numberValue(trade.profit);

      results[parsedDate.key].pnl += pnl;
      results[parsedDate.key].trades += 1;

      if (pnl > 0) {
        results[parsedDate.key].wins += 1;
      }
    }

    return Object.entries(results)
      .map(([month, result]) => ({
        month,
        pnl: result.pnl,
        trades: result.trades,
        winRate:
          result.trades > 0
            ? (result.wins / result.trades) * 100
            : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [trades]);

  const strategies = useMemo<StrategyResult[]>(() => {
    const results: Record<
      string,
      {
        pnl: number;
        trades: number;
        wins: number;
        losses: number;
        grossProfit: number;
        grossLoss: number;
      }
    > = {};

    for (const trade of trades) {
      const strategy = strategyName(trade.strategy);
      const pnl = numberValue(trade.profit);

      if (!results[strategy]) {
        results[strategy] = {
          pnl: 0,
          trades: 0,
          wins: 0,
          losses: 0,
          grossProfit: 0,
          grossLoss: 0,
        };
      }

      results[strategy].pnl += pnl;
      results[strategy].trades += 1;

      if (pnl > 0) {
        results[strategy].wins += 1;
        results[strategy].grossProfit += pnl;
      } else if (pnl < 0) {
        results[strategy].losses += 1;
        results[strategy].grossLoss += Math.abs(pnl);
      }
    }

    return Object.entries(results)
      .map(([strategy, result]) => ({
        strategy,
        pnl: result.pnl,
        trades: result.trades,
        wins: result.wins,
        losses: result.losses,
        winRate:
          result.trades > 0
            ? (result.wins / result.trades) * 100
            : 0,
        averagePnL:
          result.trades > 0
            ? result.pnl / result.trades
            : 0,
        grossProfit: result.grossProfit,
        grossLoss: result.grossLoss,
        profitFactor:
          result.grossLoss > 0
            ? result.grossProfit / result.grossLoss
            : result.grossProfit > 0
            ? result.grossProfit
            : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const bestMonth =
    months.length > 0
      ? [...months].sort((a, b) => b.pnl - a.pnl)[0]
      : null;

  const worstMonth =
    months.length > 0
      ? [...months].sort((a, b) => a.pnl - b.pnl)[0]
      : null;

  const bestStrategy =
    strategies.length > 0 ? strategies[0] : null;

  const worstStrategy =
    strategies.length > 0
      ? strategies[strategies.length - 1]
      : null;

  return (
    <section className="bg-slate-900 p-6 rounded-xl text-white space-y-8">
      <div>
        <h2 className="text-xl font-bold">
          Monthly Analysis
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Monthly performance and profitability by trading strategy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SummaryCard
          label="Best Month"
          title={bestMonth?.month || "No data"}
          value={bestMonth ? money(bestMonth.pnl) : "0.00"}
          positive
        />

        <SummaryCard
          label="Worst Month"
          title={worstMonth?.month || "No data"}
          value={worstMonth ? money(worstMonth.pnl) : "0.00"}
          positive={false}
        />
      </div>

      <div className="space-y-2">
        {months.length === 0 ? (
          <EmptyState message="No monthly results are available yet." />
        ) : (
          months.map((month) => (
            <div
              key={month.month}
              className="grid grid-cols-2 gap-3 rounded-lg bg-slate-800 p-3 md:grid-cols-4 md:items-center"
            >
              <div className="font-semibold">
                {month.month}
              </div>

              <div className="text-sm text-slate-300">
                Trades: {month.trades}
              </div>

              <div className="text-sm text-slate-300">
                Win rate: {month.winRate.toFixed(1)}%
              </div>

              <div
                className={`font-bold md:text-right ${
                  month.pnl >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {money(month.pnl)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-700 pt-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold">
            Profit by Strategy
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Compare net profit, trade count and win rate across strategies.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SummaryCard
            label="Best Strategy"
            title={bestStrategy?.strategy || "No data"}
            value={
              bestStrategy
                ? money(bestStrategy.pnl)
                : "0.00"
            }
            positive
          />

          <SummaryCard
            label="Worst Strategy"
            title={worstStrategy?.strategy || "No data"}
            value={
              worstStrategy
                ? money(worstStrategy.pnl)
                : "0.00"
            }
            positive={false}
          />
        </div>

        {strategies.length === 0 ? (
          <EmptyState message="Add or import trades to display strategy performance." />
        ) : (
          <>
            <div className="h-[380px] rounded-xl border border-slate-700 bg-slate-950 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={strategies}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 10,
                    bottom: 70,
                  }}
                >
                  <CartesianGrid
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                  />

                  <XAxis
                    dataKey="strategy"
                    stroke="#94a3b8"
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={90}
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    stroke="#94a3b8"
                    tickFormatter={(value) =>
                      `$${numberValue(value).toFixed(0)}`
                    }
                  />

                  <Tooltip
                    content={<StrategyTooltip />}
                    cursor={{ fill: "#1e293b", opacity: 0.45 }}
                  />

                  <Bar
                    dataKey="pnl"
                    name="Net P&L"
                    radius={[5, 5, 0, 0]}
                  >
                    {strategies.map((strategy) => (
                      <Cell
                        key={strategy.strategy}
                        fill={
                          strategy.pnl >= 0
                            ? "#22c55e"
                            : "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-700">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-950 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      Strategy
                    </th>
                    <th className="px-4 py-3 text-right">
                      Trades
                    </th>
                    <th className="px-4 py-3 text-right">
                      W / L
                    </th>
                    <th className="px-4 py-3 text-right">
                      Win Rate
                    </th>
                    <th className="px-4 py-3 text-right">
                      Avg P&L
                    </th>
                    <th className="px-4 py-3 text-right">
                      Profit Factor
                    </th>
                    <th className="px-4 py-3 text-right">
                      Net P&L
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {strategies.map((strategy) => (
                    <tr
                      key={strategy.strategy}
                      className="border-t border-slate-700 bg-slate-800"
                    >
                      <td className="px-4 py-3 font-semibold">
                        {strategy.strategy}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {strategy.trades}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {strategy.wins} / {strategy.losses}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {strategy.winRate.toFixed(1)}%
                      </td>

                      <td className="px-4 py-3 text-right">
                        {money(strategy.averagePnL)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {strategy.profitFactor.toFixed(2)}
                      </td>

                      <td
                        className={`px-4 py-3 text-right font-bold ${
                          strategy.pnl >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {money(strategy.pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  title,
  value,
  positive,
}: {
  label: string;
  title: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        positive
          ? "border-green-700 bg-green-900/30"
          : "border-red-700 bg-red-900/30"
      }`}
    >
      <div className="text-sm text-slate-300">
        {label}
      </div>

      <div
        className={`mt-1 text-xl font-bold ${
          positive ? "text-green-400" : "text-red-400"
        }`}
      >
        {title}
      </div>

      <div className="mt-1">{value}</div>
    </div>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
      {message}
    </div>
  );
}

function StrategyTooltip({
  active,
  payload,
}: any) {
  if (!active || !payload?.length) {
    return null;
  }

  const strategy = payload[0].payload as StrategyResult;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm shadow-xl">
      <div className="mb-2 font-bold">
        {strategy.strategy}
      </div>

      <div>Trades: {strategy.trades}</div>

      <div>
        Wins / Losses: {strategy.wins} / {strategy.losses}
      </div>

      <div>
        Win Rate: {strategy.winRate.toFixed(1)}%
      </div>

      <div>
        Average P&L: {money(strategy.averagePnL)}
      </div>

      <div
        className={
          strategy.pnl >= 0
            ? "font-bold text-green-400"
            : "font-bold text-red-400"
        }
      >
        Net P&L: {money(strategy.pnl)}
      </div>
    </div>
  );
}