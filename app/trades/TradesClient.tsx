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

/** RFC4180-ish escaping: wrap in quotes + escape quotes */
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

function exportTradesCSV(trades: Trade[], filenamePrefix: string) {
  if (!trades || trades.length === 0) return;

  const rows: unknown[][] = [
    ["Date", "Symbol", "Side", "Quantity", "Entry", "Exit", "Profit"],
    ...trades.map((t) => [
      t.date,
      t.symbol,
      t.side,
      t.quantity,
      t.entry.toFixed(2),
      t.exit.toFixed(2),
      t.profit.toFixed(2),
    ]),
  ];

  const csv = buildCSV(rows);
  downloadCSV(csv, `${filenamePrefix}-${timestampString()}.csv`);
}

type SideFilter = "All" | "Buy" | "Sell";
type OutcomeFilter = "All" | "Wins" | "Losses" | "Breakeven";

export default function TradesClient() {
  const { trades, addTrade, clearTrades } = useTrades();

  // ---- form state ----
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

  // ---- filter state ----
  const [symbolFilter, setSymbolFilter] = useState("");
  const [sideFilter, setSideFilter] = useState<SideFilter>("All");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("All");
  const [dateFrom, setDateFrom] = useState(""); // yyyy-mm-dd
  const [dateTo, setDateTo] = useState("");   // yyyy-mm-dd

  const liveProfit = useMemo(() => {
    const qty = Number(form.quantity);
    const entry = Number(form.entry);
    const exit = Number(form.exit);
    if (qty <= 0 || entry <= 0 || exit <= 0) return 0;
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

  // ---- filtered trades ----
  const filteredTrades = useMemo(() => {
    const sym = symbolFilter.trim().toUpperCase();

    return trades.filter((t) => {
      // Symbol
      if (sym && !t.symbol.includes(sym)) return false;

      // Side
      if (sideFilter !== "All" && t.side !== sideFilter) return false;

      // Outcome
      if (outcomeFilter === "Wins" && !(t.profit > 0)) return false;
      if (outcomeFilter === "Losses" && !(t.profit < 0)) return false;
      if (outcomeFilter === "Breakeven" && !(t.profit === 0)) return false;

      // Date range (yyyy-mm-dd string compares correctly)
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;

      return true;
    });
  }, [trades, symbolFilter, sideFilter, outcomeFilter, dateFrom, dateTo]);

  const filteredPL = useMemo(
    () => filteredTrades.reduce((sum, t) => sum + t.profit, 0),
    [filteredTrades]
  );

  function resetFilters() {
    setSymbolFilter("");
    setSideFilter("All");
    setOutcomeFilter("All");
    setDateFrom("");
    setDateTo("");
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
            onClick={() => exportTradesCSV(trades, "trades")}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition"
            disabled={!trades || trades.length === 0}
            title={!trades || trades.length === 0 ? "No trades to export" : "Export all trades"}
          >
            Export All CSV
          </button>

          <button
            onClick={() => exportTradesCSV(filteredTrades, "filtered-trades")}
            className="px-4 py-2 bg-emerald-700 text-white rounded hover:bg-emerald-600 transition"
            disabled={!filteredTrades || filteredTrades.length === 0}
            title={
              !filteredTrades || filteredTrades.length === 0
                ? "No filtered trades to export"
                : "Export filtered trades"
            }
          >
            Export Filtered CSV
          </button>

          <button
            onClick={clearTrades}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 bg-white border rounded p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Symbol</label>
            <input
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              placeholder="e.g. AAPL"
              className="border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Side</label>
            <select
              value={sideFilter}
              onChange={(e) => setSideFilter(e.target.value as SideFilter)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="All">All</option>
              <option value="Buy">Buy (Long)</option>
              <option value="Sell">Sell (Short)</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Outcome</label>
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value as OutcomeFilter)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="All">All</option>
              <option value="Wins">Wins</option>
              <option value="Losses">Losses</option>
              <option value="Breakeven">Break-even</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition text-sm"
          >
            Reset Filters
          </button>

          <div className="ml-auto text-sm text-gray-700">
            Showing <span className="font-semibold">{filteredTrades.length}</span> of{" "}
            <span className="font-semibold">{trades.length}</span> trades • Filtered P/L:{" "}
            <span className={filteredPL >= 0 ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
              ${filteredPL.toFixed(2)}
            </span>
          </div>
        </div>
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

      {/* Trades Table (filtered) */}
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
            {filteredTrades.map((t) => (
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
            {filteredTrades.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>
                  No trades match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
