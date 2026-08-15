import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ShoppingCart,
  Warehouse,
  Pill,
  Settings,
  Repeat,
  Package,
} from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import { Button } from "@/components/primitive/button";
import { Badge } from "@/components/primitive/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/primitive/tabs";
import { Skeleton } from "@/components/primitive/skeleton";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllReadMutation,
} from "@/api/notifications.api";
import { formatDateTime } from "@/lib/formatters";
import { useTranslation } from "react-i18next";
const CATEGORIES = [
  "all",
  "inventory",
  "pharmacy",
  "purchasing",
  "queue",
  "ai_insight",
] as const;
type Cat = (typeof CATEGORIES)[number];

const categoryIcon: Record<string, typeof Bell> = {
  inventory: Warehouse,
  pharmacy: Pill,
  purchasing: ShoppingCart,
  queue: Repeat,
  ai_insight: Settings,
  batch_expiration_alert: Package,
};

export default function NotificationsPage() {
  const { t } = useTranslation("notifications");
  const navigate = useNavigate();
  const [category, setCategory] = useState<Cat>("all");
  const { data, isLoading } = useGetNotificationsQuery(
    category === "all" ? {} : { category },
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll] = useMarkAllReadMutation();

  const items = data?.data?.items ?? [];

  function handleNotificationClick(n: {
    id: string;
    isRead: boolean;
    type: string;
    data?: Record<string, unknown>;
  }) {
    if (!n.isRead) markRead(n.id);
    // Deep-link routing
    if (n.type === "batch_expiration_alert" && n.data?.batchId) {
      navigate("/inventory/batches");
    }
  }

  return (
    <div className="p-6">
      <AppPageHeader
        title={t("title")}
        actions={
          <Button variant="outline" size="sm" onClick={() => markAll()}>
            {t("markAllRead")}
          </Button>
        }
      />

      <Tabs value={category} onValueChange={(v) => setCategory(v as Cat)}>
        <TabsList className="mb-4">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c} className="capitalize">
              {t(`categories.${c}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((c) => (
          <TabsContent key={c} value={c}>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No notifications
              </p>
            ) : (
              <div className="space-y-1">
                {items.map((n) => {
                  const Icon =
                    categoryIcon[n.type] ?? categoryIcon[n.category] ?? Bell;
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${!n.isRead ? "bg-primary/5 border-primary/20" : "border-border"}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <Icon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{n.title}</p>
                          {!n.isRead && (
                            <Badge className="text-xs py-0">{t("new")}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
