import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/Nav/BottomNav";
import { TopNav } from "@/components/Nav/TopNav";

export const metadata: Metadata = {
  title: "SIAM MARKETS — Trading Intelligence",
  description: "Thai market intelligence with day trading education, technical analysis, paper trading simulator, and Graham/Buffett/Munger value frameworks.",
  keywords: ["Thailand", "SET", "stock market", "day trading", "technical analysis", "investing", "paper trading", "Graham", "Buffett"],
  openGraph: {
    title: "SIAM MARKETS — Trading Intelligence",
    description: "Day trading education + value investing for Thailand",
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
        {/* Desktop nav — hidden on mobile via CSS */}
        <div className="lg-only">
          <TopNav />
        </div>

        <main id="main-content">
          {children}
        </main>

        {/* Mobile bottom nav — hidden on desktop via CSS */}
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
