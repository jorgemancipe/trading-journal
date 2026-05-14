"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Trade = {
  id: number;
  date: string;
  symbol: string;
  side: "Buy" | "Sell";
  quantity: number;
  entry: number;
  exit: number;
  profit: number;
  risk: number; // ✅ NEW
};

type TradesContextType = {
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  clearTrades: () => void;
};

const TradesContext = createContext<TradesContextType | null>(null);
const STORAGE_KEY = "trades";

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setTrades(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  }, [trades]);

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

export function useTrades() {
  const ctx = useContext(TradesContext);
  if (!ctx)
    return { trades: [], addTrade: () => {}, clearTrades: () => {} };
  return ctx;
}
``
