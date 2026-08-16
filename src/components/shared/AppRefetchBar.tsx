import { cn } from "@/lib/formatters";

interface AppRefetchBarProps {
  active: boolean;
  className?: string;
}

export default function AppRefetchBar({
  active,
  className,
}: AppRefetchBarProps) {
  if (!active) return <div className={cn("h-0.5", className)} />;
  return (
    <div className={cn("flex items-center gap-2 h-0.5 relative", className)}>
      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden rounded-full bg-primary/10">
        <div className="h-full w-1/3 bg-primary animate-[refetch-bar_1.1s_ease-in-out_infinite] rounded-full" />
      </div>
    </div>
  );
}
