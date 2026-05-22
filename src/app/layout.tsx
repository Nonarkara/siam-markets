import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/Nav/BottomNav";
import { TopNav } from "@/components/Nav/TopNav";
import { LegalFooter } from "@/components/LegalFooter";
import { LangProvider } from "@/lib/i18n/useLang";
import { THEME_INIT_SCRIPT } from "@/components/Theme/ThemeToggle";

export const metadata: Metadata = {
  title: "DayTraders — Your Money, Visualized",
  description: "Financial intelligence for everyone. From first paycheck to freedom — visualize, plan, and invest with Graham, Buffett, and Kiyosaki principles.",
  keywords: ["Thailand", "SET", "stock market", "investing", "mutual funds", "RMF", "Thai ESG", "กองทุน", "หุ้น", "financial literacy", "wealth planner"],
  openGraph: {
    title: "DayTraders — Your Money, Visualized",
    description: "Financial intelligence for everyone. Plan, visualize, and invest.",
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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <LangProvider>
          <div className="lg-only">
            <TopNav />
          </div>

          <main id="main-content">
            {children}
          </main>

          <div className="mobile-only">
            <BottomNav />
          </div>

          <div className="lg-only">
            <LegalFooter />
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
