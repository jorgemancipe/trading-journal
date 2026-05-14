"use client";

import { useMemo, useState } from "react";
import { useTrades, Trade } from "../context/TradesContext";

/** Timestamp like 2026-05-14_14-33-07 (local time) */
function timestampString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}`;
}

/** RFC4180-ish CSV escaping: wrap in quotes, escape quotes, preserve commas/newlines */
function csvCell(value: unknown) {
  if (value === null || value === undefined) return '""';
  const s = String(value).replace(/"/g, '""');
  return `"${s}"`;
}

function buildCSV(rows: unknown[][]) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function downloadCSV(csvText: string, filename: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function exportTradesToCSV(trades: Trade[]) {
  if (!trades || trades.length === 0) return;

  const rows: unknown[][] = [
    ["Date", "Symbol", "Side", "Quantity", "Entry", "Exit", "Profit"],
    ...trades.map((t) => [
      t.date,
      t.symbol,
      t.side,
      t.quantity,
      t.entry,
      t.exit,
      t.profit.toFixed(2),
    ]),
  ];

  const csv = buildCSV(rows);
  downloadCSV(csv, `trades-${timestampString()}.csv`);
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

  const liveProfit = useMemo(() => {
    const qty = Number(form.quantity);
    const entry = Number(form.entry);
    const exit = Number(form.exit);

    if (qty <= 0 || entry <= 0 || exit <= 0) return 0;

    // Buy (Long): (exit - entry) * qty
    // Sell (Short): (entry - exit) * qty
    return form.side === "Buy" ? (exit - entry) * qty : (entry - exit) * qty;
  }, [form]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const symbol = form.symbol.trim().toUpperCase();
    const qty = Number(form.quantity);
    const entry = Number(form.entry);
    const exit = Number(form.exit);

    if (!form.date || !symbol || qty <= 0 || entry <= 0 || exit <= 0) return;

    const profit =
      form.side === "Buy" ? (exit - entry) * qty : (entry - exit) * qty;

    const newTrade: Trade = {
      id: Date.now(),
      date: form.date,
      symbol,
      side: form.side,
      quantity: qty,
      entry,
      exit,
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

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition"
          >
            New Trade
          </button>

          <button
            onClick={() => exportTradesToCSV(trades)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition"
            disabled={!trades || trades.length === 0}
            title={!trades || trades.length === 0 ? "No trades to export" : "Export trades CSV"}
          >
            Export CSV
          </button>

          <button
            onClick={clearTrades}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition"
          >
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
            onChange={(e) => setForm({ ...form, entry: Number(e.target.value) })}
            className="border rounded px-3 py-2"
            required
          />

          <input
            type="number"
            step="0.01"
            placeholder="Exit Price"
            value={form.exit}
            onChange={(e) => setForm({ ...form, exit: Number(e.target.value) })}
            className="border rounded px-3 py-2"
            required
          />

          <div className="col-span-2 p-3 rounded bg-gray-50 border text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">P/L Preview</span>
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
            type="submit"
            className="col-span-2 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition"
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
