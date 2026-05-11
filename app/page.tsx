import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="text-4xl font-bold">Trading Journal</h1>

        <p className="text-gray-600">
          Welcome to your personal trading journal.
        </p>

        <p className="text-gray-500">
          Track trades, review performance, and improve your process over time.
        </p>

        <Link
          href="/dashboard"
          className="inline-block mt-6 px-6 py-3 rounded bg-blue-600 text-white hover:bg-blue-500 transition"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}