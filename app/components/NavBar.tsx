import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex gap-6 items-center">
        <Link href="/" className="font-semibold">
          Trading Journal
        </Link>

        <Link href="/dashboard">Dashboard</Link>

        <Link href="/trades">Trades</Link>
      </div>
    </nav>
  );
}
``
