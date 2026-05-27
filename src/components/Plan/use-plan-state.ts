"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  type Lang,
  type GeoKey,
  type StyleKey,
  GEOS,
  INVEST,
  pureSavings,
  investAccum,
  fmtC,
} from "./plan-data";

export interface NeedState {
  active: boolean;
  monthly: number;
}

export function usePlanState() {
  const [lang, setLang] = useState<Lang>("en");
  const [geo, setGeo] = useState<GeoKey>("th");
  const [age, setAge] = useState(30);
  const [retireAge, setRetireAge] = useState(GEOS.th.retireAge);
  const [salaryGrowth, setSalaryGrowth] = useState(0.03);
  const [salary, setSalary] = useState(GEOS.th.defaultSalary);
  const [living, setLiving] = useState(GEOS.th.defaultLiving);
  const [transport, setTransport] = useState(GEOS.th.defaultTransport);
  const [other, setOther] = useState(GEOS.th.defaultOther);
  const [investStyle, setInvestStyle] = useState<StyleKey | null>(null);
  const [needs, setNeeds] = useState<Record<number, NeedState>>({
    1: { active: false, monthly: GEOS.th.defaultNeeds[0] },
    2: { active: false, monthly: GEOS.th.defaultNeeds[1] },
    3: { active: false, monthly: GEOS.th.defaultNeeds[2] },
    4: { active: false, monthly: GEOS.th.defaultNeeds[3] },
    5: { active: false, monthly: GEOS.th.defaultNeeds[4] },
  });

  // Reset defaults when geo changes
  const prevGeo = useRef<GeoKey>(geo);
  useEffect(() => {
    if (prevGeo.current === geo) return;
    prevGeo.current = geo;
    const g = GEOS[geo];
    setSalary(g.defaultSalary);
    setLiving(g.defaultLiving);
    setTransport(g.defaultTransport);
    setOther(g.defaultOther);
    setRetireAge(g.retireAge);
    setSalaryGrowth(0.03);
    setInvestStyle(null);
    setNeeds({
      1: { active: false, monthly: g.defaultNeeds[0] },
      2: { active: false, monthly: g.defaultNeeds[1] },
      3: { active: false, monthly: g.defaultNeeds[2] },
      4: { active: false, monthly: g.defaultNeeds[3] },
      5: { active: false, monthly: g.defaultNeeds[4] },
    });
  }, [geo]);

  // Derived
  const g = GEOS[geo];
  const yearsToRetire = Math.max(1, retireAge - age);
  const yearsPostRetire = Math.max(5, g.lifeExp - retireAge);
  const totalExpenses = living + transport + other;
  const investable = Math.max(0, salary - totalExpenses);

  const activeNeedsMonthly = useMemo(
    () => Object.values(needs).filter((n) => n.active).reduce((s, n) => s + n.monthly, 0),
    [needs]
  );

  const retirementTarget = useMemo(() => {
    if (activeNeedsMonthly > 0) {
      return activeNeedsMonthly * 12 * yearsPostRetire;
    }
    return g.retireRef;
  }, [activeNeedsMonthly, yearsPostRetire, g.retireRef]);

  const savingsTotal = useMemo(
    () => pureSavings(investable, salaryGrowth, yearsToRetire),
    [investable, salaryGrowth, yearsToRetire]
  );

  const projectedFinal = useMemo(() => {
    const style = INVEST.find((s) => s.key === investStyle);
    return style ? investAccum(investable, salaryGrowth, style.ret, yearsToRetire) : 0;
  }, [investable, salaryGrowth, investStyle, yearsToRetire]);

  const readiness = useMemo(() => {
    if (retirementTarget <= 0) return 0;
    return Math.min(200, Math.round((projectedFinal / retirementTarget) * 100));
  }, [projectedFinal, retirementTarget]);

  const deficit = retirementTarget - savingsTotal;

  function restart() {
    const gg = GEOS[geo];
    setAge(30);
    setSalary(gg.defaultSalary);
    setLiving(gg.defaultLiving);
    setTransport(gg.defaultTransport);
    setOther(gg.defaultOther);
    setRetireAge(gg.retireAge);
    setSalaryGrowth(0.03);
    setInvestStyle(null);
    setNeeds({
      1: { active: false, monthly: gg.defaultNeeds[0] },
      2: { active: false, monthly: gg.defaultNeeds[1] },
      3: { active: false, monthly: gg.defaultNeeds[2] },
      4: { active: false, monthly: gg.defaultNeeds[3] },
      5: { active: false, monthly: gg.defaultNeeds[4] },
    });
  }

  return {
    // state
    lang,
    setLang,
    geo,
    setGeo,
    age,
    setAge,
    retireAge,
    setRetireAge,
    salary,
    setSalary,
    salaryGrowth,
    setSalaryGrowth,
    living,
    setLiving,
    transport,
    setTransport,
    other,
    setOther,
    needs,
    setNeeds,
    investStyle,
    setInvestStyle,
    // derived
    yearsToRetire,
    yearsPostRetire,
    totalExpenses,
    investable,
    activeNeedsMonthly,
    retirementTarget,
    savingsTotal,
    projectedFinal,
    readiness,
    deficit,
    geoConfig: g,
    // actions
    restart,
  };
}
