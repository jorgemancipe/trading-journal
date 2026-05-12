"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navLinkClass(isActive: boolean) {
  return [
    "text-sm font-medium transition-colors",
    "px-3 py-1.5 rounded-full",
    "text-gray-800 hover:text-blue-700 hover:bg-blue-50",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    isActive ? "bg-blue-100 text-blue-800" : "",
  ].join(" ");
}

export default function NavBar() {
  const pathname = usePathname(); // client hook [2](https://www.tradervue.com/blog/mfe-and-mae-calculations)

  const isHome = pathname === "/";
  const isDashboard = pathname === "/dashboard";
  const isTrades = pathname === "/trades";

  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
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
