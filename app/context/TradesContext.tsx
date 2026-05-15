"use client";

import { createContext, useContext, useState } from // e.g. "2026-05-15" or ISO stringimport { createContext, useContext, useState } from "react";
  symbol: string;              // e.g. "AAPL"
  strategy: string;            // e.g. "ORB"
  side: "Buy" | "Sell";        // ✅ FIX: add side
  quantity: number;            // ✅ FIX: add quantity
  entry: number;
  exit: number;
  profit: number;
  risk: number;                // manual $ risk (your chosen model)
};

/* ---------- context ---------- */

type TradesContextType = {
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  clearTrades: () => void;
};

const TradesContext = createContext<TradesContextType | undefined>(undefined);

/* ---------- provider ---------- */

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);

  function addTrade(trade: Trade) {
    setTrades((prev) => [...prev, trade]);
  }

  function clearTrades() {
    setTrades([]);
  }

  return (
    <TradesContext.Provider value={{ trades, addTrade, clearTrades }}>
      {children}
    </TradesContext.Provider>
  );
}

/* ---------- hook ---------- */

export function useTrades() {
  const context = useContext(TradesContext);
  if (!context) {
    throw new Error("useTrades must be used inside TradesProvider");
  }
  return context;
}


/* ---------- types ---------- */

export type Trade = {
  id: number;
  date: string;
  symbol: string;
  strategy: string;
  side: "Buy" | "Sell";   // ✅ MUST exist
  quantity: number;       // ✅ MUST exist
  entry: number;
  exit: number;
  profit: number;
  risk: number;
};
``
