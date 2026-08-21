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
  useGetAdjustmentsReportQuery,
  getAdjustmentsReportExportUrl,
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
import { formatDateTime } from "@/lib/formatters";
import type { AdjustmentReportRow } from "@/lib/apiTypes";
import DepartmentSelector, {
  AppEmptyState,
  useDepartmentSelector,
} from "@/components/shared/DepartmentSelector";
import AppPageHeader from "@/components/shared/AppPageHeader";
import { Skeleton } from "@/components/primitive/skeleton";
const ADJUSTMENT_TYPES = ["damaged", "expired", "shrinkage", "found"];

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdjustmentsReportPage() {
  const { t } = useTranslation("reports");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [departmentId, setDepartmentId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("");
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
    ...(adjustmentType ? { adjustmentType } : {}),
  };

  const { data, isLoading, isFetching, isError, refetch } =
    useGetAdjustmentsReportQuery(queryParams, {
      skip: scoped && !departmentId && !noAccess,
    });
  const result = data?.data;

  async function handleExport() {
    setExporting(true);
    try {
      window.open(getAdjustmentsReportExportUrl(queryParams), "_blank");
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  }

  const columns: ColumnDef<AdjustmentReportRow>[] = [
    {
      key: "date",
      header: t("columns.date"),
      cell: (r) => (
        <span className="text-xs">{formatDateTime(r.createdAt)}</span>
      ),
    },
    {
      key: "type",
      header: t("columns.type"),
      cell: (r) => (
        <StatusBadge status={r.adjustmentType} domain="adjustment" />
      ),
    },
    {
      key: "variant",
      header: t("columns.material"),
      cell: (r) => (
        <span className="text-sm font-medium">{r.variant?.variantName}</span>
      ),
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
      cell: (r) => <span className="font-mono font-medium">{r.quantity}</span>,
    },
    {
      key: "by",
      header: t("columns.reportedBy"),
      cell: (r) => r.reportedBy?.fullName,
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
        <AppPageHeader title={t("adjustments.title")} />
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
      title={t("adjustments.title")}
      subtitle={t("adjustments.subtitle")}
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
              value={adjustmentType || "__all__"}
              onValueChange={(v) => {
                setAdjustmentType(v === "__all__" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t("filters.allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t("filters.all")}</SelectItem>
                {ADJUSTMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`status:adjustment.${type}`, { defaultValue: type })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      }
      summaryCards={[
        {
          label: t("adjustments.totalAdjustments"),
          value: result?.summary.totalAdjustments ?? 0,
        },
        {
          label: t("adjustments.totalQuantity"),
          value: result?.summary.totalQuantity ?? 0,
        },
        {
          label: t("adjustments.increased"),
          value:
            result?.byDepartment.reduce((s, d) => s + d.quantityIncreased, 0) ??
            0,
          color: "text-success",
        },
        {
          label: t("adjustments.decreased"),
          value:
            result?.byDepartment.reduce((s, d) => s + d.quantityDecreased, 0) ??
            0,
          color: "text-danger",
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
                dataKey="quantityIncreased"
                name={t("adjustments.increased")}
                stroke="var(--success)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="quantityDecreased"
                name={t("adjustments.decreased")}
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
                  {t("adjustments.increased")}
                </th>
                <th className="px-4 py-2 text-start font-medium">
                  {t("adjustments.decreased")}
                </th>
              </tr>
            </thead>
            <tbody>
              {(result?.byDepartment ?? []).map((d) => (
                <tr key={d.departmentId} className="border-t">
                  <td className="px-4 py-2">{d.departmentName}</td>
                  <td className="px-4 py-2">{d.count}</td>
                  <td className="px-4 py-2 text-success">
                    +{d.quantityIncreased}
                  </td>
                  <td className="px-4 py-2 text-danger">
                    -{d.quantityDecreased}
                  </td>
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
