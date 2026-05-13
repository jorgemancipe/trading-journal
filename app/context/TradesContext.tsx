> Build error occurred
Error: Turbopack build failed with 1 errors:
./app/context/TradesContext.tsx:3:1
Expression expected
  1 |   1 | "use client";
  2 |   2 |
> 3 | > 3 | import { TradesProvider } from "../context/TradesContext";
    | ^
  4 |     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  5 |   4 |
  6 |   5 | export const dynamic = "force-dynamic";
Parsing ecmascript source code failed
Import traces:
  Server Component:
    ./app/context/TradesContext.tsx
    ./app/layout.tsx
  Client Component Browser:
    ./app/context/TradesContext.tsx [Client Component Browser]
    ./app/trades/page.tsx [Client Component Browser]
    ./app/trades/page.tsx [Server Component]
  Client Component SSR:
    ./app/context/TradesContext.tsx [Client Component SSR]
    ./app/trades/page.tsx [Client Component SSR]
    ./app/trades/page.tsx [Server Component]
    at <unknown> (./app/context/TradesContext.tsx:3:1)
Error: Command "npm run build" exited with 1
