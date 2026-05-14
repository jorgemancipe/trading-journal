"use client";

import { useMemo, useState } from "react";
import { useTrades, Trade } from "../context/TradesContext";
function exportTradesToCSV(trades: Trade[]) {
  if (trades.length === 0) return;

  const headers = [
    "Date",
    "Symbol",
    "Side",
    "Quantity",
    "Entry",
    "Exit",
    "Profit",
  ];

  const rows = trades.map((t) => [
    t.date,
    t.symbol,
    t.side,
    t.quantity,
    t.entry,
    t.exit,
    t.profit.toFixed(2),
  ]);

  const csv =
    [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "trades.csv";
  link.click();

  URL.revokeObjectURL(url);
}
export default function TradesClient() {
  const { trades, addTrade, clearTrades } = useTrades();
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: today,
    symbol: "",
    side: "Buy" as "Buy" | "Sell",
    quantity: 0,
    entry: 0,
    exit: 0,
  });

  // Live P/L preview
  const liveProfit = useMemo(() => {
    if (form.quantity <= 0 || form.entry <= 0 || form.exit <= 0) return 0;

    return form.side === "Buy"
      ? (form.exit - form.entry) * form.quantity
      : (form.entry - form.exit) * form.quantity;
  }, [form]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.symbol || form.quantity <= 0) return;

    const profit =
      form.side === "Buy"
        ? (form.exit - form.entry) * form.quantity
        : (form.entry - form.exit) * form.quantity;

    const newTrade: Trade = {
      id: Date.now(),
      date: form.date,
      symbol: form.symbol.toUpperCase(),
      side: form.side,
      quantity: form.quantity,
      entry: form.entry,
      exit: form.exit,
      profit,
    };

    addTrade(newTrade);

    setForm({
      date: today,
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

        <div className="flex gap-2">
  <button
    onClick={() => setShowForm((v) => !v)}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
  >
    New Trade
  </button>

  <button
    onClick={() => exportTradesToCSV(trades)}
    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
  >
    Export CSV
  </button>

  <button
    onClick={clearTrades}
    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
  >
    Clear All
  </button>
</div>
            Clear All
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 bg-white p-4 rounded border grid grid-cols-2 gap-4"
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

          <div className="col-span-2 text-sm text-gray-600">
            P/L Preview:{" "}
            <span
              className={
                liveProfit >= 0 ? "text-green-700" : "text-red-700"
              }
            >
              {liveProfit.toFixed(2)}
            </span>
          </div>

          <button
            type="submit"
            className="col-span-2 py-2 bg-green-600 text-white rounded hover:bg-green-500"
          >
            Add Trade
          </button>
        </form>
      )}

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
              <tr key={t.id} className="border-t">
                <td className="px-4 py-2">{t.date}</td>
                <td className="px-4 py-2 font-medium">{t.symbol}</td>
                <td className="px-4 py-2">{t.side}</td>
                <td className="px-4 py-2 text-right">{t.quantity}</td>
                <td className="px-4 py-2 text-right">{t.entry}</td>
                <td className="px-4 py-2 text-right">{t.exit}</td>
                <td
                  className={`px-4 py-2 text-right ${
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
