import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/primitive/skeleton";
import AppEmptyState from "@/components/shared/AppEmptyState";
import { cn } from "@/lib/formatters";
import AppErrorState from "./AppErrorState";

interface AppQueryStateProps {
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  skeletonCount?: number;
  renderSkeleton?: () => ReactNode;
  showRefetchOverlay?: boolean;
  className?: string;
  children: ReactNode;
}

export default function AppQueryState({
  isLoading,
  isFetching,
  isError,
  onRetry,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  skeletonCount = 4,
  renderSkeleton,
  showRefetchOverlay = true,
  className,
  children,
}: AppQueryStateProps) {
  // 1) First load: full skeleton, nothing else on screen yet.
  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {renderSkeleton
          ? renderSkeleton()
          : Array.from({ length: skeletonCount }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
      </div>
    );
  }

  if (isError && isEmpty !== false) {
    return <AppErrorState onRetry={onRetry} className={className} />;
  }

  if (isEmpty) {
    return (
      <AppEmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
      />
    );
  }

  // 4) Has data — render children, optionally dimmed + spinner badge while refetching.
  if (isFetching && showRefetchOverlay) {
    return (
      <div className={cn("relative", className)}>
        <div className="pointer-events-none opacity-60 transition-opacity">
          {children}
        </div>
        <div className="absolute inset-0 flex items-start justify-center pt-8">
          <div className="flex items-center gap-2 rounded-full bg-card border border-border shadow-md px-3 py-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            <span>Updating…</span>
          </div>
        </div>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}
