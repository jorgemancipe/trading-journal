import NavBar from "../components/NavBar";

const sampleTrades = [
  {
    id: 1,
    date: "2026-05-01",
    symbol: "AAPL",
    side: "Buy",
    quantity: 100,
    price: 172.35,
    profit: 250,
  },
  {
    id: 2,
    date: "2026-05-03",
    symbol: "TSLA",
    side: "Sell",
    quantity: 50,
    price: 695.2,
    profit: -120,
  },
  {
    id: 3,
    date: "2026-05-06",
    symbol: "SPY",
    side: "Buy",
    quantity: 10,
    price: 512.1,
    profit: 90,
  },
];

export default function TradesPage() {
  const totalPL = sampleTrades.reduce(
    (sum, trade) => sum + trade.profit,
    0
  );

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
        <h1 className="text-3xl font-bold mb-4">Trades</h1>

        {/* Total P/L */}
        <div
          className={`mb-6 p-4 rounded text-lg font-semibold ${
            totalPL >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          Total P/L: ${totalPL}
        </div>

        {/* Trades table */}
        <div className="overflow-x-auto bg-white border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Symbol</th>
                <th className="px-4 py-2 text-left">Side</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">P/L</th>
              </tr>
            </thead>
            <tbody>
              {sampleTrades.map((trade) => (
                <tr key={trade.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{trade.date}</td>
                  <td className="px-4 py-2 font-medium">{trade.symbol}</td>
                  <td className="px-4 py-2">{trade.side}</td>
                  <td className="px-4 py-2 text-right">{trade.quantity}</td>
                  <td className="px-4 py-2 text-right">
                    {trade.price.toFixed(2)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-semibold ${
                      trade.profit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {trade.profit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
