"use client";

import { useMemo, useState } from "react";
import { Trade } from "../context/TradesContext";

type BenchPoint = { date: string; close: number };

function parseCSV(text: string): BenchPoint[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const iDate = headers.indexOf("date");
  const iClose = headers.indexOf("close");

  const out: BenchPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const date = cols[iDate] ?? "";
    const close = Number(cols[iClose]);
    if (!date || !Number.isFinite(close)) continue;
    out.push({ date, close });
  }
  return out.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

function ymd(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}

export default function BenchmarkCompare({ trades }: { trades: Trade[] }) {
  const [startCapital, setStartCapital] = useState<number>(10000);
  const [bench, setBench] = useState<BenchPoint[]>([]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setBench(parseCSV(text));
  }

  const series = useMemo(() => {
    // Trade equity index (100 = start)
    const ordered = [...trades].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const tradeByDay = new Map<string, number>();
    for (const t of ordered) {
      const key = ymd(t.date);
      if (!key) continue;
      tradeByDay.set(key, (tradeByDay.get(key) ?? 0) + (t.profit ?? 0));
    }

    let eq = startCapital;
    const tradeIndex: { date: string; idx: number }[] = [];
    const days = Array.from(tradeByDay.keys()).sort();

    for (const d of days) {
      eq += tradeByDay.get(d) ?? 0;
      tradeIndex.push({ date: d, idx: (eq / startCapital) * 100 });
    }

    // Benchmark index (100 = first close)
    const benchIndex: { date: string; idx: number }[] = [];
    if (bench.length >= 2) {
      const base = bench[0].close;
      for (const p of bench) {
        benchIndex.push({ date: ymd(p.date) ?? p.date, idx: (p.close / base) * 100 });
      }
    }

    return { tradeIndex, benchIndex };
  }, [trades, bench, startCapital]);

  // Build simple SVG
  const W = 1000, H = 260, pad = 20;
  const innerW = W - pad*2, innerH = H - pad*2;

  const allVals = [
    ...series.tradeIndex.map(p => p.idx),
    ...series.benchIndex.map(p => p.idx),
  ];
  const min = allVals.length ? Math.min(...allVals) : 90;
  const max = allVals.length ? Math.max(...allVals) : 110;
  const span = max - min || 1;

  function toPoints(arr: { idx: number }[]) {
    return arr.map((p, i) => {
      const x = pad + (i / (arr.length - 1 || 1)) * innerW;
      const y = pad + (1 - (p.idx - min) / span) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }

  const tradePts = toPoints(series.tradeIndex);
  const benchPts = toPoints(series.benchIndex);

  return (
    <div className="bg-white border rounded-xl shadow p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-black">Equity vs Benchmark (SPY)</h2>
          <p className="text-sm text-gray-700">
            Upload SPY CSV with headers: <b>Date,Close</b>. Both lines are indexed to 100.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase">Start Capital</div>
            <input
              type="number"
              value={startCapital}
              onChange={(e) => setStartCapital(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 text-gray-900 w-40"
            />
          </div>

          <label className="bg-blue-600 text-white px-4 py-2 rounded font-semibold cursor-pointer hover:bg-blue-700">
            Upload SPY CSV
            <input type="file" accept=".csv" onChange={onUpload} className="hidden" />
          </label>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-64 bg-gray-50 border rounded-lg">
        {/* grid */}
        {[0,1,2,3,4].map(i => (
          <line
            key={i}
            x1={pad}
            x2={W-pad}
            y1={pad + i*(innerH/4)}
            y2={pad + i*(innerH/4)}
            stroke="#e5e7eb"
          />
        ))}
        {/* trade */}
        {series.tradeIndex.length >= 2 && (
          <polyline points={tradePts} fill="none" stroke="#16a34a" strokeWidth="3" />
        )}
        {/* benchmark */}
        {series.benchIndex.length >= 2 && (
          <polyline points={benchPts} fill="none" stroke="#2962FF" strokeWidth="3" />
        )}
      </svg>

      <div className="flex gap-4 mt-3 text-sm font-semibold">
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-green-600 rounded-sm" /> Your equity (indexed)</div>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-blue-600 rounded-sm" /> SPY (indexed)</div>
      </div>
    </div>
  );
}