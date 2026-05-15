"use client";

import { useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";

/* ================== Types ================== */

type Session = "Open" | "Midday" | "PowerHour";

type Rule = {
  strategy: string;
  session: Session;
};

/* ================== Helpers ================== */

function getSession(date: string): Session | null {
  // Requires time in date string: YYYY-MM-DDTHH:mm
  if (!date.includes("T")) return null;

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  const h = d.getHours();
  const m = d.getMinutes();

  if (h === 9 && m >= 30 && m < 45) return "Open";
  if ((h === 9 && m >= 45) || h === 10 || (h === 11 && m < 30))
    return "Midday";
  if (h === 15) return "PowerHour";

  return null;
}

function avgR(trades: { profit: number; risk: number }[]) {
  if (trades.length === 0) return 0;
  let sum = 0;
  for (const t of trades) sum += t.profit / t.risk;
  return sum / trades.length;
}

/* ================== Page ================== */

export default function DashboardPage() {
  const { trades } = useTrades();

  const [minTrades, setMinTrades] = useState(5);
  const [simulate, setSimulate] = useState(false);

  const [acceptedRules, setAcceptedRules] = useState<Rule[]>(() => {
    try {
      const raw = localStorage.getItem("acceptedRules");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  function toggleRule(rule: Rule) {
    setAcceptedRules((prev) => {
      const exists = prev.some(
        (r) => r.strategy === rule.strategy && r.session === rule.session
      );

      const next = exists
        ? prev.filter(
            (r) =>
              !(r.strategy === rule.strategy && r.session === rule.session)
          )
        : [...prev, rule];

      localStorage.setItem("acceptedRules", JSON.stringify(next));
      return next;
    });
  }

  const validTrades = useMemo(
    () => trades.filter((t) => t.risk > 0),
    [trades]
  );

  /* ---- Build rules from data ---- */

  const rules = useMemo<Rule[]>(() => {
    const map = new Map<
      string,
      Map<Session, { sum: number; count: number }>
    >();

    for (const t of validTrades) {
      const session = getSession(t.date);
      if (!session) continue;

      const strategy = t.strategy || "Unassigned";
      const r = t.profit / t.risk;

      if (!map.has(strategy)) map.set(strategy, new Map());
      const row = map.get(strategy)!;

      const cell = row.get(session) ?? { sum: 0, count: 0 };
      cell.sum += r;
      cell.count += 1;
      row.set(session, cell);
    }

    const out: Rule[] = [];
    for (const [strategy, row] of map.entries()) {
      for (const [session, cell] of row.entries()) {
        if (cell.count >= minTrades && cell.sum / cell.count < 0) {
          out.push({ strategy, session });
        }
      }
    }
    return out;
  }, [validTrades, minTrades]);

  /* ---- Simulated trades (accepted rules only) ---- */

