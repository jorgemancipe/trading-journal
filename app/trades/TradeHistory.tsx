"use client";

import { useEffect, useState, useMemo } from "react";

export default function TradeHistory() {
  const [trades, setTrades] = useState<any[]>([]);

  // ✅ Load trades
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("trades") || "[]");
    setTrades(saved);
  }, []);

  function n(v: any) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }

  function normalizeDate(d: any) {
    return new Date(d).toISOString().slice(0, 10);
  }

  function save(updated: any[]) {
    localStorage.setItem("trades", JSON.stringify(updated));
    setTrades(updated);
  }

  // ✅ consistent key
  function tradeKey(t: any) {
    return [
      normalizeDate(t.date),
      (t.symbol || "").toUpperCase(),
      n(t.entry).toFixed(4),
      n(t.exit).toFixed(4),
      n(t.quantity)
    ].join("|");
  }

  // ✅ duplicate detection
  const duplicateMap = useMemo(() => {
    const count: Record<string, number> = {};
    trades.forEach((t) => {
      const k = tradeKey(t);
      count[k] = (count[k] || 0) + 1;
    });
    return count;
  }, [trades]);

  function isDuplicate(t: any) {
    return duplicateMap[tradeKey(t)] > 1;
  }

  // ✅ delete works
  function deleteTrade(index: number) {
    if (!confirm("Delete trade?")) return;
    const updated = [...trades];
    updated.splice(index, 1);
    save(updated);
  }

  // ✅ remove duplicates works
  function deleteDuplicates() {
    if (!confirm("Remove duplicates?")) return;

    const seen = new Set();
    const updated = trades.filter((t) => {
      const key = tradeKey(t);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    alert(`Removed ${trades.length - updated.length} duplicates`);
    save(updated);
  }

  function clearAll() {
    if (!confirm("Delete ALL trades?")) return;
    localStorage.removeItem("trades");
    setTrades([]);
  }

  // ✅ PDF REPORT
  function exportPDF() {
    if (!trades.length) return alert("No trades");

    let equity = 0;
    let wins = 0;

    trades.forEach((t) => {
      const p = n(t.profit);
      equity += p;
      if (p > 0) wins++;
    });

    const winRate =
      trades.length > 0
        ? ((wins / trades.length) * 100).toFixed(2)
        : 0;

    const html = `
      <html>
      <body style="font-family:Arial;padding:20px">
        <h1>Performance Report</h1>
        <p>Total Trades: ${trades.length}</p>
        <p>Net PnL: ${equity.toFixed(2)}</p>
        <p>Win Rate: ${winRate}%</p>

        <table border="1" width="100%" style="border-collapse:collapse">
          <tr>
            <th>Date</th>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>Net</th>
          </tr>

          ${trades.map(t => `
            <tr>
              <td>${normalizeDate(t.date)}</td>
              <td>${t.symbol}</td>
              <td>${n(t.quantity)}</td>
              <td>${n(t.entry)}</td>
              <td>${n(t.exit)}</td>
              <td>${n(t.profit)}</td>
            </tr>
          `).join("")}
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

  return (
    <div className="bg-white p-4 rounded-xl shadow space-y-4">

      <h2 className="text-xl font-bold text-black">
        Trade Manager
      </h2>

      {/* ✅ ACTIONS */}
      <div className="flex gap-2 flex-wrap">

        <button
          onClick={exportPDF}
          className="bg-purple-600 text-white px-3 py-2 rounded font-bold hover:bg-purple-700"
        >
          Export PDF
        </button>

        <button
          onClick={deleteDuplicates}
          className="bg-yellow-500 text-black px-3 py-2 rounded font-bold hover:bg-yellow-400"
        >
          Remove Duplicates
        </button>

        <button
          onClick={clearAll}
          className="bg-red-600 text-white px-3 py-2 rounded font-bold hover:bg-red-700"
        >
          Clear All
        </button>

      </div>

      {/* ✅ TABLE */}
      <table className="w-full text-sm border border-gray-300">
        <thead className="bg-gray-200 text-black">
          <tr>
            <th className="px-2 py-2">Date</th>
            <th className="px-2 py-2">Symbol</th>
            <th className="px-2 py-2">Qty</th>
            <th className="px-2 py-2">Entry</th>
            <th className="px-2 py-2">Exit</th>
            <th className="px-2 py-2">Net</th>
            <th className="px-2 py-2"></th>
          </tr>
        </thead>

        <tbody>
          {trades.map((t, i) => {
            const duplicate = isDuplicate(t);
            const p = n(t.profit);

            return (
              <tr
                key={i}
                className={`hover:bg-gray-50 ${duplicate ? "bg-red-100" : ""}`}
              >
                <td className="text-black font-medium px-2 py-1">
                  {normalizeDate(t.date)}
                </td>

                <td className="text-black font-bold px-2 py-1">
                  {t.symbol} {duplicate && "⚠️"}
                </td>

                <td className="text-black px-2 py-1">
                  {n(t.quantity)}
                </td>

                <td className="text-black px-2 py-1">
                  {n(t.entry)}
                </td>

                <td className="text-black px-2 py-1">
                  {n(t.exit)}
                </td>

                <td
                  className={`font-bold px-2 py-1 ${
                    p >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {p.toFixed(2)}
                </td>

                <td className="px-2 py-1">
                  <button
                    onClick={() => deleteTrade(i)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

    </div>
  );
}