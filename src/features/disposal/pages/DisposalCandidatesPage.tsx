import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Trash2, Building2, Loader2, ListOrdered } from "lucide-react";

import {
  useGetDisposalCandidatesQuery,
  useInitiateDisposalTransferMutation,
} from "@/api/disposal.api";
import { useGetSelectableDepartmentsQuery } from "@/api/departments.api";

import AppPageHeader from "@/components/shared/AppPageHeader";
import AppEmptyState from "@/components/shared/AppEmptyState";
import AppErrorState from "@/components/shared/AppErrorState";
import AppPermissionGate from "@/components/shared/AppPermissionGate";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/primitive/card";
import { Badge } from "@/components/primitive/badge";
import { Button } from "@/components/primitive/button";
import { Skeleton } from "@/components/primitive/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/primitive/select";

import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/formatters";
const SOURCE_FILTERS = ["all", "damaged", "expired", "nearExpiry"] as const;
type SourceFilter = (typeof SOURCE_FILTERS)[number];

interface AggregatedCandidateRow {
  key: string;
  source: "damaged" | "expired" | "nearExpiry";
  departmentId: string;
  departmentName: string;
  variantName: string;
  sku?: string;
  batchNumber?: string;
  quantity: number;
  expirationDate?: string;
  daysRemaining?: number;
}

function DepartmentCandidatesBlock({
  departmentId,
  departmentName,
  sourceFilter,
  onInitiate,
  initiating,
}: {
  departmentId: string;
  departmentName: string;
  sourceFilter: SourceFilter;
  onInitiate: (departmentId: string) => void;
  initiating: boolean;
}) {
  const { t } = useTranslation("disposal");
  const { data, isLoading, isFetching, isError, refetch } =
    useGetDisposalCandidatesQuery(departmentId);
  const candidates = data?.data;

  const rows: AggregatedCandidateRow[] = [];
  if (candidates) {
    if (sourceFilter === "all" || sourceFilter === "damaged") {
      candidates.damaged.forEach((c) =>
        rows.push({
          key: `dmg-${c.id}`,
          source: "damaged",
          departmentId,
          departmentName,
          variantName: c.variant?.variantName ?? "—",
          sku: c.variant?.sku,
          batchNumber: c.batch?.batchNumber,
          quantity: c.quantity,
          expirationDate: c.batch?.expirationDate,
        }),
      );
    }
    if (sourceFilter === "all" || sourceFilter === "expired") {
      candidates.expired.forEach((c) =>
        rows.push({
          key: `exp-${c.id}`,
          source: "expired",
          departmentId,
          departmentName,
          variantName: c.variant?.variantName ?? "—",
          sku: c.variant?.sku,
          batchNumber: c.batch?.batchNumber,
          quantity: c.quantity,
          expirationDate: c.batch?.expirationDate,
        }),
      );
    }
    if (sourceFilter === "all" || sourceFilter === "nearExpiry") {
      candidates.nearExpiry.forEach((c) =>
        rows.push({
          key: `nex-${c.batchId}`,
          source: "nearExpiry",
          departmentId,
          departmentName,
          variantName: c.variantName,
          sku: c.sku,
          batchNumber: c.batchNumber,
          quantity: c.quantity,
          expirationDate: c.expirationDate,
          daysRemaining: c.daysRemaining,
        }),
      );
    }
  }

  const total = rows.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-4">
          <AppErrorState onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  if (total === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-primary" />
          <CardTitle className="text-base">{departmentName}</CardTitle>
          <Badge variant="neutral">
            {t("candidates.itemCount", { count: total })}
          </Badge>
          {isFetching && (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          )}
        </div>
        <AppPermissionGate permission={PERMISSIONS.MANAGE_DISPOSAL_TRANSFERS}>
          <Button
            size="sm"
            onClick={() => onInitiate(departmentId)}
            loading={initiating}
          >
            <Trash2 className="size-4" />
            {t("transfers.initiate")}
          </Button>
        </AppPermissionGate>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-start font-medium">
                  {t("candidates.source")}
                </th>
                <th className="px-4 py-2 text-start font-medium">
                  {t("candidates.material")}
                </th>
                <th className="px-4 py-2 text-start font-medium">
                  {t("candidates.batch")}
                </th>
                <th className="px-4 py-2 text-start font-medium">
                  {t("candidates.quantity")}
                </th>
                <th className="px-4 py-2 text-start font-medium">
                  {t("candidates.expiration")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-border">
                  <td className="px-4 py-2">
                    <Badge
                      variant={
                        r.source === "damaged"
                          ? "danger"
                          : r.source === "expired"
                            ? "warning"
                            : "info"
                      }
                    >
                      {t(`transfers.source.${r.source}`, {
                        defaultValue: r.source,
                      })}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <p className="font-medium">{r.variantName}</p>
                    {r.sku && (
                      <p className="text-xs text-muted-foreground">{r.sku}</p>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <code className="text-xs bg-muted px-1 rounded">
                      {r.batchNumber ?? "—"}
                    </code>
                  </td>
                  <td className="px-4 py-2 font-mono">{r.quantity}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {formatDate(r.expirationDate)}
                      {r.source === "nearExpiry" && r.daysRemaining != null && (
                        <Badge variant="warning">
                          {t("candidates.daysRemaining", {
                            count: r.daysRemaining,
                          })}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DisposalCandidatesPage() {
  const { t } = useTranslation("disposal");
  const navigate = useNavigate();
  const canManage = usePermission(PERMISSIONS.MANAGE_DISPOSAL_TRANSFERS);

  const [deptFilter, setDeptFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  const { data: selectableData, isLoading: deptsLoading } =
    useGetSelectableDepartmentsQuery("disposal");
  const allDepartments = selectableData?.data?.departments ?? [];
  const scoped = selectableData?.data?.scoped ?? false;

  const departmentsToShow = deptFilter
    ? allDepartments.filter((d) => d.id === deptFilter)
    : allDepartments;

  const [initiateTransfer, { isLoading: initiating }] =
    useInitiateDisposalTransferMutation();
  const [initiatingDeptId, setInitiatingDeptId] = useState<string | null>(null);
  const [initiateError, setInitiateError] = useState<string | null>(null);

  async function handleInitiate(departmentId: string) {
    setInitiateError(null);
    setInitiatingDeptId(departmentId);
    try {
      const res = await initiateTransfer({ departmentId }).unwrap();
      navigate(`/disposal/transfers/${res.data.id}`);
    } catch (e: unknown) {
      setInitiateError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    } finally {
      setInitiatingDeptId(null);
    }
  }

  if (deptsLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (scoped && allDepartments.length === 0) {
    return (
      <div className="p-6">
        <AppPageHeader title={t("candidates.title")} />
        <AppEmptyState title={t("noAccessTitle")} description={t("noAccess")} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <AppPageHeader
        title={t("candidates.title")}
        subtitle={t("candidates.subtitle")}
        actions={
          <Link to="/disposal/transfers">
            <Button variant="outline">
              <ListOrdered className="size-4" />
              {t("candidates.viewTransfers")}
            </Button>
          </Link>
        }
      />

      <div className="flex gap-3 flex-wrap">
        <Select
          value={deptFilter || "__all__"}
          onValueChange={(v) => setDeptFilter(v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder={t("common:filters.allDepartments")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("common:filters.all")}</SelectItem>
            {allDepartments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sourceFilter}
          onValueChange={(v) => setSourceFilter(v as SourceFilter)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all"
                  ? t("common:filters.all")
                  : t(`transfers.source.${s}`, { defaultValue: s })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {initiateError && <p className="text-sm text-danger">{initiateError}</p>}

      {departmentsToShow.length === 0 ? (
        <AppEmptyState
          title={t("candidates.emptyTitle", {
            defaultValue: "No eligible departments",
          })}
        />
      ) : (
        <div className="space-y-4">
          {departmentsToShow.map((d) => (
            <DepartmentCandidatesBlock
              key={d.id}
              departmentId={d.id}
              departmentName={d.name}
              sourceFilter={sourceFilter}
              onInitiate={handleInitiate}
              initiating={initiating && initiatingDeptId === d.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
