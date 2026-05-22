"use client";

import { Tabs } from "@/components/Tabs/Tabs";
import { TVWall } from "@/components/TV/TVWall";
import { NewsTicker } from "@/components/TV/NewsTicker";
import { TrendsPanel } from "@/components/TV/TrendsPanel";

export function NewsroomShell() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 className="t-display" style={{ fontSize: "1.25rem", lineHeight: 1.1 }}>Newsroom</h1>
            <div className="t-micro" style={{ color: "var(--muted)", marginTop: 2 }}>
              all channels on · click to make hero · trilingual news · live Thailand trends
            </div>
          </div>
          <div className="t-micro" style={{ color: "var(--dim)", letterSpacing: "0.14em" }}>
            DESIGN HERITAGE · BRAUN BROADCAST WALL
          </div>
        </div>
      </div>

      <div className="dashboard-page__body">
        <Tabs
          defaultId="wall"
          tabs={[
            {
              id: "wall",
              label: "TV WALL",
              badge: "11",
              content: (
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 12 }}>
                  <TVWall />
                </div>
              ),
            },
            {
              id: "news",
              label: "NEWS",
              badge: "EN/TH/ZH",
              content: (
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 12 }}>
                  <NewsTicker />
                </div>
              ),
            },
            {
              id: "trends",
              label: "TRENDS",
              badge: "TH",
              content: (
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 12 }}>
                  <TrendsPanel />
                </div>
              ),
            },
            {
              id: "mixed",
              label: "MIXED",
              badge: "ALL",
              content: <MixedView />,
            },
          ]}
        />
      </div>
    </div>
  );
}

function MixedView() {
  return (
    <div className="mixed-grid">
      {/* TV WALL — biggest cell */}
      <div className="mixed-tv">
        <div style={{ padding: 12, height: "100%", overflowY: "auto" }}>
          <TVWall />
        </div>
      </div>

      {/* TRENDS — right top */}
      <div className="mixed-trends">
        <div style={{ height: "100%", overflowY: "auto" }}>
          <TrendsPanel />
        </div>
      </div>

      {/* NEWS — right bottom */}
      <div className="mixed-news">
        <div style={{ padding: 8, height: "100%", overflowY: "auto" }}>
          <NewsTicker />
        </div>
      </div>

      <style>{`
        .mixed-grid {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows: minmax(0, 1fr) minmax(0, auto) minmax(0, auto);
          grid-template-areas:
            "tv"
            "trends"
            "news";
          gap: 1px;
          background: var(--line);
        }
        .mixed-tv     { grid-area: tv;     background: var(--bg); overflow: hidden; }
        .mixed-trends { grid-area: trends; background: var(--bg); overflow: hidden; }
        .mixed-news   { grid-area: news;   background: var(--bg); overflow: hidden; }

        @media (min-width: 1024px) {
          .mixed-grid {
            grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
            grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
            grid-template-areas:
              "tv  trends"
              "tv  news";
          }
        }
      `}</style>
    </div>
  );
}
