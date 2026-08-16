import { useState } from "react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable from "@/components/shared/AppDataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
import { useGetDeliveriesQuery } from "@/api/refills.api";
import { formatDateTime } from "@/lib/formatters";
import type { Delivery } from "@/lib/apiTypes";
import type { ColumnDef } from "@/components/shared/AppDataTable";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";
import AppErrorState from "@/components/shared/AppErrorState";
const STATUSES = ["all", "pending", "confirmed"];

export default function DeliveriesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("refills");
  const canPrepare = usePermission(PERMISSIONS.PREPARE_DEPARTMENT_REFILL);
  const canConfirm = usePermission(PERMISSIONS.CONFIRM_DEPARTMENT_DELIVERY);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const { data, isLoading, isFetching, isError, refetch } =
    useGetDeliveriesQuery({
      page,
      limit: 20,
      ...(status !== "all" ? { status } : {}),
    });

  const columns: ColumnDef<Delivery>[] = [
    {
      key: "id",
      header: t("deliveries.deliveryId"),
      cell: (r) => (
        <span className="font-mono text-xs">{r.id.slice(0, 8)}</span>
      ),
    },
    {
      key: "refillRequestId",
      header: t("deliveries.refillRequest"),
      cell: (r) => (
        <span className="font-mono text-xs">
          {r.refillRequestId.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "deliveredBy",
      header: t("deliveries.deliveredBy"),
      cell: (r) => r.deliveredById,
    },
    {
      key: "date",
      header: t("deliveries.date"),
      cell: (r) => formatDateTime(r.deliveredAt),
    },
    {
      key: "status",
      header: t("deliveries.status"),
      cell: (r) => (
        <StatusBadge
          status={r.confirmedAt ? "confirmed" : "pending"}
          domain="delivery"
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <AppPageHeader
        title={t("deliveries.title")}
        subtitle={
          canConfirm && !canPrepare
            ? t("deliveries.scopedToYourDepartment")
            : undefined
        }
        actions={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s === "all"
                    ? t("common:filters.all")
                    : t(`status:delivery.${s}`, { defaultValue: s })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      {isError && !isLoading ? (
        <AppErrorState onRetry={() => refetch()} />
      ) : (
        <AppDataTable
          data={data?.data}
          columns={columns}
          isLoading={isLoading}
          isFetching={isFetching}
          rowKey={(r) => r.id}
          onPageChange={setPage}
          onRowClick={(r) => navigate(`/refills/deliveries/${r.id}`)}
        />
      )}
    </div>
  );
}
