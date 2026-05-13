import dynamic from "next/dynamic";

export const dynamic = "force-dynamic";

const TradesClient = dynamic(
  () => import("./TradesClient"),
  { ssr: false }
);

export default function TradesPage() {
  return <TradesClient />;
}
