"use client";

import { TradesProvider } from "../context/TradesContext";
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TradesProvider>{children}</TradesProvider>;
}
