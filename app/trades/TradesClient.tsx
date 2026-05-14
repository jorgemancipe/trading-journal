"use client";

import { useMemo, useState } from "react";
import { useTrades, Trade } from "../context/TradesContext";

export default function TradesClient() {
  const { trades, addTrade, clearTrades } = useTrades();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    date: today,
    symbol: "",
    side: "Buy" as "Buy" | "Sell",
    quantity: 0,
    entry: 0,
    exit: 0,
    risk: 0, // ✅ NEW
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (form.risk <= 0) return;

    const profit =
      form.side === "Buy"
        ? (form.exit - form.entry) * form.quantity
        : (form.entry - form.exit) * form.quantity;

    const trade: Trade = {
      id: Date.now(),
      date: form.date,
      symbol: form.symbol.toUpperCase(),
      side: form.side,
      quantity: form.quantity,
      entry: form.entry,
      exit: form.exit,
      profit,
      risk: form.risk,
    };

    addTrade(trade);
    setForm({ ...form, symbol: "", quantity: 0, entry: 0, exit: 0, risk: 0 });
  }

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Trades</h1>

      <form
        onSubmit={submit}
        className="bg-white border rounded p-4 grid grid-cols-2 gap-4 mb-6"
      >
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input placeholder="Symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
        <input type="number" placeholder="Qty" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} />
        <input type="number" placeholder="Entry" value={form.entry} onChange={(e) => setForm({ ...form, entry: +e.target.value })} />
        <input type="number" placeholder="Exit" value={form.exit} onChange={(e) => setForm({ ...form, exit: +e.target.value })} />
        <input type="number" placeholder="Risk ($)" value={form.risk} onChange={(e) => setForm({ ...form, risk: +e.target.value })} />

        <button className="col-span-2 bg-green-600 text-white py-2 rounded">
          Add Trade
        </button>
      </form>

      <button onClick={clearTrades} className="bg-red-600 text-white px-4 py-2 rounded">
        Clear All
      </button>
    </main>
  );
}
