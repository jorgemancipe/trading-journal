"use client";

import } from "../context/TradesContext";import { useMemo, useState } from "react";

/* ---------- types ---------- */

type Session = "Open" | "Midday" | "Power Hour";

/* ---------- helpers ---------- */

function getSessionFromDate(dateStr: string): Session | null {
  const d = new Date(dateStr);
  const hour = d.getHours();
  const min = d.getMinutes();

  if (hour === 9 && min >= 30 && min < 45) return "Open";
  if (
    (hour === 9 && min >= 45) ||
    hour === 10 ||
    (hour === 11 && min < 30)
  ) {
    return "Midday";
  }
  if (hour === 15) return "Power Hour";
  return null;
}

function avgR(trades: { profit: number; risk: number }[]) {
  if (trades.length === 0) return 0;
  return (
    trades.reduce((s, t) => s + t.profit / t.risk, 0) / trades.length
  );
}

/* ---------- page ---------- */

export default function DashboardPage() {
  const { trades } = useTrades();
  const [minTrades, setMinTrades] = useState(5);
  const [simulateApplyRules, setSimulateApplyRules] = useState(false);

  const validTrades = useMemo(
    () => trades.filter((t) => t.risk > 0),
    [trades]
  );

  /* Strategy × Session aggregation */
  const matrix = useMemo(() => {
    const map = new Map<
      string,
      Map<Session, { totalR: number; count: number }>
    >();

    for (const t of validTrades) {
      const session = getSessionFromDate(t.date);

