import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Trading Journal
        </Link>

        <div className="space-x-6">
          <Link href="/dashboard" className="text-gray-700 hover:text-black">
            Dashboard
          </Link>

          <Link href="/trades" className="text-gray-700 hover:text-black">
            Trades
          </Link>
        </div>
      </div>
    </nav>
  );
}