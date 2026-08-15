import { format, formatDistanceToNow, isAfter, addDays } from "date-fns";

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "—";
  try {
    return format(new Date(date), "dd MMM yyyy");
  } catch {
    return "—";
  }
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return "—";
  try {
    return format(new Date(date), "dd MMM yyyy, HH:mm");
  } catch {
    return "—";
  }
}

export function formatRelative(date: string | Date | undefined | null): string {
  if (!date) return "—";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "—";
  }
}

export function formatCurrency(amount: number | undefined | null, currency = "ILS"): string {
  if (amount == null) return "—";
  const symbol = currency === "ILS" ? "₪" : "$";
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(n: number | undefined | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

export function isExpiringSoon(dateStr: string | undefined | null, daysThreshold = 30): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const threshold = addDays(new Date(), daysThreshold);
  return isAfter(threshold, d) && isAfter(d, new Date());
}

export function isExpired(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  return !isAfter(new Date(dateStr), new Date());
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
