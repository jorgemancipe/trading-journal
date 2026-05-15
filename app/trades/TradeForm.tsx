"use client";

import { useState } from "react";

export default function TradeForm() {
  const [symbol, setSymbol] = useState("");
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");

  return (
    <div className="bg-white p-6 rounded border max-w-xl space-y-4">

      <h2 className="text-xl font-semibold">New Trade</h2>

      {/* Symbol */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Symbol
        </label>
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="e.g. AAPL"
          className="border border-gray-300 p-2 rounded w-full placeholder-gray-400"
        />
      </div>

      {/* Entry */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Entry Price
        </label>
        <input
          type="number"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="e.g. 185.25"
          className="border border-gray-300 p-2 rounded w-full placeholder-gray-400"
        />
      </div>

      {/* Exit */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Exit Price
        </label>
        <input
          type="number"
          value={exit}
          onChange={(e) => setExit(e.target.value)}
          placeholder="e.g. 187.90"
          className="border border-gray-300 p-2 rounded w-full placeholder-gray-400"
        />
      </div>

    </div>
  );
}
``
