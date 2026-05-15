"use client";

import { createContext, useContext, useState } from "react";

/* ---------- types ---------- */

type Trade = {
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
};

const TradesContext = createContext<TradesContextType | undefined>(undefined);

/* ---------- provider ---------- */

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);

  function addTrade(trade: Trade) {
    setTrades((prev) => [...prev, trade]);
  }

  return (
    <TradesContext.Provider value={{ trades, addTrade }}>
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
