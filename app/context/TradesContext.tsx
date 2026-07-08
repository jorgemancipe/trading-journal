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
  const [trades, setTradesState] = useState<
    Trade[]
  >([]);

  useEffect(() => {
    const saved =
      localStorage.getItem("trades");

    if (saved) {
      try {
        setTradesState(JSON.parse(saved));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "trades",
      JSON.stringify(trades)
    );
  }, [trades]);

  function addTrade(trade: Trade) {
    setTradesState((prev) => [
      ...prev,
      trade,
    ]);
  }

  function clearTrades() {
    setTradesState([]);
    localStorage.removeItem("trades");
  }

  function setTrades(newTrades: Trade[]) {
    setTradesState(newTrades);
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
  const context =
    useContext(TradesContext);

  if (!context) {
    throw new Error(
      "useTrades must be used inside TradesProvider"
    );
  }

  return context;
}