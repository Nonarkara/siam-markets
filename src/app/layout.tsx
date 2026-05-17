import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/Nav/BottomNav";
import { TopNav } from "@/components/Nav/TopNav";

export const metadata: Metadata = {
  title: "SIAM MARKETS",
  description: "Thai market intelligence — Graham, Buffett, Munger frameworks applied to SET stocks and global events.",
  keywords: ["Thailand", "SET", "stock market", "investing", "mutual funds", "RMF", "Thai ESG"],
  openGraph: {
    title: "SIAM MARKETS",
    description: "Long-term market intelligence for Thailand",
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
