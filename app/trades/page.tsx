"use client";

import CSVImport from "./CSVImport";
import RiskPanel from "./RiskPanel";
import Dashboard from "./Dashboard";
import DailyScoreChart from "./DailyScoreChart";
import CalendarHeatmap from "./CalendarHeatmap";
import TradeCountByDate from "./TradeCountByDate";
import SessionAnalysis from "./SessionAnalysis";
import MonthlyAnalysis from "./MonthlyAnalysis";
import EquityChart from "./EquityChart";
import TradeHistory from "./TradeHistory";

export default function TradesPage() {
  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">

      <h1 className="text-3xl font-bold text-white">
        Trading Journal
      </h1>

      <CSVImport />

      <RiskPanel />

      <Dashboard />

      <DailyScoreChart />

      <CalendarHeatmap />

      <TradeCountByDate />

      <SessionAnalysis />

      <MonthlyAnalysis />

      <EquityChart />

      <TradeHistory />

    </div>
  );
}
