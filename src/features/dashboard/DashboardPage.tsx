import { Link } from "react-router-dom";
import {
  Bell,
  Users,
  ShoppingCart,
  Package,
  Activity,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import { useGetUnreadCountQuery } from "@/api/notifications.api";
import { useGetQueueQuery } from "@/api/queue.api";
import { useGetPurchaseRequestsQuery } from "@/api/purchasing.api";
import { useGetRefillRequestsQuery } from "@/api/refills.api";
import {
  useCurrentUser,
  useHasAny,
  usePermission,
} from "@/hooks/usePermission";
import { useDepartmentSelector } from "@/components/shared/DepartmentSelector";
import { PERMISSIONS } from "@/lib/permissions";
import AppPageHeader from "@/components/shared/AppPageHeader";
import { Skeleton } from "@/components/primitive/skeleton";
import { formatDateTime } from "@/lib/formatters";
import { useTranslation } from "react-i18next";
function KpiCard({
  title,
  value,
  icon: Icon,
  href,
  color = "text-primary",
}: {
  title: string;
  value: number | undefined;
  icon: typeof Bell;
  href: string;
  color?: string;
}) {
  const { t } = useTranslation("dashboard");

  return (
    <Link to={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {title}
              </p>
              {value === undefined ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
              )}
            </div>
            <div className="bg-muted rounded-2xl p-3">
              <Icon className={`size-6 ${color}`} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
            <span>{t("viewDetails")}</span>
            <ArrowRight className="size-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const currentUser = useCurrentUser();
  const { t } = useTranslation("dashboard");
  const canManageQueue = usePermission(PERMISSIONS.MANAGE_DEPARTMENT_QUEUE);
  const canViewPurchasing = usePermission(PERMISSIONS.VIEW_PURCHASING_HISTORY);
  const canViewRefills = useHasAny([
    PERMISSIONS.CREATE_DEPARTMENT_REFILL_REQUEST,
    PERMISSIONS.APPROVE_DEPARTMENT_REFILL_REQUEST_MANAGER,
  ]);

  const { data: unreadData } = useGetUnreadCountQuery();
  const { resolved: queueDept, noAccess: queueNoAccess } =
    useDepartmentSelector("queue");
  const { data: queueData } = useGetQueueQuery(
    { status: "waiting", limit: 5, departmentId: queueDept?.id },
    { skip: !canManageQueue || !queueDept },
  );
  const { data: prData } = useGetPurchaseRequestsQuery(
    { status: "pending_hospital_approval", limit: 1 },
    { skip: !canViewPurchasing },
  );
  const { data: refillData } = useGetRefillRequestsQuery(
    { status: "pending_hospital_approval", limit: 1 },
    { skip: !canViewRefills },
  );

  const quickLinks = [
    { label: t("links.patients"), path: "/patients", icon: Users, show: true },
    {
      label: t("links.queueBoard"),
      path: "/queue",
      icon: Activity,
      show: canManageQueue,
    },
    {
      label: t("links.liveStock"),
      path: "/inventory/live-stock",
      icon: Package,
      show: true,
    },
    {
      label: t("links.purchaseRequests"),
      path: "/purchasing/requests",
      icon: ShoppingCart,
      show: canViewPurchasing,
    },
  ].filter((l) => l.show);

  return (
    <div>
      <AppPageHeader
        title={t("welcome", { name: currentUser?.fullName ?? "..." })}
        subtitle={`${currentUser?.department?.name ?? ""} — ${formatDateTime(new Date().toISOString())}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title={t("kpi.unreadNotifications")}
          value={unreadData?.data?.count}
          icon={Bell}
          href="/notifications"
          color="text-primary"
        />
        {canManageQueue && !queueNoAccess && (
          <KpiCard
            title={t("kpi.patientsWaiting")}
            value={queueData?.data?.total}
            icon={Users}
            href="/queue"
            color="text-warning"
          />
        )}
        {canViewPurchasing && (
          <KpiCard
            title={t("kpi.pendingPurchaseApprovals")}
            value={prData?.data?.total}
            icon={ShoppingCart}
            href="/purchasing/requests"
            color="text-info"
          />
        )}
        {canViewRefills && (
          <KpiCard
            title={t("kpi.pendingRefillApprovals")}
            value={refillData?.data?.total}
            icon={Package}
            href="/refills/requests"
            color="text-success"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent queue — only if can manage */}
        {canManageQueue && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                {t("queue.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queueNoAccess && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("queue.noAccess", {
                    defaultValue:
                      "Not assigned to an eligible department for the queue.",
                  })}
                </p>
              )}
              {!queueNoAccess && queueData?.data?.items?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("queue.empty")}
                </p>
              )}
              {queueData?.data?.items?.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {entry.patient?.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.department?.name}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(entry.addedAt)}
                  </p>
                </div>
              ))}
              {!queueData && (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick links */}
        <Card>
          <CardHeader>
            <CardTitle>{t("quickLinks")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {quickLinks.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-2 rounded-xl border border-border p-3 hover:bg-muted transition-colors text-sm"
              >
                <Icon className="size-4 text-primary" />
                {label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
