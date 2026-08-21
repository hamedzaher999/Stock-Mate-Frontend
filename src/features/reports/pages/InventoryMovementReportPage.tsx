import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  useGetInventoryMovementReportQuery,
  getInventoryMovementReportExportUrl,
} from "@/api/reports.api";
import { useGetVariantsQuery } from "@/api/catalog.api";
import ReportShell from "@/components/shared/ReportShell";
import AppDataTable, { ColumnDef } from "@/components/shared/AppDataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/primitive/select";
import { Label } from "@/components/primitive/label";
import { cn, formatDateTime } from "@/lib/formatters";
import type { InventoryMovementReportRow } from "@/lib/apiTypes";
import DepartmentSelector, {
  AppEmptyState,
  useDepartmentSelector,
} from "@/components/shared/DepartmentSelector";
import AppPageHeader from "@/components/shared/AppPageHeader";
import { Skeleton } from "@/components/primitive/skeleton";
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

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function InventoryMovementReportPage() {
  const { t } = useTranslation("reports");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [departmentId, setDepartmentId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const {
    resolved,
    noAccess,
    scoped,
    departments: selectableDepartments,
    isLoading: deptLoading,
  } = useDepartmentSelector("batches");

  useEffect(() => {
    if (resolved && !departmentId) {
      setDepartmentId(resolved.id);
    }
  }, [resolved, departmentId]);

  const canFilterByDepartment = !scoped;

  const { data: variantData } = useGetVariantsQuery({ limit: 100 });

  const queryParams = {
    from,
    to,
    page,
    limit: 20,
    ...(departmentId ? { departmentId } : {}),
    ...(variantId ? { variantId } : {}),
    ...(transactionType ? { transactionType } : {}),
  };

  const { data, isLoading, isFetching, isError, refetch } =
    useGetInventoryMovementReportQuery(queryParams, {
      skip: scoped && !departmentId && !noAccess,
    });
  const result = data?.data;

  async function handleExport() {
    setExporting(true);
    try {
      window.open(getInventoryMovementReportExportUrl(queryParams), "_blank");
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  }

  const columns: ColumnDef<InventoryMovementReportRow>[] = [
    {
      key: "date",
      header: t("columns.date"),
      cell: (r) => (
        <span className="text-xs">{formatDateTime(r.transactionDate)}</span>
      ),
    },
    {
      key: "type",
      header: t("columns.type"),
      cell: (r) => (
        <StatusBadge status={r.transactionType} domain="transaction" />
      ),
    },
    {
      key: "variant",
      header: t("columns.material"),
      cell: (r) => <span className="text-sm">{r.variant?.variantName}</span>,
    },
    {
      key: "dept",
      header: t("columns.department"),
      cell: (r) => r.department?.name,
    },
    {
      key: "batch",
      header: t("columns.batch"),
      cell: (r) => (
        <code className="text-xs bg-muted px-1 rounded">
          {r.batch?.batchNumber ?? "—"}
        </code>
      ),
    },
    {
      key: "qty",
      header: t("columns.quantity"),
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
      header: t("columns.balanceAfter"),
      cell: (r) => (
        <span className="font-mono tabular-nums">{r.balanceAfter}</span>
      ),
    },
    {
      key: "by",
      header: t("columns.performedBy"),
      cell: (r) => <span className="text-xs">{r.performedBy?.fullName}</span>,
    },
  ];

  if (deptLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (noAccess) {
    return (
      <div className="p-6">
        <AppPageHeader title={t("movement.title")} />
        <AppEmptyState
          title={t("common:forbidden")}
          description={t("common:noAccess", {
            defaultValue:
              "Not assigned to an eligible department for this page.",
          })}
        />
      </div>
    );
  }

  return (
    <ReportShell
      title={t("movement.title")}
      subtitle={t("movement.subtitle")}
      from={from}
      to={to}
      onFromChange={(v) => {
        setFrom(v);
        setPage(1);
      }}
      onToChange={(v) => {
        setTo(v);
        setPage(1);
      }}
      onExport={handleExport}
      exporting={exporting}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      onRetry={refetch}
      filters={
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("filters.department")}</Label>
            {canFilterByDepartment ? (
              <Select
                value={departmentId || "__all__"}
                onValueChange={(v) => {
                  setDepartmentId(v === "__all__" ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t("filters.allDepartments")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t("filters.all")}</SelectItem>
                  {selectableDepartments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <DepartmentSelector
                context="batches"
                value={departmentId}
                onChange={(id) => {
                  setDepartmentId(id);
                  setPage(1);
                }}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("filters.material")}</Label>
            <Select
              value={variantId || "__all__"}
              onValueChange={(v) => {
                setVariantId(v === "__all__" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder={t("filters.allMaterials")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t("filters.all")}</SelectItem>
                {(variantData?.data?.items ?? []).map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.variantName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("filters.type")}</Label>
            <Select
              value={transactionType || "__all__"}
              onValueChange={(v) => {
                setTransactionType(v === "__all__" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder={t("filters.allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t("filters.all")}</SelectItem>
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
        </>
      }
      summaryCards={[
        {
          label: t("movement.totalTransactions"),
          value: result?.summary.totalTransactions ?? 0,
        },
        {
          label: t("movement.quantityIn"),
          value: result?.summary.totalQuantityIn ?? 0,
          color: "text-success",
        },
        {
          label: t("movement.quantityOut"),
          value: result?.summary.totalQuantityOut ?? 0,
          color: "text-danger",
        },
        {
          label: t("movement.netQuantity"),
          value: result?.summary.netQuantity ?? 0,
          color:
            (result?.summary.netQuantity ?? 0) >= 0
              ? "text-success"
              : "text-danger",
        },
      ]}
      chart={
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={result?.series ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="quantityIn"
                name={t("movement.quantityIn")}
                stroke="var(--success)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="quantityOut"
                name={t("movement.quantityOut")}
                stroke="var(--danger)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      }
      breakdownTitle={t("byDepartment")}
      breakdown={
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-start font-medium">
                  {t("columns.department")}
                </th>
                <th className="px-4 py-2 text-start font-medium">
                  {t("columns.count")}
                </th>
                <th className="px-4 py-2 text-start font-medium">
                  {t("movement.quantityIn")}
                </th>
                <th className="px-4 py-2 text-start font-medium">
                  {t("movement.quantityOut")}
                </th>
              </tr>
            </thead>
            <tbody>
              {(result?.byDepartment ?? []).map((d) => (
                <tr key={d.departmentId} className="border-t">
                  <td className="px-4 py-2">{d.departmentName}</td>
                  <td className="px-4 py-2">{d.count}</td>
                  <td className="px-4 py-2 text-success">+{d.quantityIn}</td>
                  <td className="px-4 py-2 text-danger">-{d.quantityOut}</td>
                </tr>
              ))}
              {(result?.byDepartment ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    {t("noData")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      }
      table={
        <AppDataTable
          data={result?.rows}
          columns={columns}
          isLoading={false}
          isFetching={isFetching}
          rowKey={(r) => r.id}
          onPageChange={setPage}
        />
      }
    />
  );
}
