  1 | "use client";
  2 |
> 3 | import { TradesProvider } from "../context/TradesContext";
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  4 |
  5 | export const dynamic = "force-dynamic";
  6 |
The export TradesProvider was not found in module [project]/app/context/TradesContext.tsx [app-ssr] (ecmascript).
Did you mean to import useTrades?
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.
Import traces:
  Client Component Browser:
    ./app/trades/layout.tsx [Client Component Browser]
    ./app/trades/layout.tsx [Server Component]
  Client Component SSR:
    ./app/trades/layout.tsx [Client Component SSR]
    ./app/trades/layout.tsx [Server Component]
    at <unknown> (./app/dashboard/layout.tsx:3:1)
    at <unknown> (./app/dashboard/layout.tsx:3:1)
    at <unknown> (./app/layout.tsx:3:1)
    at <unknown> (./app/trades/layout.tsx:3:1)
    at <unknown> (./app/trades/layout.tsx:3:1)
Error: Command "npm run build" exited with 1
