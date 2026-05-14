"use client";

import { useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";

/* ---------- types ---------- */

type Session = "Open" | "Midday" | "Power Hour";

type Rule = {
  strategy: string;
  session: Session;
};

/* ---------- helpers ---------- */

/**
 * Supports either:
 * - "YYYY-MM-DD" (no time) -> returns null (can't infer session)
 * - "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD HH:mm" -> uses local time to bucket
 */
function getSessionFromDateTime(dateOrDateTime: string): Session | null {
