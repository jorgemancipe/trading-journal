"use client";

import { createContext, useContext, useState } from "react";

/* ---------- types (MATCHES YOUR FORM EXACTLY) ---------- */

export type Trade = {
  id: number;
  date: string;
  symbol: string;

  side: "Buy" | "Sell";      // ✅ FIXED (your error)
  quantity: number;          // ✅ FIXED (your error)

  entry: number;
  exit: number;

  strategy: string;

  profit: number;
  risk: number;
};

/* ---------- context ---------- */

type TradesContextType = {
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  clearTrades: () => void;
};

const TradesContext = createContext<TradesContextType | undefined>(undefined);

/* ---------- provider ---------- */

export function TradesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [trades, setTrades] = useState<Trade[]>([]);

  /* ✅ Save trade */
  function addTrade(trade: Trade) {
    setTrades((prev) => [...prev, trade]);
  }

  /* ✅ Clear all trades */
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
