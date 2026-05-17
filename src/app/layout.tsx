import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/Nav/BottomNav";
import { TopNav } from "@/components/Nav/TopNav";
import { SetupGate } from "@/components/KPI/SetupGate";

export const metadata: Metadata = {
  title: "SIAM MARKETS",
  description: "Thai market intelligence — personalized KPIs, Bloomberg-style signals, Graham/Buffett/Munger frameworks for SET investors.",
  keywords: ["Thailand", "SET", "stock market", "investing", "mutual funds", "RMF", "Thai ESG", "Graham", "Buffett"],
  openGraph: {
    title: "SIAM MARKETS",
    description: "Market intelligence that knows what you want",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0d0d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Setup gate — redirects to /setup on first visit */}
        <SetupGate />

        {/* Desktop nav */}
        <div className="lg-only">
          <TopNav />
        </div>

        <main id="main-content">
          {children}
        </main>

        {/* Mobile nav */}
        <div className="mobile-only">
          <BottomNav />
        </div>

        <style>{`
          .lg-only { display: none; }
          .mobile-only { display: block; }
          @media (min-width: 1024px) {
            .lg-only { display: block; }
            .mobile-only { display: none; }
          }
        `}</style>
      </body>
    </html>
  );
}
