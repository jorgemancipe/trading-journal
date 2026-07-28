"use client";

import { useMemo } from "react";
import { useTrades } from "../context/TradesContext";

export default function TradeHistory() {
  const {
    trades,
    setTrades,
    clearTrades,
  } = useTrades() as any;

  function n(v: any) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }

  function normalizeDate(d: any) {
    if (!d) return "";

    if (typeof d === "string") {
      return d.substring(0, 10);
    }

    const date = new Date(d);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }

  function save(updated: any[]) {
    localStorage.setItem(
      "trades",
      JSON.stringify(updated)
    );

    setTrades(updated);
  }

  function tradeKey(t: any) {
    return [
      normalizeDate(t.date),
      (t.symbol || "").toUpperCase(),
      t.side || "",
      n(t.quantity),
      n(t.entry).toFixed(4),
      n(t.exit).toFixed(4),
      n(t.profit).toFixed(2),
    ].join("|");
  }

  const duplicateMap = useMemo(() => {
    const map: Record<string, number> = {};

    trades.forEach((trade: any) => {
      const key = tradeKey(trade);

      map[key] = (map[key] || 0) + 1;
    });

    return map;
  }, [trades]);

  function isDuplicate(t: any) {
    return duplicateMap[tradeKey(t)] > 1;
  }

  function deleteTrade(index: number) {
    if (!confirm("Delete trade?")) return;

    const updated = [...trades];

    updated.splice(index, 1);

    save(updated);
  }

  function deleteDuplicates() {
    if (!confirm("Remove duplicates?")) return;

    const seen = new Set();

    const updated = trades.filter((trade: any) => {
      const key = tradeKey(trade);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });

    alert(
      `Removed ${trades.length - updated.length} duplicates`
    );

    save(updated);
  }

  function clearEverything() {
    if (!confirm("Delete ALL trades?")) return;

    localStorage.removeItem("trades");

    clearTrades();
  }

  function exportPDF() {
    if (!trades.length) {
      alert("No trades");
      return;
    }

    let totalPnL = 0;
    let wins = 0;

    trades.forEach((t: any) => {
      const pnl = n(t.profit);

      totalPnL += pnl;

      if (pnl > 0) wins++;
    });

    const winRate =
      trades.length > 0
        ? ((wins / trades.length) * 100).toFixed(2)
        : "0.00";

    const html = `
      <html>
      <body style="padding:20px;font-family:Arial">

        <h1>Trading Performance Report</h1>

        <p>Total Trades: ${trades.length}</p>
        <p>Net PnL: ${totalPnL.toFixed(2)}</p>
        <p>Win Rate: ${winRate}%</p>

        <table border="1" width="100%" style="border-collapse:collapse;">
          <tr>
            <th>Date</th>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>P/L</th>
          </tr>

          ${trades
            .map(
              (t: any) => `
            <tr>
              <td>${normalizeDate(t.date)}</td>
              <td>${t.symbol}</td>
              <td>${n(t.quantity)}</td>
              <td>${n(t.entry)}</td>
              <td>${n(t.exit)}</td>
              <td>${n(t.profit).toFixed(2)}</td>
            </tr>
          `
            )
            .join("")}

        </table>

      </body>
      </html>
    `;

    const win = window.open("");

    if (!win) return;

    win.document.write(html);
    win.document.close();
    win.print();
  }

  const sortedTrades = [...trades].sort(
    (a: any, b: any) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
  );

  return (
    <div className="bg-white p-4 rounded-xl shadow space-y-4">
      <h2 className="text-xl font-bold text-black">
        Trade Manager
      </h2>

      <div className="flex gap-2 flex-wrap">

        <button
          onClick={exportPDF}
          className="bg-purple-600 text-white px-3 py-2 rounded font-bold"
        >
          Export PDF
        </button>

        <button
          onClick={deleteDuplicates}
          className="bg-yellow-500 text-black px-3 py-2 rounded font-bold"
        >
          Remove Duplicates
        </button>

        <button
          onClick={clearEverything}
          className="bg-red-600 text-white px-3 py-2 rounded font-bold"
        >
          Clear All
        </button>

      </div>

      <table className="w-full text-sm border border-gray-300">
        <thead className="bg-gray-200 text-black">
          <tr>
            <th className="px-2 py-2">Date</th>
            <th className="px-2 py-2">Symbol</th>
            <th className="px-2 py-2">Qty</th>
            <th className="px-2 py-2">Entry</th>
            <th className="px-2 py-2">Exit</th>
            <th className="px-2 py-2">Net</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {sortedTrades.map((t: any, i: number) => {
            const duplicate = isDuplicate(t);

            return (
              <tr
                key={i}
                className={
                  duplicate
                    ? "bg-red-100"
                    : "hover:bg-gray-50"
                }
              >
                <td className="px-2 py-1 text-black">
                  {normalizeDate(t.date)}
                </td>

                <td className="px-2 py-1 font-bold text-black">
                  {t.symbol}
                  {duplicate ? " ⚠️" : ""}
                </td>

                <td className="px-2 py-1 text-black">
                  {n(t.quantity)}
                </td>

                <td className="px-2 py-1 text-black">
                  {n(t.entry)}
                </td>

                <td className="px-2 py-1 text-black">
                  {n(t.exit)}
                </td>

                <td
                  className={`px-2 py-1 font-bold ${
                    n(t.profit) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {n(t.profit).toFixed(2)}
                </td>

                <td>
                  <button
                    onClick={() => deleteTrade(i)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}

          {trades.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="text-center py-6 text-gray-500"
              >
                No trades found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}