import "./globals.css";
import NavBar from "./components/NavBar";
import { TradesProvider } from "./context/TradesContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <TradesProvider>
          <NavBar />
          {children}
        </TradesProvider>
      </body>
    </html>
  );
}
