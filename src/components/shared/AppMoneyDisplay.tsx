import { useThemeStore } from "@/stores/theme.store";
import { formatCurrency } from "@/lib/formatters";

interface AppMoneyDisplayProps {
  amount?: number | null;
  className?: string;
}

export default function AppMoneyDisplay({ amount, className }: AppMoneyDisplayProps) {
  const currency = useThemeStore((s) => s.currency);
  return <span className={className}>{formatCurrency(amount, currency)}</span>;
}
