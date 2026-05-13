"use client";

import { createContext, useContext, useState } from "react";

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
};

const TradesContext = createContext<TradesContextType | null>(null);

const initialTrades: Trade[] = [
  {
    id: 1,
    date: "2026-05-01",
    symbol: "AAPL",
    side: "Buy",
    quantity: 100,
    entry: 172.35,
    exit: 174.85,
    profit: (174.85 - 172.35) * 100,
  },
];

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);

  function addTrade(trade: Trade) {
    setTrades((prev) => [...prev, trade]);
  }

  return (
    <TradesContext.Provider value={{ trades, addTrade }}>
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
