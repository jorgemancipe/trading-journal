"use client";

import { useState } from "react";
import { useTrades } from "../context/TradesContext";

type BrokerType = "DAS" | "IBKR" | "Thinkorswim";

type Execution = {
  id: string;
  date: string;
  symbol: string;
  side: "Buy" | "Sell";
  quantity: number;
  price: number;
  broker: BrokerType;
  account: string;
  route?: string;
  commission?: number;
  fees?: number;
};

type BuiltTrade = {
  id: string;
  date: string;
  entryDate: string;
  exitDate: string;
  symbol: string;
  side: "Buy" | "Sell";
  direction: "Long" | "Short";
  quantity: number;
  entry: number;
  exit: number;
  profit: number;
  grossProfit: number;
  commission: number;
  fees: number;
  ecnFees: number;
  risk: number;
  strategy: string;
  broker: BrokerType;
  account: string;
  route: string;
  source: string;
  open?: boolean;
};

export default function CSVImport() {
  const { trades, setTrades } = useTrades() as any;

  const [fileName, setFileName] = useState("");
  const [brokerType, setBrokerType] = useState<BrokerType>("DAS");
  const [tradingDate, setTradingDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [previewTrades, setPreviewTrades] = useState<BuiltTrade[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [lastImportMessage, setLastImportMessage] = useState("");

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

    const value = String(raw).trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 19);
    }

    const d = new Date(value);

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
      if (obj[key] !== undefined && obj[key] !== "") {
        return obj[key];
      }
    }

    return "";
  }

  function normalizeSide(value: any): "Buy" | "Sell" | "UNKNOWN" {
    const s = String(value || "").trim().toUpperCase();

    if (s === "B" || s === "BUY" || s === "BOT") return "Buy";
    if (s === "S" || s === "SELL" || s === "SLD") return "Sell";
    if (s.includes("BUY")) return "Buy";
    if (s.includes("SELL")) return "Sell";

    return "UNKNOWN";
  }

  function parseExecutions(text: string): Execution[] {
    const separator = detectSeparator(text);

    const lines = text
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);

    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0], separator).map(normalizeHeader);
    const executions: Execution[] = [];

    for (const line of lines.slice(1)) {
      const values = parseCSVLine(line, separator);
      const obj: any = {};

      headers.forEach((h, i) => {
        obj[h] = values[i]?.trim() || "";
      });

      if (brokerType === "DAS") {
        const side = normalizeSide(getValue(obj, ["Side", "SIDE"]));

        if (side === "UNKNOWN") continue;

        executions.push({
          id: crypto.randomUUID(),
          date: buildLocalDateTime(
            tradingDate,
            getValue(obj, ["Time", "TIME"])
          ),
          symbol:
            getValue(obj, ["Symbol", "SYMBOL"]).toUpperCase() || "UNKNOWN",
          side,
          quantity: n(getValue(obj, ["Qty", "Quantity", "Shares"])),
          price: n(getValue(obj, ["Price", "Avg Price"])),
          broker: "DAS",
          account: getValue(obj, ["Account", "Acct"]) || "DEFAULT",
          route: getValue(obj, ["Route"]) || "",
          commission: 0,
          fees: 0,
        });
      } else {
        const side = normalizeSide(
          getValue(obj, ["Side", "Action", "Buy/Sell"])
        );

        if (side === "UNKNOWN") continue;

        const rawDate = getValue(obj, [
          "Date/Time",
          "Date Time",
          "Trade Date",
          "Execution Time",
          "Date",
          "Time",
        ]);

        executions.push({
          id: crypto.randomUUID(),
          date:
            parseDate(rawDate) ||
            buildLocalDateTime(tradingDate, "00:00:00"),
          symbol:
            getValue(obj, ["Symbol", "Ticker", "Underlying", "Instrument"])
              .toUpperCase() || "UNKNOWN",
          side,
          quantity: n(getValue(obj, ["Qty", "Quantity", "Shares"])),
          price: n(getValue(obj, ["Price", "Avg Price", "Entry"])),
          broker: brokerType,
          account:
            getValue(obj, ["Account", "Acct", "Account Number"]) || "DEFAULT",
          route: getValue(obj, ["Route"]) || "",
          commission: n(getValue(obj, ["Commission", "Commissions"])),
          fees: n(getValue(obj, ["Fees", "Fee", "ECN", "ECN Fees"])),
        });
      }
    }

    return executions.filter(
      (e) => e.symbol !== "UNKNOWN" && e.quantity > 0 && e.price > 0
    );
  }

  function buildTradesFromExecutions(executions: Execution[]) {
    const sorted = [...executions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const groups: Record<string, Execution[]> = {};

    sorted.forEach((e) => {
      const day = e.date.slice(0, 10);
      const key = `${e.account}|${e.symbol}|${day}`;

      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });

    const builtTrades: BuiltTrade[] = [];
    const warnings: string[] = [];

    Object.values(groups).forEach((rows) => {
      let position = 0;
      let avgEntry = 0;
      let openQty = 0;
      let totalEntryValue = 0;
      let totalExitValue = 0;
      let realizedPnL = 0;
      let commissions = 0;
      let fees = 0;

      let entryDate = "";
      let exitDate = "";
      let symbol = "";
      let account = "";
      let broker: BrokerType = brokerType;
      let route = "";
      let direction: "Long" | "Short" | null = null;

      function resetTrade() {
        position = 0;
        avgEntry = 0;
        openQty = 0;
        totalEntryValue = 0;
        totalExitValue = 0;
        realizedPnL = 0;
        commissions = 0;
        fees = 0;
        entryDate = "";
        exitDate = "";
        symbol = "";
        account = "";
        broker = brokerType;
        route = "";
        direction = null;
      }

      function saveTrade(open = false) {
        if (!direction || openQty <= 0 || !symbol) return;

        const entry = totalEntryValue / openQty;
        const exit = open ? 0 : totalExitValue / openQty;

        builtTrades.push({
          id: crypto.randomUUID(),
          date: entryDate,
          entryDate,
          exitDate: open ? "" : exitDate,
          symbol,
          side: direction === "Long" ? "Buy" : "Sell",
          direction,
          quantity: openQty,
          entry,
          exit,
          profit: Number((realizedPnL - commissions - fees).toFixed(2)),
          grossProfit: Number(realizedPnL.toFixed(2)),
          commission: Number(commissions.toFixed(2)),
          fees: Number(fees.toFixed(2)),
          ecnFees: 0,
          risk: 0,
          strategy: "IMPORT",
          broker,
          account,
          route,
          source: open
            ? "OPEN_POSITION_FROM_EXECUTIONS"
            : "BUILT_FROM_EXECUTIONS",
          open,
        });
      }

      resetTrade();

      for (const e of rows) {
        commissions += e.commission || 0;
        fees += e.fees || 0;

        symbol = e.symbol;
        account = e.account;
        broker = e.broker;
        route = e.route || route;

        const signedQty = e.side === "Buy" ? e.quantity : -e.quantity;

        if (position === 0) {
          position = signedQty;
          direction = position > 0 ? "Long" : "Short";
          avgEntry = e.price;
          openQty = Math.abs(signedQty);
          totalEntryValue = Math.abs(signedQty) * e.price;
          entryDate = e.date;
          continue;
        }

        const sameDirection =
          (position > 0 && signedQty > 0) ||
          (position < 0 && signedQty < 0);

        if (sameDirection) {
          const oldAbs = Math.abs(position);
          const addAbs = Math.abs(signedQty);
          const newAbs = oldAbs + addAbs;

          avgEntry = (avgEntry * oldAbs + e.price * addAbs) / newAbs;

          position += signedQty;
          openQty += addAbs;
          totalEntryValue += addAbs * e.price;
          continue;
        }

        let remainingQty = Math.abs(signedQty);
        const incomingDirection = signedQty > 0 ? 1 : -1;

        while (remainingQty > 0) {
          const positionAbs = Math.abs(position);
          const closeQty = Math.min(positionAbs, remainingQty);

          if (position > 0) {
            realizedPnL += (e.price - avgEntry) * closeQty;
          } else {
            realizedPnL += (avgEntry - e.price) * closeQty;
          }

          totalExitValue += closeQty * e.price;
          exitDate = e.date;

          position += position > 0 ? -closeQty : closeQty;
          remainingQty -= closeQty;

          if (position === 0) {
            saveTrade(false);
            resetTrade();

            if (remainingQty > 0) {
              position = remainingQty * incomingDirection;
              direction = position > 0 ? "Long" : "Short";
              avgEntry = e.price;
              openQty = remainingQty;
              totalEntryValue = remainingQty * e.price;
              entryDate = e.date;
              symbol = e.symbol;
              account = e.account;
              broker = e.broker;
              route = e.route || "";
              remainingQty = 0;
            }
          }
        }
      }

      if (position !== 0 && direction) {
        saveTrade(true);

        warnings.push(
          `${symbol} has an open ${direction} position of ${Math.abs(
            position
          )} share(s).`
        );
      }
    });

    setImportWarnings(warnings);

    return builtTrades;
  }

  function tradeKey(t: any) {
    return [
      t.broker || "",
      t.account || "",
      t.date || "",
      t.symbol || "",
      t.side || "",
      n(t.quantity),
      n(t.entry).toFixed(4),
      n(t.exit).toFixed(4),
      n(t.profit).toFixed(2),
    ].join("|");
  }

  function parseTrades(text: string) {
    const executions = parseExecutions(text);

    return buildTradesFromExecutions(executions);
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setLastImportMessage("");

    const text = await file.text();
    const parsed = parseTrades(text);

    setPreviewTrades(parsed);
  }

  function saveTrades(replace: boolean) {
    const existing = replace ? [] : Array.isArray(trades) ? trades : [];

    const existingKeys = new Set(existing.map(tradeKey));

    const cleanTrades = previewTrades.filter(
      (t) => !existingKeys.has(tradeKey(t))
    );

    const updated = [...existing, ...cleanTrades];

    setTrades(updated);

    setLastImportMessage(`Imported ${cleanTrades.length} trade(s).`);

    setPreviewTrades([]);
    setFileName("");
  }

  const totalPnL = previewTrades.reduce(
    (sum, t) => sum + Number(t.profit || 0),
    0
  );

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

        {fileName && (
          <div className="text-sm text-gray-400">{fileName}</div>
        )}

        {lastImportMessage && (
          <div className="bg-green-600/20 border border-green-600 text-green-300 p-3 rounded">
            {lastImportMessage}
          </div>
        )}

        {previewTrades.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-4 space-y-2">
            <div className="font-bold">Import Preview</div>

            <div>Built Trades: {previewTrades.length}</div>

            <div>
              Preview P/L:{" "}
              <span
                className={
                  totalPnL >= 0 ? "text-green-400" : "text-red-400"
                }
              >
                {totalPnL.toFixed(2)}
              </span>
            </div>

            <div className="text-xs text-gray-400">
              First Trade: {previewTrades[0]?.date}
            </div>

            <div className="text-xs text-gray-400">
              {previewTrades[0]?.symbol} | {previewTrades[0]?.direction} | Qty:{" "}
              {previewTrades[0]?.quantity} | Entry:{" "}
              {previewTrades[0]?.entry?.toFixed?.(4)} | Exit:{" "}
              {previewTrades[0]?.exit?.toFixed?.(4)} | P/L:{" "}
              {previewTrades[0]?.profit?.toFixed?.(2)}
            </div>

            {importWarnings.length > 0 && (
              <div className="bg-yellow-500 text-black p-3 rounded text-sm">
                <div className="font-bold">Warnings</div>

                {importWarnings.map((w, i) => (
                  <div key={i}>{w}</div>
                ))}
              </div>
            )}

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