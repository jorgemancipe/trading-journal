import Link from "next/link";

export default function NavBar() {
  return (
    <nav class <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">    <nav className="w-full bg-white border-b border-gray-200">
        <Link href="/" className="font-semibold">
          Trading Journal
        </Link>

        <Link href="/dashboard">Dashboard</Link>
        <Link href="/trades">Trades</Link>
      </div>
    </nav>
  );
}
