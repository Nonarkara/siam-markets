import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/Nav/BottomNav";
import { TopNav } from "@/components/Nav/TopNav";
import { SetupGate } from "@/components/KPI/SetupGate";
import { LangProvider } from "@/lib/i18n/useLang";

export const metadata: Metadata = {
  title: "SIAM MARKETS",
  description: "Thai market intelligence — personalized KPIs, Bloomberg-style signals, Graham/Buffett/Munger frameworks. ดัชนีการลงทุนไทย.",
  keywords: ["Thailand", "SET", "stock market", "investing", "mutual funds", "RMF", "Thai ESG", "กองทุน", "หุ้น"],
  openGraph: {
    title: "SIAM MARKETS",
    description: "Market intelligence that knows what you want · ตลาดการลงทุนที่รู้ใจคุณ",
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
        <LangProvider>
          <SetupGate />

          <div className="lg-only">
            <TopNav />
          </div>

          <main id="main-content">
            {children}
          </main>

          <div className="mobile-only">
            <BottomNav />
          </div>
        </LangProvider>

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
