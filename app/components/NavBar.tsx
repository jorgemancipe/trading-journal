import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex gap-6 items-center">
        <Link
          href="/"
          className="text-gray-900 font-semibold hover:text-blue-600"
        >
          Trading Journal
        </Link>

        <Link
          href="/dashboard"
          className="text-gray-800 hover:text-blue-600"
        >
          Dashboard
        </Link>

        <Link
          href="/trades"
          className="text-gray-800 hover:text-blue-600"
        >
          Trades
        </Link>
      </div>
    </nav>
  );
}
