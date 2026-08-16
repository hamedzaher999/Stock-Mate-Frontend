import { useState } from "react";
import { useGetBatchesQuery } from "@/api/inventory.api";
import { useGetDepartmentsQuery } from "@/api/departments.api";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable, { type ColumnDef } from "@/components/shared/AppDataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
import { Badge } from "@/components/primitive/badge";
import {
  formatDate,
  formatCurrency,
  isExpiringSoon,
  isExpired,
} from "@/lib/formatters";
import type { Batch } from "@/lib/apiTypes";
import { useTranslation } from "react-i18next";
import AppErrorState from "@/components/shared/AppErrorState";
export default function BatchesPage() {
  const [page, setPage] = useState(1);
  const [deptId, setDeptId] = useState("");
  const { data: deptData } = useGetDepartmentsQuery();
  const { data, isLoading, isFetching, isError, refetch } = useGetBatchesQuery({
    page,
    limit: 20,
    ...(deptId ? { departmentId: deptId } : {}),
  });
  const { t } = useTranslation("inventory");
  const columns: ColumnDef<Batch>[] = [
    {
      key: "batch",
      header: t("batches.batchNumber"),
      cell: (r) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
          {r.batchNumber}
        </code>
      ),
    },
    {
      key: "variant",
      header: t("batches.material"),
      cell: (r) => (
        <span className="text-sm font-medium">{r.variant?.variantName}</span>
      ),
    },
    {
      key: "supplier",
      header: t("batches.supplier"),
      cell: (r) => r.supplier?.name ?? "—",
    },
    {
      key: "qty",
      header: t("batches.received"),
      cell: (r) => r.quantityReceived,
    },
    {
      key: "price",
      header: t("batches.purchasePrice"),
      cell: (r) => formatCurrency(r.purchasePrice),
    },
    {
      key: "mfg",
      header: t("batches.mfgDate"),
      cell: (r) => formatDate(r.manufacturingDate),
    },
    {
      key: "exp",
      header: t("batches.expDate"),
      cell: (r) => {
        const exp = isExpired(r.expirationDate);
        const soon = !exp && isExpiringSoon(r.expirationDate);
        return (
          <div className="flex items-center gap-2">
            {formatDate(r.expirationDate)}
            {exp && <Badge variant="danger">{t("batches.expired")}</Badge>}
            {soon && (
              <Badge variant="warning">{t("batches.expiringSoon")}</Badge>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <AppPageHeader title={t("batches.title")} />
      <div className="flex gap-3 mb-4">
        <Select value={deptId} onValueChange={setDeptId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("common:filters.allDepartments")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("common:filters.all")}</SelectItem>
            {(deptData?.data?.items ?? []).map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
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
          />
        )}
      </div>
    </div>
  );
}
