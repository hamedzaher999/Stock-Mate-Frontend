import { useState } from "react";
import { useGetTransactionsQuery } from "@/api/inventory.api";
import { useGetDepartmentsQuery } from "@/api/departments.api";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable, { type ColumnDef } from "@/components/shared/AppDataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { InventoryTransaction } from "@/lib/apiTypes";
import { useTranslation } from "react-i18next";
import AppErrorState from "@/components/shared/AppErrorState";
export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [deptId, setDeptId] = useState("");
  const [txType, setTxType] = useState("");
  const { t } = useTranslation("inventory");
  const { data: deptData } = useGetDepartmentsQuery();
  const { data, isLoading, isFetching, isError, refetch } =
    useGetTransactionsQuery({
      page,
      limit: 20,
      ...(deptId ? { departmentId: deptId } : {}),
      ...(txType ? { transactionType: txType } : {}),
    });

  const columns: ColumnDef<InventoryTransaction>[] = [
    {
      key: "date",
      header: t("transactions.date"),
      cell: (r) => (
        <span className="text-xs">{formatDateTime(r.transactionDate)}</span>
      ),
    },
    {
      key: "type",
      header: t("transactions.type"),
      cell: (r) => (
        <StatusBadge status={r.transactionType} domain="transaction" />
      ),
    },
    {
      key: "material",
      header: t("transactions.material"),
      cell: (r) => <span className="text-sm">{r.variant?.variantName}</span>,
    },
    {
      key: "dept",
      header: t("transactions.department"),
      cell: (r) => r.department?.name,
    },
    {
      key: "batch",
      header: t("transactions.batch"),
      cell: (r) => (
        <code className="text-xs bg-muted px-1 rounded">
          {r.batch?.batchNumber}
        </code>
      ),
    },
    {
      key: "qty",
      header: t("transactions.qty"),
      cell: (r) => (
        <span
          className={cn(
            "font-mono font-medium tabular-nums",
            r.quantity > 0 ? "text-success" : "text-danger",
          )}
        >
          {r.quantity > 0 ? "+" : ""}
          {r.quantity}
        </span>
      ),
    },
    {
      key: "balance",
      header: t("transactions.balance"),
      cell: (r) => (
        <span className="font-mono tabular-nums">{r.balanceAfter}</span>
      ),
    },
    {
      key: "by",
      header: t("transactions.by"),
      cell: (r) => <span className="text-xs">{r.performedBy?.fullName}</span>,
    },
  ];

  const TX_TYPES = [
    "purchase_receipt",
    "department_transfer_out",
    "department_transfer_in",
    "prescription_dispense",
    "department_consumption",
    "adjustment_damaged",
    "adjustment_expired",
    "adjustment_shrinkage",
    "adjustment_found",
  ];

  return (
    <div>
      <AppPageHeader title={t("transactions.title")} />
      <div className="flex gap-3 mb-4 flex-wrap">
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
        <Select value={txType} onValueChange={setTxType}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder={t("common:filters.allTypes")} />
          </SelectTrigger>
          <SelectContent>
            {TX_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`status:transaction.${type}`, {
                  defaultValue: type.replace(/_/g, " "),
                })}
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
