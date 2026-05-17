// Number and currency formatting utilities

export function fmtThb(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000_000) return `฿${(value / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(value) >= 1_000_000)     return `฿${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000)         return `฿${(value / 1_000).toFixed(0)}K`;
  }
  return `฿${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function fmtPct(value: number, sign = true): string {
  const formatted = Math.abs(value).toFixed(2);
  if (sign && value > 0) return `+${formatted}%`;
  if (value < 0) return `-${formatted}%`;
  return `${formatted}%`;
}

export function fmtNum(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000)     return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000)         return `${(value / 1_000).toFixed(0)}K`;
  return value.toFixed(2);
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 2)    return "just now";
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days === 1)  return "yesterday";
  return `${days}d ago`;
}

export function pctColor(value: number): string {
  if (value > 0) return "var(--bull)";
  if (value < 0) return "var(--bear)";
  return "var(--muted)";
}

export function pctClass(value: number): string {
  if (value > 0) return "bull";
  if (value < 0) return "bear";
  return "muted";
}

// Clamp a value to a range
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
