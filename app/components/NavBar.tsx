import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex gap-6 items-center">
        <Link href="/" className="font-semibold hover:underline">
          Trading Journal
        </Link>

        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>

        <Link href="/trades" className="hover:underline">
          Trades
        </Link>
      </div>
    </nav>
  );
}
