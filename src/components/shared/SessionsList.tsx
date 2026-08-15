import { useTranslation } from "react-i18next";
import { Monitor, Smartphone, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/primitive/card";
import { Badge } from "@/components/primitive/badge";
import { Button } from "@/components/primitive/button";
import { Skeleton } from "@/components/primitive/skeleton";
import AppEmptyState from "@/components/shared/AppEmptyState";
import { formatRelative } from "@/lib/formatters";
import type { SessionItem } from "@/api/sessions.api";
interface SessionsListProps {
  sessions: SessionItem[];
  isLoading?: boolean;
  onRevoke: (sessionId: string) => void;
  revokingId?: string | null;
  emptyMessage?: string;
}

function platformIcon(platform: string) {
  return platform === "mobile" ? Smartphone : Monitor;
}

function isExpiredSession(session: SessionItem): boolean {
  return new Date(session.refreshExpiresAt).getTime() < Date.now();
}

export default function SessionsList({
  sessions,
  isLoading,
  onRevoke,
  revokingId,
  emptyMessage,
}: SessionsListProps) {
  const { t } = useTranslation("sessions");

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return <AppEmptyState title={emptyMessage ?? t("empty")} />;
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const Icon = platformIcon(session.platform);
        const expired = isExpiredSession(session);
        return (
          <Card key={session.id}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="rounded-xl bg-muted p-2 shrink-0">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">
                      {session.deviceInfo ?? t("unknownDevice")}
                    </p>
                    {session.isCurrent && (
                      <Badge variant="success">{t("currentSession")}</Badge>
                    )}
                    {expired && <Badge variant="neutral">{t("expired")}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {session.platform === "mobile"
                      ? t("platformMobile")
                      : t("platformWeb")}
                    {session.ipAddress ? ` · ${session.ipAddress}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("signedIn")}: {formatRelative(session.createdAt)}
                  </p>
                </div>
              </div>
              {!session.isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-danger border-danger/30 hover:bg-danger/5 shrink-0"
                  onClick={() => onRevoke(session.id)}
                  loading={revokingId === session.id}
                >
                  <LogOut className="size-4" />
                  {t("revoke")}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
