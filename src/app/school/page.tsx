import { setValuationContext } from "@/lib/graham";
import { fetchFearGreed } from "@/lib/api/feargreed";
import { fgLabel, fgBuffettAdvice } from "@/lib/graham";
import SchoolClient from "./SchoolClient";

export const revalidate = 3600;
const SET_PE = 15.4;

export default async function SchoolPage() {
  const fearGreed = await fetchFearGreed();
  const todaySignal = `${fgLabel(fearGreed.label).toUpperCase()} at ${fearGreed.score}/100 — ${fgBuffettAdvice(fearGreed.label)}`;
  const todayContext = setValuationContext(SET_PE);

  return (
    <div className="page page-enter">
      <SchoolClient todaySignal={todaySignal} todayContext={todayContext} />
    </div>
  );
}
