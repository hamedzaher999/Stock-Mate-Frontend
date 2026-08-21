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
  useGetPatientVisitsReportQuery,
  getPatientVisitsReportExportUrl,
} from "@/api/reports.api";
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
import type { PatientVisitsReportRow } from "@/lib/apiTypes";
import DepartmentSelector, {
  AppEmptyState,
  useDepartmentSelector,
} from "@/components/shared/DepartmentSelector";
import { Skeleton } from "@/components/primitive/skeleton";
import AppPageHeader from "@/components/shared/AppPageHeader";
const VISIT_STATUSES = ["completed", "cancelled"] as const;

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PatientVisitsReportPage() {
  const { t } = useTranslation("reports");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");
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

  const queryParams = {
    from,
    to,
    page,
    limit: 20,
    ...(departmentId ? { departmentId } : {}),
    ...(status ? { status } : {}),
  };

  const { data, isLoading, isFetching, isError, refetch } =
    useGetPatientVisitsReportQuery(queryParams, {
      skip: scoped && !departmentId && !noAccess,
    });
  const result = data?.data;

  async function handleExport() {
    setExporting(true);
    try {
      window.open(getPatientVisitsReportExportUrl(queryParams), "_blank");
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  }

  const columns: ColumnDef<PatientVisitsReportRow>[] = [
    {
      key: "date",
      header: t("columns.date"),
      cell: (r) => (
        <span className="text-xs">{formatDateTime(r.visitDate)}</span>
      ),
    },
    {
      key: "patient",
      header: t("columns.patient"),
      cell: (r) => (
        <span className="text-sm font-medium">{r.patient?.fullName}</span>
      ),
    },
    {
      key: "dept",
      header: t("columns.department"),
      cell: (r) => r.department?.name,
    },
    {
      key: "doctor",
      header: t("columns.doctor"),
      cell: (r) => r.doctor?.fullName,
    },
    {
      key: "status",
      header: t("columns.status"),
      cell: (r) => <StatusBadge status={r.status} domain="visit" />,
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
        <AppPageHeader title={t("visits.title")} />
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
      title={t("visits.title")}
      subtitle={t("visits.subtitle")}
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
            <Label className="text-xs">{t("filters.status")}</Label>
            <Select
              value={status || "__all__"}
              onValueChange={(v) => {
                setStatus(v === "__all__" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t("filters.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t("filters.all")}</SelectItem>
                {VISIT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`status:visit.${s}`, { defaultValue: s })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      }
      summaryCards={[
        {
          label: t("visits.totalVisits"),
          value: result?.summary.totalVisits ?? 0,
        },
        {
          label: t("visits.uniquePatients"),
          value: result?.summary.uniquePatients ?? 0,
        },
        ...(result?.summary.byStatus ?? []).slice(0, 2).map((s) => ({
          label: t(`status:visit.${s.status}`, { defaultValue: s.status }),
          value: s.count,
          color: s.status === "cancelled" ? "text-danger" : "text-success",
        })),
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
                dataKey="visitCount"
                name={t("visits.totalVisits")}
                stroke="var(--primary)"
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
                  {t("visits.visitCount")}
                </th>
                <th className="px-4 py-2 text-start font-medium">
                  {t("visits.uniquePatients")}
                </th>
              </tr>
            </thead>
            <tbody>
              {(result?.byDepartment ?? []).map((d) => (
                <tr key={d.departmentId} className="border-t">
                  <td className="px-4 py-2">{d.departmentName}</td>
                  <td className="px-4 py-2">{d.visitCount}</td>
                  <td className="px-4 py-2">{d.uniquePatientCount}</td>
                </tr>
              ))}
              {(result?.byDepartment ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={3}
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
