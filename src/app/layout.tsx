import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/Nav/BottomNav";
import { TopNav } from "@/components/Nav/TopNav";
import { SetupGate } from "@/components/KPI/SetupGate";
import { LangProvider } from "@/lib/i18n/useLang";
import { APP_VERSION } from "@/lib/version";
import { StoryButton } from "@/components/Story/StoryButton";

export const metadata: Metadata = {
  title: "DayTraders",
  description: "Thai market intelligence — personalized KPIs, Bloomberg-style signals, Graham/Buffett/Munger frameworks. ดัชนีการลงทุนไทย.",
  keywords: ["Thailand", "SET", "stock market", "investing", "mutual funds", "RMF", "Thai ESG", "กองทุน", "หุ้น"],
  openGraph: {
    title: "DayTraders",
    description: "Market intelligence that knows what you want · ตลาดการลงทุนที่รู้ใจคุณ",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050508",
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

          <div
            className="mobile-only"
            style={{
              position: "fixed",
              top: 6,
              right: 10,
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-mono)",
              fontSize: "0.55rem",
              color: "var(--dim)",
              letterSpacing: "0.08em",
            }}
          >
            <span aria-hidden style={{ pointerEvents: "none" }}>v{APP_VERSION}</span>
            <StoryButton variant="chip" />
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
