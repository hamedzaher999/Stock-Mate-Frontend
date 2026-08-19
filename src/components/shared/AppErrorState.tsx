import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/primitive/button";
import { useTranslation } from "react-i18next";
interface AppErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  status?: number | string;
}

function isForbiddenStatus(status?: number | string): boolean {
  return status === 403 || status === "403" || status === "FORBIDDEN";
}

export default function AppErrorState({
  title,
  description,
  onRetry,
  className,
  status,
}: AppErrorStateProps) {
  const { t } = useTranslation();
  const forbidden = isForbiddenStatus(status);

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground ${className ?? ""}`}
    >
      <div className="rounded-2xl bg-danger/10 p-4">
        {forbidden ? (
          <ShieldAlert className="size-8 text-danger" />
        ) : (
          <AlertTriangle className="size-8 text-danger" />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {title ??
            (forbidden
              ? t("error.forbiddenTitle", {
                  defaultValue: "You don't have access to this",
                })
              : t("error.title", { defaultValue: "Something went wrong" }))}
        </p>
        <p className="text-xs mt-1">
          {description ??
            (forbidden
              ? t("error.forbiddenDescription", {
                  defaultValue:
                    "You don't have permission to view this. Contact an administrator if you think this is a mistake.",
                })
              : t("error.description", {
                  defaultValue: "We couldn't load this data. Please try again.",
                }))}
        </p>
      </div>
      {/* Retry is pointless on a 403 — permission won't change on refetch */}
      {onRetry && !forbidden && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("actions.retry", { defaultValue: "Retry" })}
        </Button>
      )}
    </div>
  );
}
