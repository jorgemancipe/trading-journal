"use client";

import { useState } from "react";

type BrokerType = "DAS" | "IBKR" | "Thinkorswim";

export default function CSVImport() {
  const [fileName, setFileName] = useState("");
  const [brokerType, setBrokerType] = useState<BrokerType>("DAS");
  const [tradingDate, setTradingDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [previewTrades, setPreviewTrades] = useState<any[]>([]);

  function n(v: any) {
    const raw = String(v || "").trim();
    const negative = raw.includes("(") && raw.includes(")");
    const x = Number(raw.replace(/[$,()]/g, ""));
    if (!Number.isFinite(x)) return 0;
    return negative ? -x : x;
  }

  function normalizeHeader(h: string) {
    return h.trim().replace(/\uFEFF/g, "");
  }

  function detectSeparator(text: string) {
    const firstLine = text.split(/\r?\n/)[0] || "";
    if (firstLine.includes("\t")) return "\t";
    if (firstLine.includes(";")) return ";";
    return ",";
  }

  function parseCSVLine(line: string, separator: string) {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  function buildLocalDateTime(date: string, time: string) {
    const cleanDate = date || new Date().toISOString().slice(0, 10);
    const cleanTime = String(time || "00:00:00").trim();

    const parts = cleanTime.split(":");

    const hh = String(parts[0] || "00").padStart(2, "0");
    const mm = String(parts[1] || "00").padStart(2, "0");
    const ss = String(parts[2] || "00").padStart(2, "0");

    return `${cleanDate}T${hh}:${mm}:${ss}`;
  }

  function parseDate(raw: any) {
    if (!raw) return null;

    const d = new Date(String(raw).trim());

    if (isNaN(d.getTime())) return null;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
  }

  function getValue(obj: any, keys: string[]) {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== "") return obj[key];
    }
    return "";
  }

  function normalizeSide(side: any) {
    const s = String(side || "").trim().toUpperCase();

    if (s === "B" || s === "BUY" || s === "BOT") return "Buy";
    if (s === "S" || s === "SELL" || s === "SLD") return "Sell";
    if (s.includes("BUY")) return "Buy";
    if (s.includes("SELL")) return "Sell";

    return "UNKNOWN";
  }

  function tradeKey(t: any) {
    return [
      t.broker,
      t.account,
      t.date,
      t.symbol,
      t.side,
      t.quantity,
      t.entry,
      t.exit,
      t.profit,
    ].join("|");
  }

  function parseExecutions(text: string) {
    const separator = detectSeparator(text);

    const lines = text
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);

    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0], separator).map(normalizeHeader);

    const executions = lines
      .slice(1)
      .map((line) => {
        const values = parseCSVLine(line, separator);
        const obj: any = {};

        headers.forEach((h, i) => {
          obj[h] = values[i]?.trim() || "";
        });

        if (brokerType === "DAS") {
          return {
            id: crypto.randomUUID(),
            date: buildLocalDateTime(
              tradingDate,
              getValue(obj, ["Time", "TIME"])
            ),
            symbol: getValue(obj, ["Symbol", "SYMBOL"]) || "UNKNOWN",
            side: normalizeSide(getValue(obj, ["Side", "SIDE"])),
            quantity: n(getValue(obj, ["Qty", "Quantity", "Shares"])),
            price: n(getValue(obj, ["Price", "Avg Price"])),
            broker: "DAS",
            account: getValue(obj, ["Account", "Acct"]) || "DEFAULT",
            route: getValue(obj, ["Route"]) || "",
          };
        }

        const rawDate = getValue(obj, [
          "Date/Time",
          "Date Time",
          "Date",
          "Trade Date",
          "Execution Time",
          "Time",
        ]);

        return {
          id: crypto.randomUUID(),
          date: parseDate(rawDate) || buildLocalDateTime(tradingDate, "00:00:00"),
          symbol:
            getValue(obj, ["Symbol", "Ticker", "Underlying", "Instrument"]) ||
            "UNKNOWN",
          side: normalizeSide(getValue(obj, ["Side", "Action", "Buy/Sell"])),
          quantity: n(getValue(obj, ["Qty", "Quantity", "Shares"])),
          price: n(getValue(obj, ["Entry", "Price", "Avg Price"])),
          broker: brokerType,
          account: getValue(obj, ["Account", "Acct", "Account Number"]) || "DEFAULT",
          route: getValue(obj, ["Route"]) || "",
          fees: n(getValue(obj, ["Fees", "Fee"])),
          commission: n(getValue(obj, ["Commission", "Commissions"])),
          ecnFees: n(getValue(obj, ["ECN", "ECN Fees"])),
        };
      })
      .filter(
        (e) =>
          e.symbol !== "UNKNOWN" &&
          e.side !== "UNKNOWN" &&
          e.quantity > 0 &&
          e.price > 0
      );

    return executions;
  }

  function buildTradesFromExecutions(executions: any[]) {
    const sorted = [...executions].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const groups: Record<string, any[]> = {};

    for (const e of sorted) {
      const key = `${e.account}|${e.symbol}|${e.date.slice(0, 10)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    }

    const completedTrades: any[] = [];

    Object.values(groups).forEach((rows) => {
      let position = 0;
      let avgPrice = 0;
      let openQty = 0;
      let side: "Long" | "Short" | null = null;
      let entryDate = "";
      let exitDate = "";
      let totalEntryValue = 0;
      let totalExitValue = 0;
      let totalQtyTraded = 0;
      let realizedPnL = 0;
      let account = "";
      let symbol = "";
      let broker = "";
      let route = "";

      function resetTrade() {
        position = 0;
        avgPrice = 0;
        openQty = 0;
        side = null;
        entryDate = "";
        exitDate = "";
        totalEntryValue = 0;
        totalExitValue = 0;
        totalQtyTraded = 0;
        realizedPnL = 0;
        account = "";
        symbol = "";
        broker = "";
        route = "";
      }

      function saveCompletedTrade() {
        if (!side || openQty <= 0) return;

        completedTrades.push({
          id: crypto.randomUUID(),
          date: entryDate,
          entryDate,
          exitDate,
          symbol,
          side,
          quantity: openQty,
          entry: totalEntryValue / openQty,
          exit: totalExitValue / openQty,
          profit: realizedPnL,
          grossProfit: realizedPnL,
          fees: 0,
          commission: 0,
          ecnFees: 0,
          broker,
          account,
          route,
          strategy: "IMPORT",
          source: "BUILT_FROM_EXECUTIONS",
        });
      }

      resetTrade();

      for (const e of rows) {
        const signedQty = e.side === "Buy" ? e.quantity : -e.quantity;

        account = e.account;
        symbol = e.symbol;
        broker = e.broker;
        route = e.route || route;

        if (position === 0) {
          position = signedQty;
          side = position > 0 ? "Long" : "Short";
          avgPrice = e.price;
          openQty = Math.abs(signedQty);
          totalQtyTraded = e.quantity;
          totalEntryValue = e.quantity * e.price;
          entryDate = e.date;
          continue;
        }

        const sameDirection =
          (position > 0 && signedQty > 0) || (position < 0 && signedQty < 0);

        if (sameDirection) {
          const oldAbs = Math.abs(position);
          const newAbs = oldAbs + Math.abs(signedQty);

          avgPrice =
            (avgPrice * oldAbs + e.price * Math.abs(signedQty)) / newAbs;

          position += signedQty;
          openQty += Math.abs(signedQty);
          totalQtyTraded += Math.abs(signedQty);
          totalEntryValue += Math.abs(signedQty) * e.price;
          continue;
        }

        let remainingQty = Math.abs(signedQty);

        while (remainingQty > 0) {
          const positionAbs = Math.abs(position);
          const closeQty = Math.min(positionAbs, remainingQty);

          if (position > 0) {
            realizedPnL += (e.price - avgPrice) * closeQty;
          } else {
            realizedPnL += (avgPrice - e.price) * closeQty;
          }

          totalExitValue += closeQty * e.price;
          totalQtyTraded += closeQty;
          exitDate = e.date;

          if (position > 0) {
            position -= closeQty;
          } else {
            position += closeQty;
          }

          remainingQty -= closeQty;

          if (position === 0) {
            saveCompletedTrade();

            const leftoverDirection = signedQty > 0 ? 1 : -1;

            resetTrade();

            if (remainingQty > 0) {
              position = remainingQty * leftoverDirection;
              side = position > 0 ? "Long" : "Short";
              avgPrice = e.price;
              openQty = remainingQty;
              totalQtyTraded = remainingQty;
              totalEntryValue = remainingQty * e.price;
              entryDate = e.date;
              account = e.account;
              symbol = e.symbol;
              broker = e.broker;
              route = e.route || "";
              remainingQty = 0;
            }
          }
        }
      }

      if (position !== 0 && side) {
        completedTrades.push({
          id: crypto.randomUUID(),
          date: entryDate,
          entryDate,
          exitDate: "",
          symbol,
          side,
          quantity: openQty,
          entry: totalEntryValue / openQty,
          exit: 0,
          profit: realizedPnL,
          grossProfit: realizedPnL,
          fees: 0,
          commission: 0,
          ecnFees: 0,
          broker,
          account,
          route,
          strategy: "IMPORT",
          source: "OPEN_POSITION_FROM_EXECUTIONS",
          open: true,
        });
      }
    });

    return completedTrades;
  }

  function parseTrades(text: string) {
    const executions = parseExecutions(text);
    return buildTradesFromExecutions(executions);
  }

  async function handleFile(file: File) {
    setFileName(file.name);

    const text = await file.text();
    const parsed = parseTrades(text);

    console.log("BUILT TRADES", parsed);

    setPreviewTrades(parsed);
  }

  function saveTrades(replace: boolean) {
    const existing = replace
      ? []
      : JSON.parse(localStorage.getItem("trades") || "[]");

    const existingKeys = new Set(existing.map(tradeKey));

    const cleanTrades = previewTrades.filter(
      (t) => !existingKeys.has(tradeKey(t))
    );

    const updated = [...existing, ...cleanTrades];

    localStorage.setItem("trades", JSON.stringify(updated));

    alert(`Imported ${cleanTrades.length} trade(s)`);

    location.reload();
  }

  return (
    <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-xl">
      <h2 className="text-xl font-bold mb-4">Import Trades</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">Broker Source</label>

          <select
            value={brokerType}
            onChange={(e) => setBrokerType(e.target.value as BrokerType)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 mt-1"
          >
            <option value="DAS">DAS</option>
            <option value="IBKR">IBKR</option>
            <option value="Thinkorswim">Thinkorswim</option>
          </select>
        </div>

        {brokerType === "DAS" && (
          <div>
            <label className="text-sm text-gray-400">Trading Date</label>

            <input
              type="date"
              value={tradingDate}
              onChange={(e) => setTradingDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 mt-1"
            />
          </div>
        )}

        <input
          type="file"
          accept=".csv,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="w-full bg-slate-800 border border-slate-700 rounded p-3"
        />

        {fileName && <div className="text-sm text-gray-400">{fileName}</div>}

        {previewTrades.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="font-bold mb-2">Import Preview</div>

            <div>Built Trades: {previewTrades.length}</div>

            <div className="text-xs text-gray-400 mt-2">
              First Trade: {previewTrades[0]?.date}
            </div>

            <div className="text-xs text-gray-400 mt-1">
              {previewTrades[0]?.symbol} | {previewTrades[0]?.side} | Qty:{" "}
              {previewTrades[0]?.quantity} | P/L:{" "}
              {previewTrades[0]?.profit?.toFixed?.(2)}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => saveTrades(false)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold"
              >
                Append Trades
              </button>

              <button
                onClick={() => saveTrades(true)}
                className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-bold"
              >
                Replace All Trades
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}