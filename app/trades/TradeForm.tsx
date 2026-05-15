"use client";

import { useState } from "react";

export default function TradeForm() {
  const [symbol, setSymbol] = useState("");
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [stop, setStop] = useState("");
  const [size, setSize] = useState("");
  const [strategy, setStrategy] = useState("ORB");

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 max-w-2xl space-y-6 border">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          New Trade
        </h2>
        <p className="text-sm text-gray-500">
          Log your trade with precision
        </p>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-2 gap-4">

        {/* Symbol */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            SYMBOL
          </label>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL"
            className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Entry */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            ENTRY
          </label>
          <input
            type="number"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="185.25"
            className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Exit */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            EXIT
          </label>
          <input
            type="number"
            value={exit}
            onChange={(e) => setExit(e.target.value)}
            placeholder="187.90"
            className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Stop */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            STOP LOSS
          </label>
          <input
            type="number"
            value={stop}
            onChange={(e) => setStop(e.target.value)}
            placeholder="183.50"
            className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        {/* Size */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            POSITION SIZE
          </label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="100"
            className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Strategy */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            STRATEGY
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>ORB</option>
            <option>Momentum</option>
            <option>VWAP Reversion</option>
          </select>
        </div>

      </div>

      {/* Buttons */}
      <div className="flex gap-3">

        {/* Save */}
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg w-full font-semibold transition"
        >
          Save Trade
        </button>

        {/* Reset */}
        <button
          onClick={() => {
            setSymbol("");
            setEntry("");
            setExit("");
            setStop("");
            setSize("");
            setStrategy("ORB");
          }}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg w-full font-semibold transition"
        >
          Clear
        </button>

      </div>

    </div>
  );
}
``
