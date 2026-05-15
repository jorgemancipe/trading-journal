"use client";

import { useState } from "react";

export default function TradeForm() {
  const [symbol, setSymbol] = useState("");
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [stop, setStop] = useState("");
  const [size, setSize] = useState("");
  const [strategy, setStrategy] = useState("ORB");

  function formatPrice(value: string) {
    if (!value) return "";
    return Number(value).toFixed(2);
  }

  function handleSubmit() {
    alert("Trade saved ✅");
  }

  return (
    <div className="bg-white p-6 rounded border max-w-xl space-y-4">
      <h2 className="text-xl font-semibold">New Trade</h2>

      <input
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="Symbol (e.g. AAPL)"
        className="border p-2 rounded w-full"
      />

      <input
        type="number"
        value={entry}
        onBlur={() => setEntry(formatPrice(entry))}
        onChange={(e) => setEntry(e.target.value)}
        placeholder="Entry price (e.g. 185.25)"
        className="border p-2 rounded w-full"
      />

      <input
        type="number"
        value={exit}
        onBlur={() => setExit(formatPrice(exit))}
        onChange={(e) => setExit(e.target.value)}
        placeholder="Exit price (e.g. 187.90)"
        className="border p-2 rounded w-full"
      />

      <input
        type="number"
        value={stop}
        onChange={(e) => setStop(e.target.value)}
        placeholder="Stop loss (optional)"
        className="border p-2 rounded w-full"
      />

      <input
        type="number"
        value={size}
        onChange={(e) => setSize(e.target.value)}
        placeholder="Position size (e.g. 100)"
        className="border p-2 rounded w-full"
      />

      <select
        value={strategy}
        onChange={(e) => setStrategy(e.target.value)}
        className="border p-2 rounded w-full"
      >
        <option>ORB</option>
        <option>Momentum</option>
        <option>VWAP Reversion</option>
      </select>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Save Trade
      </button>
    </div>
  );
}
