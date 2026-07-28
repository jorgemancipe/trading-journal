"use client";

import { useMemo, useState } from "react";
import { useTrades } from "../context/TradesContext";

const STRATEGY_PRESETS = [
  "ORB (Opening Range Breakout)",
  "VWAP Reversion/Trend",
  "9 EMA Pullback",
  "Premarket Levels (PMH/PML)",
  "Yesterday Levels (YH/YL/Close)",
  "Camarilla Levels",
  "Volume Confirmation",
  "Level 2 Confirmation",
  "Breakout",
  "Reversal",
  "Trend Continuation",
  "Scalp",
  "Custom…",
] as const;

type StrategyPreset = (typeof STRATEGY_PRESETS)[number];

type ManualTradeForm = {
  date: string;
  symbol: string;
  broker: string;
  account: string;
  side: "Buy" | "Sell";
  quantity: number;
  entry: number;
  exit: number;
  stop: number;
  target: number;
  risk: number;
  strategyPreset: StrategyPreset;
  customStrategy: string;
  notes: string;
  screenshotUrl: string;
};

function todayLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export default function TradesClient() {
  const { addTrade } = useTrades();

  const [form, setForm] = useState<ManualTradeForm>({
    date: todayLocal(),
    symbol: "",
    broker: "Manual",
    account: "DEFAULT",
    side: "Buy",
    quantity: 0,
    entry: 0,
    exit: 0,
    stop: 0,
    target: 0,
    risk: 0,
    strategyPreset: STRATEGY_PRESETS[0],
    customStrategy: "",
    notes: "",
    screenshotUrl: "",
  });

  const isCustom = form.strategyPreset === "Custom…";

  const calculated = useMemo(() => {
    const qty = n(form.quantity);
    const entry = n(form.entry);
    const exit = n(form.exit);
    const stop = n(form.stop);
    const target = n(form.target);

    const profit =
      form.side === "Buy"
        ? (exit - entry) * qty
        : (entry - exit) * qty;

    const autoRisk =
      stop > 0 && entry > 0 && qty > 0
        ? Math.abs(entry - stop) * qty
        : n(form.risk);

    const reward =
      target > 0 && entry > 0 && qty > 0
        ? form.side === "Buy"
          ? Math.max(0, target - entry) * qty
          : Math.max(0, entry - target) * qty
        : 0;

    const rMultiple = autoRisk > 0 ? profit / autoRisk : 0;
    const rewardRisk = autoRisk > 0 && reward > 0 ? reward / autoRisk : 0;

    return {
      profit,
      risk: autoRisk,
      reward,
      rMultiple,
      rewardRisk,
    };
  }, [form]);

  function resetForm() {
    setForm((prev) => ({
      ...prev,
      symbol: "",
      quantity: 0,
      entry: 0,
      exit: 0,
      stop: 0,
      target: 0,
      risk: 0,
      customStrategy: "",
      notes: "",
      screenshotUrl: "",
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();

    const symbol = form.symbol.trim().toUpperCase();

    if (!symbol) {
      alert("Symbol is required.");
      return;
    }

    if (form.quantity <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }

    if (form.entry <= 0) {
      alert("Entry price must be greater than 0.");
      return;
    }

    if (form.exit <= 0) {
      alert("Exit price must be greater than 0.");
      return;
    }

    if (calculated.risk <= 0) {
      alert("Risk must be greater than 0. Add risk manually or enter a stop price.");
      return;
    }

    const strategy = isCustom
      ? form.customStrategy.trim() || "Custom"
      : form.strategyPreset;

    const trade = {
      id: crypto.randomUUID(),
      date: `${form.date}T00:00:00`,
      symbol,
      side: form.side,
      direction: form.side === "Buy" ? "Long" : "Short",
      quantity: n(form.quantity),
      entry: n(form.entry),
      exit: n(form.exit),
      stop: n(form.stop),
      target: n(form.target),
      strategy,
      profit: Number(calculated.profit.toFixed(2)),
      grossProfit: Number(calculated.profit.toFixed(2)),
      risk: Number(calculated.risk.toFixed(2)),
      rMultiple: Number(calculated.rMultiple.toFixed(2)),
      rewardRisk: Number(calculated.rewardRisk.toFixed(2)),
      broker: form.broker || "Manual",
      account: form.account || "DEFAULT",
      notes: form.notes,
      screenshotUrl: form.screenshotUrl,
      source: "MANUAL_ENTRY",
    };

    addTrade(trade);

    alert("Manual trade added.");

    resetForm();
  }

  return (
    <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-xl space-y-6">
      <div>
        <h2 className="text-xl font-bold">Manual Trade Entry</h2>
        <p className="text-sm text-gray-400 mt-1">
          Add trades manually for testing, journaling, or broker corrections.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Date">
            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  date: e.target.value,
                }))
              }
              className="input"
              required
            />
          </Field>

          <Field label="Symbol">
            <input
              placeholder="AAPL, TSLA, AMDL"
              value={form.symbol}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  symbol: e.target.value,
                }))
              }
              className="input uppercase"
              required
            />
          </Field>

          <Field label="Broker">
            <input
              value={form.broker}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  broker: e.target.value,
                }))
              }
              className="input"
              placeholder="DAS, IBKR, Schwab, Manual"
            />
          </Field>

          <Field label="Account">
            <input
              value={form.account}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  account: e.target.value,
                }))
              }
              className="input"
              placeholder="DEFAULT"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Field label="Direction">
            <select
              value={form.side}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  side: e.target.value as "Buy" | "Sell",
                }))
              }
              className="input"
            >
              <option value="Buy">Long / Buy</option>
              <option value="Sell">Short / Sell</option>
            </select>
          </Field>

          <Field label="Quantity">
            <input
              type="number"
              value={form.quantity}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  quantity: Number(e.target.value),
                }))
              }
              className="input"
              min="0"
              step="1"
              required
            />
          </Field>

          <Field label="Entry">
            <input
              type="number"
              value={form.entry}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  entry: Number(e.target.value),
                }))
              }
              className="input"
              min="0"
              step="0.0001"
              required
            />
          </Field>

          <Field label="Exit">
            <input
              type="number"
              value={form.exit}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  exit: Number(e.target.value),
                }))
              }
              className="input"
              min="0"
              step="0.0001"
              required
            />
          </Field>

          <Field label="Manual Risk">
            <input
              type="number"
              value={form.risk}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  risk: Number(e.target.value),
                }))
              }
              className="input"
              min="0"
              step="0.01"
              placeholder="Optional if stop is used"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Stop">
            <input
              type="number"
              value={form.stop}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  stop: Number(e.target.value),
                }))
              }
              className="input"
              min="0"
              step="0.0001"
              placeholder="Optional"
            />
          </Field>

          <Field label="Target">
            <input
              type="number"
              value={form.target}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  target: Number(e.target.value),
                }))
              }
              className="input"
              min="0"
              step="0.0001"
              placeholder="Optional"
            />
          </Field>

          <Field label="Strategy">
            <select
              value={form.strategyPreset}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  strategyPreset: e.target.value as StrategyPreset,
                }))
              }
              className="input"
            >
              {STRATEGY_PRESETS.map((strategy) => (
                <option key={strategy} value={strategy}>
                  {strategy}
                </option>
              ))}
            </select>
          </Field>

          {isCustom ? (
            <Field label="Custom Strategy">
              <input
                value={form.customStrategy}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    customStrategy: e.target.value,
                  }))
                }
                className="input"
                placeholder="My setup name"
              />
            </Field>
          ) : (
            <div className="bg-slate-800 rounded-lg p-3 flex items-end text-sm text-gray-400">
              Preset strategy selected
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              className="input min-h-[90px]"
              placeholder="What was the setup? What did you do well? What should improve?"
            />
          </Field>

          <Field label="Screenshot URL">
            <input
              value={form.screenshotUrl}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  screenshotUrl: e.target.value,
                }))
              }
              className="input"
              placeholder="Optional chart screenshot link"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <PreviewMetric
            label="Estimated P&L"
            value={calculated.profit.toFixed(2)}
            positive={calculated.profit >= 0}
          />

          <PreviewMetric
            label="Risk"
            value={calculated.risk.toFixed(2)}
            positive={calculated.risk > 0}
          />

          <PreviewMetric
            label="R-Multiple"
            value={calculated.rMultiple.toFixed(2)}
            positive={calculated.rMultiple >= 0}
          />

          <PreviewMetric
            label="Reward"
            value={calculated.reward.toFixed(2)}
            positive={calculated.reward >= 0}
          />

          <PreviewMetric
            label="Reward/Risk"
            value={calculated.rewardRisk.toFixed(2)}
            positive={calculated.rewardRisk >= 1}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded font-bold"
          >
            Add Manual Trade
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="bg-slate-700 hover:bg-slate-600 px-5 py-3 rounded font-bold"
          >
            Reset Form
          </button>
        </div>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          background: rgb(30 41 59);
          border: 1px solid rgb(51 65 85);
          color: white;
          border-radius: 0.5rem;
          padding: 0.6rem 0.75rem;
          outline: none;
        }

        .input:focus {
          border-color: rgb(34 197 94);
        }

        .input::placeholder {
          color: rgb(148 163 184);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      {children}
    </label>
  );
}

function PreviewMetric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="bg-slate-800 p-4 rounded-xl">
      <div className="text-xs text-gray-400">{label}</div>
      <div
        className={`text-xl font-bold ${
          positive ? "text-green-400" : "text-red-400"
        }`}
      >
        {value}
      </div>
    </div>
  );
}