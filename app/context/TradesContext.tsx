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

const TradesContext = createContext<TradesContextType | null>(null);

/* ---------- provider ---------- */

export function TradesProvider({ children }: { children: React.ReactNode }) {
