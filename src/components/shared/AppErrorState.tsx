import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/primitive/button";
import { useTranslation } from "react-i18next";

interface AppErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export default function AppErrorState({
  title,
  description,
  onRetry,
  className,
}: AppErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground ${className ?? ""}`}
    >
      <div className="rounded-2xl bg-danger/10 p-4">
        <AlertTriangle className="size-8 text-danger" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {title ?? t("error.title", { defaultValue: "Something went wrong" })}
        </p>
        <p className="text-xs mt-1">
          {description ??
            t("error.description", {
              defaultValue: "We couldn't load this data. Please try again.",
            })}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("actions.retry", { defaultValue: "Retry" })}
        </Button>
      )}
    </div>
  );
}
