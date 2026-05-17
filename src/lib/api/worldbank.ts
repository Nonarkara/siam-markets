/**
 * World Bank Open Data API — no authentication required
 * Thailand macro indicators
 */

const BASE = "https://api.worldbank.org/v2/country/TH/indicator";

async function fetchIndicator(indicatorCode: string): Promise<number | null> {
  try {
    const url = `${BASE}/${indicatorCode}?format=json&mrv=1&per_page=1`;
    const res = await fetch(url, { next: { revalidate: 86400 * 7 } }); // weekly
    if (!res.ok) return null;

    const json = await res.json();
    const value = json?.[1]?.[0]?.value;
    return value != null ? parseFloat(value) : null;
  } catch {
    return null;
  }
}

export interface ThaiMacro {
  gdpGrowth: number | null;         // NY.GDP.MKTP.KD.ZG
  cpiInflation: number | null;      // FP.CPI.TOTL.ZG
  currentAccount: number | null;    // BN.CAB.XOKA.CD (USD)
  fdi: number | null;               // BX.KLT.DINV.CD.WD
}

export async function fetchThaiMacro(): Promise<ThaiMacro> {
  const [gdp, cpi, ca, fdi] = await Promise.all([
    fetchIndicator("NY.GDP.MKTP.KD.ZG"),
    fetchIndicator("FP.CPI.TOTL.ZG"),
    fetchIndicator("BN.CAB.XOKA.CD"),
    fetchIndicator("BX.KLT.DINV.CD.WD"),
  ]);

  return { gdpGrowth: gdp, cpiInflation: cpi, currentAccount: ca, fdi };
}
