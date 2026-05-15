"use client";

import { createContext, useContext, useState } from "react";

/* ---------- types ---------- */

export type Trade = {
  id: number;
  symbol: string;
  entry: number;
  exit: number;
  stop: number;
  size: number;
  strategy: string;
  profit: number;
  risk: number;
  date: string;
};

/* ---------- context ---------- */

type TradesContextType = {
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  clearTrades: () => void; // ✅ added
};

const TradesContext = createContext<TradesContextType | undefined>(undefined);

/* ---------- provider ---------- */

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);

  function addTrade(trade: Trade) {
    setTrades((prev) => [...prev, trade]);
  }

  /* ✅ clear function */
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
