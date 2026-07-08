"use client";

import { useState } from "react";
import { useTrades, Trade } from "../context/TradesContext";

const STRATEGY_PRESETS = [
  "ORB (Opening Range Breakout)",
  "VWAP Reversion/Trend",
  "9 EMA Pullback",
  "Premarket Levels (PMH/PML)",
  "Yesterday Levels (YH/YL/Close)",
  "Camarilla Levels",
  "Volume Confirmation",
  "Level 2 Confirmation",
  "Custom…",
] as const;

type StrategyPreset = (typeof STRATEGY_PRESETS)[number];

type TradeForm = {
  date: string;
  symbol: string;
  side: "Buy" | "Sell";
  quantity: number;
  entry: number;
  exit: number;
  risk: number;

  strategyPreset: StrategyPreset;
  customStrategy: string;
};

export default function TradesClient() {
  const { trades, addTrade, clearTrades } = useTrades();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<TradeForm>({
    date: today,
    symbol: "",
    side: "Buy",
    quantity: 0,
    entry: 0,
    exit: 0,
    risk: 0,
    strategyPreset: STRATEGY_PRESETS[0], // ✅ now typed as StrategyPreset union
    customStrategy: "",
  });

  const isCustom = form.strategyPreset === "Custom…";

  function submit(e: React.FormEvent) {
    e.preventDefault();

    const symbol = form.symbol.trim().toUpperCase();
    if (!symbol) return;
    if (form.quantity <= 0 || form.entry <= 0 || form.exit <= 0) return;
    if (form.risk <= 0) return;

    const profit =
      form.side === "Buy"
        ? (form.exit - form.entry) * form.quantity
        : (form.entry - form.exit) * form.quantity;

    const chosenStrategy = isCustom
      ? form.customStrategy.trim()
      : form.strategyPreset;

    const trade: Trade = {
      id: Date.now(),
      date: form.date,
      symbol,
      side: form.side,
      quantity: form.quantity,
      entry: form.entry,
      exit: form.exit,
      profit,
      risk: form.risk,
      strategy: chosenStrategy || "Unassigned",
    };

    addTrade(trade);

    setForm((prev) => ({
      ...prev,
      symbol: "",
      quantity: 0,
      entry: 0,
      exit: 0,
      risk: 0,
      customStrategy: "",
    }));
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Trades</h1>

        <button
          onClick={clearTrades}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
        >
          Clear All
        </button>
      </div>

      <form
        onSubmit={submit}
        className="bg-white border rounded p-4 grid grid-cols-2 gap-4 mb-6"
      >
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="border rounded px-3 py-2"
          required
        />

        <input
          placeholder="Symbol (e.g. AAPL)"
          value={form.symbol}
          onChange={(e) => setForm({ ...form, symbol: e.target.value })}
          className="border rounded px-3 py-2"
          required
        />

        <select
          value={form.strategyPreset}
          onChange={(e) =>
            setForm({ ...form, strategyPreset: e.target.value as StrategyPreset })
          }
          className="border rounded px-3 py-2"
        >
          {STRATEGY_PRESETS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {isCustom ? (
          <input
            placeholder='Custom Strategy (e.g. "ABC Setup")'
            value={form.customStrategy}
            onChange={(e) =>
              setForm({ ...form, customStrategy: e.target.value })
            }
            className="border rounded px-3 py-2"
          />
        ) : (
          <div className="text-sm text-gray-500 flex items-center px-2">
            Preset selected
          </div>
        )}

        <select
          value={form.side}
          onChange={(e) =>
            setForm({ ...form, side: e.target.value as "Buy" | "Sell" })
          }
          className="border rounded px-3 py-2"
        >
          <option value="Buy">Buy (Long)</option>
          <option value="Sell">Sell (Short)</option>
        </select>

        <input
          type="number"
          placeholder="Quantity"
          value={form.quantity}
          onChange={(e) =>
            setForm({ ...form, quantity: Number(e.target.value) })
          }
          className="border rounded px-3 py-2"
          required
        />

        <input
          type="number"
          step="0.01"
          placeholder="Entry Price"
          value={form.entry}
          onChange={(e) =>
            setForm({ ...form, entry: Number(e.target.value) })
          }
          className="border rounded px-3 py-2"
          required
        />

        <input
          type="number"
          step="0.01"
          placeholder="Exit Price"
          value={form.exit}
          onChange={(e) =>
            setForm({ ...form, exit: Number(e.target.value) })
          }
          className="border rounded px-3 py-2"
          required
        />

        <input
          type="number"
          step="0.01"
          placeholder="Risk ($) — required for R metrics"
          value={form.risk}
          onChange={(e) =>
            setForm({ ...form, risk: Number(e.target.value) })
          }
          className="border rounded px-3 py-2"
          required
        />

        <button
          type="submit"
          className="col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-500"
        >
          Add Trade
        </button>
      </form>

      <div className="bg-white border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Symbol</th>
              <th className="px-4 py-2 text-left">Strategy</th>
              <th className="px-4 py-2 text-right">Profit</th>
              <th className="px-4 py-2 text-right">Risk</th>
              <th className="px-4 py-2 text-right">R</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => {
              const r = t.risk > 0 ? t.profit / t.risk : 0;
              return (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-2">{t.date}</td>
                  <td className="px-4 py-2 font-medium">{t.symbol}</td>
                  <td className="px-4 py-2">{t.strategy}</td>
                  <td
                    className={`px-4 py-2 text-right font-semibold ${
                      t.profit >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {t.profit.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">{t.risk.toFixed(2)}</td>
                  <td
                    className={`px-4 py-2 text-right font-semibold ${
                      r >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {r.toFixed(2)}
                  </td>
                </tr>
              );
            })}
            {trades.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No trades yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
