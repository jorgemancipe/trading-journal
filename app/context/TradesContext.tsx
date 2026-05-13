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
};

type TradesContextType = {
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  clearTrades: () => void;
};

const TradesContext = createContext<TradesContextType | null>(null);

const STORAGE_KEY = "trading_journal_trades";

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);

  /* ✅ Load trades from localStorage on first mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTrades(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load trades from localStorage", e);
    }
  }, []);

  /* ✅ Persist trades whenever they change */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    } catch (e) {
      console.error("Failed to save trades to localStorage", e);
    }
  }, [trades]);

  function addTrade(trade: Trade) {
    setTrades((prev) => [...prev, trade]);
  }

  function clearTrades() {
    setTrades([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <TradesContext.Provider value={{ trades, addTrade, clearTrades }}>
      {children}
    </TradesContext.Provider>
  );
}

export function useTrades() {
  const context = useContext(TradesContext);
  if (!context) {
    throw new Error("useTrades must be used within TradesProvider");
  }
  return context;
}
