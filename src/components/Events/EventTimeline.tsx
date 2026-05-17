"use client";

import type { WorldEvent } from "@/lib/types";
import { fmtDate, fmtPct, pctColor } from "@/lib/format";

const COUNTRY_FLAGS: Record<string, string> = {
  TH: "🇹🇭", US: "🇺🇸", CN: "🇨🇳", JP: "🇯🇵",
  SG: "🇸🇬", MY: "🇲🇾", ID: "🇮🇩", VN: "🇻🇳",
  KH: "🇰🇭", MM: "🇲🇲", PH: "🇵🇭", IN: "🇮🇳",
  GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷", KR: "🇰🇷",
  AU: "🇦🇺", HK: "🇭🇰", TW: "🇹🇼", RU: "🇷🇺",
};

function sentimentToColor(tone: number): string {
  if (tone > 0.2) return "var(--bull)";
  if (tone < -0.2) return "var(--bear)";
  return "var(--caution)";
}

interface Props {
  events: WorldEvent[];
}

export function EventTimeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px 16px", color: "var(--muted)" }}>
        <div className="t-body">No events loaded</div>
        <div className="t-micro" style={{ marginTop: 8 }}>Check network or try again</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      {events.map((event) => {
        const sentColor = sentimentToColor(event.sentiment);
        const flag = COUNTRY_FLAGS[event.country] ?? "🌐";
        const hasSET = event.setChangePct != null;
        const hasSPX = event.spxChangePct != null;

        return (
          <div
            key={event.id}
            className="card"
            style={{
              borderLeft: `3px solid ${sentColor}`,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: "1rem" }}>{flag}</span>
                <span className="t-micro">{event.countryName}</span>
              </div>
              <span className="t-micro">{fmtDate(event.date)}</span>
            </div>

            <div className="t-body" style={{ fontWeight: 600, lineHeight: 1.4, marginBottom: 10 }}>
              {event.headline}
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {hasSET && (
                <div>
                  <div className="t-micro">SET THAT DAY</div>
                  <div
                    className="t-mono"
                    style={{ color: pctColor(event.setChangePct!), marginTop: 2, fontSize: "0.875rem" }}
                  >
                    {fmtPct(event.setChangePct!)}
                  </div>
                </div>
              )}
              {hasSPX && (
                <div>
                  <div className="t-micro">S&P 500</div>
                  <div
                    className="t-mono"
                    style={{ color: pctColor(event.spxChangePct!), marginTop: 2, fontSize: "0.875rem" }}
                  >
                    {fmtPct(event.spxChangePct!)}
                  </div>
                </div>
              )}
              {!hasSET && !hasSPX && (
                <div className="t-micro" style={{ color: "var(--dim)" }}>
                  Market data not available for this date
                </div>
              )}
            </div>

            {event.source && (
              <div className="t-micro" style={{ marginTop: 8, color: "var(--dim)" }}>
                via {event.source}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
