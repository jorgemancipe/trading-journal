"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navLinkClass(isActive: boolean) {
  return [
    "text-sm font-medium transition-colors",
    "text-gray-800 hover:text-blue-600",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded",
    isActive ? "text-blue-700 underline underline-offset-4" : "",
  ].join(" ");
}

export default function NavBar() {
  const pathname = usePathname(); // e.g. "/", "/dashboard", "/trades" [1](https://nextjs.org/docs/app/api-reference/functions/use-pathname)

  const isHome = pathname === "/";
  const isDashboard = pathname === "/dashboard";
  const isTrades = pathname === "/trades";

  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex gap-6 items-center">
        <Link href="/" className={navLinkClass(isHome)}>
          Trading Journal
        </Link>

        <Link href="/dashboard" className={navLinkClass(isDashboard)}>
          Dashboard
        </Link>

        <Link href="/trades" className={navLinkClass(isTrades)}>
          Trades
        </Link>
      </div>
    </nav>
  );
}
