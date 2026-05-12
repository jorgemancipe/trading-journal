"use client";

import { useMemo, useState } from "react";

type Trade = {
  id: number;
  date: string;
  symbol: string;
  side: "Buy" | "Sell";
  quantity: number;
  entry: number;
  exit: number;
  profit: number; // computed at submit time
};

const initialTrades: Trade[] = [
  {
    id: 1,
    date: "2026-05-01",
    symbol: "AAPL",
    side: "Buy",
    quantity: 100,
    entry: 172.35,
    exit: 174.85,
    profit: (174.85 - 172.35) * 100,
  },
  {
    id: 2,
    date: "2026-05-03",
    symbol: "TSLA",
    side: "Sell",
    quantity: 50,
    entry: 695.2,
    exit: 697.6,
    profit: (695.2 - 697.6) * 50,
  },
];

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    date: "",
    symbol: "",
    side: "Buy" as "Buy" | "Sell",
    quantity: 0,
    entry: 0,
    exit: 0,
  });

  // Live computed P/L preview (updates as you type)
  const liveProfit = useMemo(() => {
    const qty = Number(form.quantity) || 0;
    const entry = Number(form.entry) || 0;
    const exit = Number(form.exit) || 0;

    // Long (Buy): (Exit - Entry) * Qty
    // Short (Sell): (Entry - Exit) * Qty
    return form.side === "Buy" ? (exit - entry) * qty : (entry - exit) * qty;
  }, [form]);

  const totalPL = useMemo(
    () => trades.reduce((sum, t) => sum + t.profit, 0),
    [trades]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const qty = Number(form.quantity) || 0;
    const entry = Number(form.entry) || 0;
    const exit = Number(form.exit) || 0;

    // Compute profit using standard long/short formulas [1](https://help.tradervue.com/article/3440-mfe-and-mae-calculations)[2](https://www.tradervue.com/blog/mfe-and-mae-calculations)
    const profit =
      form.side === "Buy" ? (exit - entry) * qty : (entry - exit) * qty;

    const newTrade: Trade = {
      id: Date.now(),
      date: form.date,
      symbol: form.symbol.trim().toUpperCase(),
      side: form.side,
      quantity: qty,
      entry,
      exit,
      profit,
    };

    setTrades([...trades, newTrade]);

    // Reset form
    setForm({
      date: "",
      symbol: "",
      side: "Buy",
      quantity: 0,
      entry: 0,
      exit: 0,
    });

    setShowForm(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Trades</h1>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition"
        >
          New Trade
        </button>
      </div>

      {/* Total P/L */}
      <div
        className={`mb-6 p-4 rounded text-lg font-semibold ${
          totalPL >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        Total P/L: ${totalPL.toFixed(2)}
      </div>

      {/* New Trade Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 bg-white p-4 rounded border grid grid-cols-2 gap-4"
        >
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
            className="border rounded px-3 py-2"
          />

          <input
            placeholder="Symbol (e.g. AAPL)"
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            required
            className="border rounded px-3 py-2"
          />

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
            required
            className="border rounded px-3 py-2"
          />

          <input
            type="number"
            step="0.01"
            placeholder="Entry Price"
            value={form.entry}
            onChange={(e) => setForm({ ...form, entry: Number(e.target.value) })}
            required
            className="border rounded px-3 py-2"
          />

          <input
            type="number"
            step="0.01"
            placeholder="Exit Price"
            value={form.exit}
            onChange={(e) => setForm({ ...form, exit: Number(e.target.value) })}
            required
            className="border rounded px-3 py-2"
          />

          {/* Live P/L preview */}
          <div className="col-span-2 p-3 rounded bg-gray-50 border text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Auto P/L (preview)</span>
              <span
                className={
                  liveProfit >= 0
                    ? "text-green-700 font-semibold"
                    : "text-red-700 font-semibold"
                }
              >
                ${liveProfit.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            className="col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-500 transition"
            type="submit"
          >
            Add Trade
          </button>
        </form>
      )}

      {/* Trades Table */}
      <div className="overflow-x-auto bg-white border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Symbol</th>
              <th className="px-4 py-2 text-left">Side</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Entry</th>
              <th className="px-4 py-2 text-right">Exit</th>
              <th className="px-4 py-2 text-right">P/L</th>
            </tr>
          </thead>

          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{t.date}</td>
                <td className="px-4 py-2 font-medium">{t.symbol}</td>
                <td className="px-4 py-2">{t.side}</td>
                <td className="px-4 py-2 text-right">{t.quantity}</td>
                <td className="px-4 py-2 text-right">{t.entry.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{t.exit.toFixed(2)}</td>
                <td
                  className={`px-4 py-2 text-right font-semibold ${
                    t.profit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {t.profit.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
