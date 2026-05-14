"use client";

import { useMemo, useState } from "react";
import { useTrades, Trade } from "../context/TradesContext";

/** Timestamp like 2026-05-14_14-33-07 (local time) */
function timestampString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}`;
}

/** RFC4180-ish CSV escaping: wrap in quotes, escape quotes, preserve commas/newlines */
function csvCell(value: unknown) {
  if (value === null || value === undefined) return '""';
  const s = String(value).replace(/"/g, '""');
  return `"${s}"`;
}

function buildCSV(rows: unknown[][]) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function downloadCSV(csvText: string, filename: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function exportTradesCSV(
  trades: Trade[],
  filenamePrefix: string,
  summary?: Record<string, string | number>
) {
  if (!trades || trades.length === 0) return;

  // Summary lines (optional) — included as normal CSV rows (not official comments) [1](https://www.tradervue.com/help/reports/reports_advanced_trends)[2](https://bullishbears.com/tradervue-review/)
  const summaryRows: unknown[][] = summary
    ? [
        ["Filter Summary", ""],
        ...Object.entries(summary).map(([k, v]) => [k, v]),
