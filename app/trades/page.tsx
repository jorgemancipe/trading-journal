"use client";

import { useState } from "react";
import NavBar from "../components/NavBar";

const initialTrades = [
  {
    id: 1,
    date: "2026-05-01",
    symbol: "AAPL",
    side: "Buy",
    quantity: 100,
    price: 172.35,
    profit: 250,
  },
  {
    id: 2,
    date: "2026-05-03",
    symbol: "TSLA",
    side: "Sell",
    quantity: 50,
    price: 695.2,
    profit: -120,
  },
];

export default function TradesPage() {
  const [trades, setTrades] = useState(initialTrades);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    date: "",
    symbol: "",
    side: "Buy",
    quantity: 0,
    price: 0,
    profit: 0,
  });

  const totalPL = trades.reduce((sum, t) => sum + t.profit, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setTrades([
      ...trades,
      {
        id: Date.now(),
        ...form,
      },
    ]);

    setForm({
      date: "",
      symbol: "",
      side: "Buy",
      quantity: 0,
      price: 0,
      profit: 0,
    });

    setShowForm(false);
  }

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Trades</h1>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            New Trade
          </button>
        </div>

        <div
          className={`mb-6 p-4 rounded text-lg font-semibold ${
            totalPL >= 0
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          Total P/L: ${totalPL}
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
              required
            />
            <input
              placeholder="Symbol"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              required
            />
            <select
              value={form.side}
              onChange={(e) => setForm({ ...form, side: e.target.value })}
            >
              <option>Buy</option>
              <option>Sell</option>
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: Number(e.target.value) })
              }
              required
            />
            <input
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
              required
            />
            <input
              type="number"
              placeholder="P/L"
              value={form.profit}
              onChange={(e) =>
                setForm({ ...form, profit: Number(e.target.value) })
              }
              required
            />

            <button
              className="col-span-2 bg-green-600 text-white py-2 rounded"
              type="submit"
            >
              Add Trade
            </button>
          </form>
        )}

        <table className="min-w-full bg-white border rounded text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Symbol</th>
              <th className="px-4 py-2">Side</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">P/L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-2">{t.date}</td>
                <td className="px-4 py-2">{t.symbol}</td>
                <td className="px-4 py-2">{t.side}</td>
                <td className="px-4 py-2">{t.quantity}</td>
                <td className="px-4 py-2">{t.price}</td>
                <td className="px-4 py-2 font-semibold">{t.profit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
}
