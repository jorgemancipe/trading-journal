"use client";

import { useMemo, useState } from "react";
import { useTrades, Trade } from "../context/TradesContext";

/* ---------- CSV helpers ---------- */

function timestampString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function csvCell(v: unknown) {
  if (v === null || v === undefined) return '""';
  return `"${String(v).replace(/"/g, '""')}"`;
}

function buildCSV(rows: unknown[][]) {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

function downloadCSV(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportTradesCSV(
  trades: Trade[],
  prefix: string,
  summary?: Record<string, string | number>
) {
  if (!trades.length) return;

  const rows: unknown[][] = [];

  if (summary) {
    rows.push(["Filter Summary", ""]);
    Object.entries(summary).forEach(([k, v]) => rows.push([k, v]));
    rows.push(["", ""]);
  }

  rows.push(["Date", "Symbol", "Side", "Quantity", "Entry", "Exit", "Profit"]);
  trades.forEach((t) =>
    rows.push([
      t.date,
      t.symbol,
      t.side,
      t.quantity,
      t.entry.toFixed(2),
      t.exit.toFixed(2),
      t.profit.toFixed(2),
    ])
  );

  downloadCSV(buildCSV(rows), `${prefix}-${timestampString()}.csv`);
}

/* ---------- Component ---------- */

type SideFilter = "All" | "Buy" | "Sell";
type OutcomeFilter = "All" | "Wins" | "Losses" | "Breakeven";

export default function TradesClient() {
  const { trades, addTrade, clearTrades } = useTrades();

  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: today,
    symbol: "",
    side: "Buy" as "Buy" | "Sell",
    quantity: 0,
    entry: 0,
    exit: 0,
  });

  const [symbolFilter, setSymbolFilter] = useState("");
  const [sideFilter, setSideFilter] = useState<SideFilter>("All");
  const [outcomeFilter, setOutcomeFilter] =
    useState<OutcomeFilter>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredTrades = useMemo(() => {
    const sym = symbolFilter.trim().toUpperCase();
    return trades.filter((t) => {
      if (sym && !t.symbol.includes(sym)) return false;
      if (sideFilter !== "All" && t.side !== sideFilter) return false;
      if (outcomeFilter === "Wins" && t.profit <= 0) return false;
      if (outcomeFilter === "Losses" && t.profit >= 0) return false;
      if (outcomeFilter === "Breakeven" && t.profit !== 0) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
  }, [
    trades,
    symbolFilter,
    sideFilter,
    outcomeFilter,
    dateFrom,
    dateTo,
  ]);

  const filteredPL = filteredTrades.reduce((s, t) => s + t.profit, 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const profit =
      form.side === "Buy"
        ? (form.exit - form.entry) * form.quantity
        : (form.entry - form.exit) * form.quantity;

    addTrade({
      id: Date.now(),
      date: form.date,
      symbol: form.symbol.toUpperCase(),
      side: form.side,
      quantity: form.quantity,
      entry: form.entry,
      exit: form.exit,
      profit,
    });

    setShowForm(false);
    setForm({ ...form, symbol: "", quantity: 0, entry: 0, exit: 0 });
  }

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="flex gap-2 mb-4 flex-wrap">
  <button
    onClick={() => setShowForm(!showForm)}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
  >
    New Trade
  </button>

  <button
    onClick={() => exportTradesCSV(trades, "trades")}
    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
  >
    Export All CSV
  </button>

  <button
    onClick={() =>
      exportTradesCSV(filteredTrades, "filtered-trades", {
        Symbol: symbolFilter || "All",
        Side: sideFilter,
        Outcome: outcomeFilter,
        "Date From": dateFrom || "All",
        "Date To": dateTo || "All",
        "Filtered Trades": filteredTrades.length,
        "Filtered P/L": filteredPL.toFixed(2),
      })
    }
    className="px-4 py-2 bg-emerald-700 text-white rounded hover:bg-emerald-600"
  >
    Export Filtered CSV
  </button>

  <button
    onClick={clearTrades}
    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
  >
    Clear All
  </button>
</div>
    
      {showForm && (
        <form onSubmit={submit} className="mb-4">
          <input
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            placeholder="Symbol"
          />
          <button type="submit">Add Trade</button>
        </form>
      )}

      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th>Date</th>
            <th>Symbol</th>
            <th>P/L</th>
          </tr>
        </thead>
        <tbody>
          {filteredTrades.map((t) => (
            <tr key={t.id}>
              <td>{t.date}</td>
              <td>{t.symbol}</td>
              <td>{t.profit.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
