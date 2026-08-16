import { Loader2 } from "lucide-react";
import { cn } from "@/lib/formatters";

interface AppSpinnerBadgeProps {
  label?: string;
  className?: string;
}

export default function AppSpinnerBadge({
  label,
  className,
}: AppSpinnerBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="size-3.5 animate-spin" />
      {label}
    </span>
  );
}
