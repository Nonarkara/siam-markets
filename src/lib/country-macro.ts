/**
 * Country macro reference — latest annualized prints for the
 * world-map tooltip. Static snapshot; refresh after each quarter.
 * Sources: IMF WEO + national statistical offices (rounded).
 */

export interface CountryMacro {
  gdp: number;             // real GDP growth YoY, %
  cpi: number;             // headline CPI YoY, %
  unemployment: number;    // %
  rating: string;          // S&P sovereign rating
  policyRate: number;      // current central bank policy rate, %
  flag: string;
}

export const COUNTRY_MACRO: Record<string, CountryMacro> = {
  "US":        { gdp:  2.5, cpi: 2.4, unemployment: 4.2, rating: "AA+",  policyRate: 4.50, flag: "🇺🇸" },
  "UK":        { gdp:  1.4, cpi: 2.6, unemployment: 4.5, rating: "AA",   policyRate: 4.00, flag: "🇬🇧" },
  "Germany":   { gdp:  0.4, cpi: 2.2, unemployment: 6.3, rating: "AAA",  policyRate: 2.40, flag: "🇩🇪" },
  "Japan":     { gdp:  0.9, cpi: 2.8, unemployment: 2.5, rating: "A+",   policyRate: 0.50, flag: "🇯🇵" },
  "China":     { gdp:  5.0, cpi: 0.1, unemployment: 5.2, rating: "A+",   policyRate: 3.10, flag: "🇨🇳" },
  "HK":        { gdp:  2.5, cpi: 1.8, unemployment: 3.0, rating: "AA+",  policyRate: 4.50, flag: "🇭🇰" },
  "India":     { gdp:  7.0, cpi: 5.1, unemployment: 7.8, rating: "BBB-", policyRate: 6.00, flag: "🇮🇳" },
  "Thailand":  { gdp:  2.7, cpi: 0.9, unemployment: 1.0, rating: "BBB+", policyRate: 2.00, flag: "🇹🇭" },
  "Singapore": { gdp:  3.5, cpi: 1.1, unemployment: 2.0, rating: "AAA",  policyRate: 3.30, flag: "🇸🇬" },
  "Taiwan":    { gdp:  4.5, cpi: 2.0, unemployment: 3.4, rating: "AA+",  policyRate: 2.00, flag: "🇹🇼" },
  "Indonesia": { gdp:  5.0, cpi: 2.3, unemployment: 5.1, rating: "BBB",  policyRate: 6.25, flag: "🇮🇩" },
  "Malaysia":  { gdp:  4.5, cpi: 1.6, unemployment: 3.3, rating: "A-",   policyRate: 3.00, flag: "🇲🇾" },
  "Australia": { gdp:  1.8, cpi: 2.9, unemployment: 4.0, rating: "AAA",  policyRate: 3.85, flag: "🇦🇺" },
  "Brazil":    { gdp:  2.1, cpi: 5.2, unemployment: 7.1, rating: "BB",   policyRate:14.75, flag: "🇧🇷" },
  "Russia":    { gdp:  3.6, cpi: 9.5, unemployment: 2.5, rating: "—",    policyRate:21.00, flag: "🇷🇺" },
  "UAE":       { gdp:  4.3, cpi: 2.1, unemployment: 2.8, rating: "AA",   policyRate: 4.50, flag: "🇦🇪" },
  "Saudi":     { gdp:  3.5, cpi: 1.6, unemployment: 5.0, rating: "A+",   policyRate: 4.50, flag: "🇸🇦" },
  "EU":        { gdp:  0.8, cpi: 2.4, unemployment: 6.2, rating: "AAA",  policyRate: 2.40, flag: "🇪🇺" },
};
