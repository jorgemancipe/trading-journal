"use client";

import { useMemo, useState } from "react";
import { useTrades, Trade } from "../context/TradesContext";

export default function TradeForm() {
  const { addTrade } = useTrades();

  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<"Buy" | "Sell">("Buy");
  const [quantity, setQuantity] = useState(0);
  const [entry, setEntry] = useState(0);
  const [exit, setExit] = useState(0);
  const [risk, setRisk] = useState(0);
  const [strategy, setStrategy] = useState("ORB");

  // ✅ Live PnL
  const pnl = useMemo(() => {
    if (!quantity || !entry || !exit) return 0;
    return side === "Buy"
      ? (exit - entry) * quantity
      : (entry - exit) * quantity;
  }, [side, quantity, entry, exit]);

  // ✅ Live R
  const r = useMemo(() => {
    if (!risk) return 0;
    return pnl / risk;
  }, [pnl, risk]);

  function reset() {
    setSymbol("");
    setSide("Buy");
    setQuantity(0);
    setEntry(0);
    setExit(0);
    setRisk(0);
    setStrategy("ORB");
  }

  function save(e: React.FormEvent) {
    e.preventDefault();

    const trade: Trade = {
      id: Date.now(),
      date: new Date().toISOString(),
      symbol,
      side,
      quantity,
      entry,
      exit,
      strategy,
      profit: pnl,
      risk,
    };

    addTrade(trade);
    reset();
  }

  return (
    <form
      onSubmit={save}
      className="bg-white p-6 rounded-xl shadow-lg space-y-6 border max-w-2xl"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black">
          New Trade
        </h2>
        <p className="text-gray-600">
          Enter your trade details below
        </p>
      </div>

      {/* ✅ LIVE PREVIEW */}
      <div className="bg-gray-100 p-4 rounded-lg border">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">PnL:</span>
          <span
            className={`font-bold ${
              pnl > 0 ? "text-green-700" : pnl < 0 ? "text-red-700" : "text-black"
            }`}
          >
            {pnl.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">R Multiple:</span>
          <span
            className={`font-bold ${
              r > 0 ? "text-green-700" : r < 0 ? "text-red-700" : "text-black"
            }`}
          >
            {risk ? r.toFixed(2) : "-"}
          </span>
        </div>
      </div>

      {/* ✅ FORM FIELDS */}
      <div className="grid grid-cols-2 gap-4">

        {/* Symbol */}
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-gray-800">
            Symbol
          </label>
          <input
            placeholder="e.g. AAPL"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="w-full border p-2 rounded text-black"
          />
        </div>

        {/* Side */}
        <div>
          <label className="block text-sm font-semibold text-gray-800">
            Side
          </label>
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as any)}
            className="w-full border p-2 rounded text-black"
          >
            <option>Buy</option>
            <option>Sell</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-semibold text-gray-800">
            Quantity
          </label>
          <input
            type="number"
            placeholder="e.g. 100"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full border p-2 rounded text-black"
          />
        </div>

        {/* Entry */}
        <div>
          <label className="block text-sm font-semibold text-gray-800">
            Entry Price
          </label>
          <input
            type="number"
            placeholder="e.g. 185.25"
            value={entry}
            onChange={(e) => setEntry(Number(e.target.value))}
            className="w-full border p-2 rounded text-black"
          />
        </div>

        {/* Exit */}
        <div>
          <label className="block text-sm font-semibold text-gray-800">
            Exit Price
          </label>
          <input
            type="number"
            placeholder="e.g. 187.90"
            value={exit}
            onChange={(e) => setExit(Number(e.target.value))}
            className="w-full border p-2 rounded text-black"
          />
        </div>

        {/* Risk */}
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-gray-800">
            Risk ($)
          </label>
          <input
            type="number"
            placeholder="e.g. 50"
            value={risk}
            onChange={(e) => setRisk(Number(e.target.value))}
            className="w-full border p-2 rounded text-black"
          />
        </div>

        {/* Strategy */}
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-gray-800">
            Strategy
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full border p-2 rounded text-black"
          >
            <option>ORB</option>
            <option>Momentum</option>
            <option>VWAP Reversion</option>
          </select>
        </div>

      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button className="bg-blue-600 text-white p-2 rounded w-full font-bold hover:bg-blue-700">
          Save Trade
        </button>

        <button
          type="button"
          onClick={reset}
          className="bg-gray-300 text-black p-2 rounded w-full font-bold hover:bg-gray-400"
        >
          Clear
        </button>
      </div>
    </form>
  );
}