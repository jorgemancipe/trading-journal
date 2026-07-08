export const dynamic = "force-dynamic";

function toYMD(sec: number) {
  const d = new Date(sec * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") || "SPY").toUpperCase();
  const range = url.searchParams.get("range") || "1y";
  const interval = url.searchParams.get("interval") || "1d";

  const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

  // Yahoo v8 endpoint works, but often needs a browser User-Agent header. [1](https://dev.to/avabuildsdata/how-to-get-historical-stock-data-from-yahoo-finance-without-paying-for-an-api-key-5ein)[3](https://softhints.com/how-to-fix-yahoo-finance-api-429-too-many-requests-error/)
  const res = await fetch(yfUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
      Referer: "https://finance.yahoo.com/",
    },
  });

  if (!res.ok) {
    return Response.json(
      { error: `Benchmark fetch failed (${res.status})` },
      { status: 500 }
    );
  }

  const json = await res.json();
  const result = json?.chart?.result?.[0];

  const timestamps: number[] = result?.timestamp || [];
  const closes: (number | null)[] =
    result?.indicators?.adjclose?.[0]?.adjclose ||
    result?.indicators?.quote?.[0]?.close ||
    [];

  const out: { date: string; close: number }[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const c = closes[i];
    if (c == null || !Number.isFinite(c)) continue;
    out.push({ date: toYMD(timestamps[i]), close: c });
  }

  // Light caching (client caches; handler still runs dynamically).[4](https://nextjs.org/docs/app/getting-started/route-handlers)
  return new Response(JSON.stringify({ symbol, points: out }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=0, s-maxage=3600", // 1 hour server cache where supported
    },
  });
}