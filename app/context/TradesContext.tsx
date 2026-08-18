"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type Trade = {
  id: number | string;
  date: string;
  symbol: string;
  side: string;
  quantity: number;
  entry: number;
  exit: number;
  strategy: string;
  profit: number;
  risk: number;

  direction?: string;
  grossProfit?: number;
  broker?: string;
  account?: string;
  stop?: number;
  target?: number;
  notes?: string;
  screenshotUrl?: string;
  source?: string;
  fees?: number;
  commission?: number;
};

type TradesContextType = {
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  clearTrades: () => void;
  setTrades: (trades: Trade[]) => void;
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
  const [trades, setTradesState] = useState<Trade[]>([]);
  const [storageLoaded, setStorageLoaded] =
    useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("trades");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setTradesState(parsed);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load trades:",
        error
      );
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;

    try {
      localStorage.setItem(
        "trades",
        JSON.stringify(trades)
      );
    } catch (error) {
      console.error(
        "Failed to save trades:",
        error
      );
    }
  }, [trades, storageLoaded]);

  function addTrade(trade: Trade) {
    setTradesState((previousTrades) => [
      ...previousTrades,
      trade,
    ]);
  }

  function clearTrades() {
    setTradesState([]);
    localStorage.removeItem("trades");
  }

  function setTrades(newTrades: Trade[]) {
    setTradesState(
      Array.isArray(newTrades)
        ? newTrades
        : []
    );
  }

  return (
    <TradesContext.Provider
      value={{
        trades,
        addTrade,
        clearTrades,
        setTrades,
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