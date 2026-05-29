"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  type Lang,
  type GeoKey,
  type StyleKey,
  type Allocation6,
  type SafetyMargin,
  GEOS,
  INVEST,
  DEFAULT_ALLOC_6,
  JOB_STABILITY,
  MED_INFLATION,
  pureSavings,
  investAccum,
  fmtC,
  calculateScenarios,
  safetyMargin as calcSafetyMargin,
} from "./plan-data";

export interface NeedState {
  active: boolean;
  monthly: number;
}

export function usePlanState() {
  const [step, setStep] = useState(0);
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
  const [jobStability, setJobStability] = useState(3);
  const [alloc, setAlloc] = useState<Allocation6>(DEFAULT_ALLOC_6);
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
    setJobStability(3);
    setAlloc(DEFAULT_ALLOC_6);
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
  const stabilityFactor = JOB_STABILITY[jobStability - 1]?.factor ?? 0.88;

  // Earnings projection over working life
  const earningsRaw = useMemo(() => {
    let total = 0, m = salary;
    for (let y = 0; y < yearsToRetire; y++) {
      total += m * 12;
      m *= 1 + salaryGrowth;
    }
    return total;
  }, [salary, salaryGrowth, yearsToRetire]);

  const earningsReal = useMemo(() => {
    let total = 0, m = salary;
    const infl = MED_INFLATION[geo];
    for (let y = 0; y < yearsToRetire; y++) {
      total += (m * 12) / Math.pow(1 + infl, y);
      m *= 1 + salaryGrowth;
    }
    return total;
  }, [salary, salaryGrowth, yearsToRetire, geo]);

  const earningsStable = useMemo(() => {
    return Math.round(earningsRaw * stabilityFactor);
  }, [earningsRaw, stabilityFactor]);

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

  // 6-bucket scenario engine
  const scenarios = useMemo(() => {
    if (investable <= 0 || yearsToRetire <= 0) {
      return {
        worst: { label: "WORST CASE", color: "var(--bear)", series: [], finalValue: 0, crossoverYear: null },
        base: { label: "BASE CASE", color: "var(--caution)", series: [], finalValue: 0, crossoverYear: null },
        best: { label: "GROWTH WORLD", color: "var(--bull)", series: [], finalValue: 0, crossoverYear: null },
      };
    }
    const s = calculateScenarios(investable, salaryGrowth, alloc, yearsToRetire);
    // Calculate crossover years against retirement target
    const findCrossover = (series: { value: number }[]) => {
      for (let i = 0; i < series.length; i++) {
        if (series[i].value >= retirementTarget) return i;
      }
      return null;
    };
    s.worst.crossoverYear = findCrossover(s.worst.series);
    s.base.crossoverYear = findCrossover(s.base.series);
    s.best.crossoverYear = findCrossover(s.best.series);
    return s;
  }, [investable, salaryGrowth, alloc, yearsToRetire, retirementTarget]);

  const safety = useMemo<SafetyMargin>(() => {
    return calcSafetyMargin(scenarios.base.finalValue, retirementTarget);
  }, [scenarios.base.finalValue, retirementTarget]);

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
    setJobStability(3);
    setAlloc(DEFAULT_ALLOC_6);
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
    jobStability,
    setJobStability,
    alloc,
    setAlloc,
    // derived
    yearsToRetire,
    yearsPostRetire,
    totalExpenses,
    investable,
    stabilityFactor,
    earningsRaw,
    earningsReal,
    earningsStable,
    activeNeedsMonthly,
    retirementTarget,
    savingsTotal,
    projectedFinal,
    readiness,
    deficit,
    scenarios,
    safety,
    geoConfig: g,
    // ui
    step,
    setStep,
    // actions
    restart,
  };
}
