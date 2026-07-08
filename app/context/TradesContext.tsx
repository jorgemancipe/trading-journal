"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type Trade = {
  id: string | number;
  date: string;
  symbol: string;

  side: string;

  quantity: number;

  entry: number;
  exit: number;

  strategy?: string;

  profit: number;
  risk?: number;

  broker?: string;
  account?: string;
};

type TradesContextType = {
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  addTrades: (trades: Trade[]) => void;
  updateTrades: (trades: Trade[]) => void;
  clearTrades: () => void;
};

const TradesContext =
  createContext<TradesContextType | undefined>(
    undefined
  );

export function TradesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("trades");

      if (stored) {
        setTrades(JSON.parse(stored));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "trades",
      JSON.stringify(trades)
    );
  }, [trades]);

  function addTrade(trade: Trade) {
    setTrades((prev) => [...prev, trade]);
  }

  function addTrades(newTrades: Trade[]) {
    setTrades((prev) => [...prev, ...newTrades]);
  }

  function updateTrades(newTrades: Trade[]) {
    setTrades(newTrades);
  }

  function clearTrades() {
    setTrades([]);
    localStorage.removeItem("trades");
  }

  return (
    <TradesContext.Provider
      value={{
        trades,
        addTrade,
        addTrades,
        updateTrades,
        clearTrades,
      }}
    >
      {children}
    </TradesContext.Provider>
  );
}

export function useTrades() {
  const context = useContext(TradesContext);

  if (!context) {
    throw new Error(
      "useTrades must be used inside TradesProvider"
    );
  }

  return context;
}