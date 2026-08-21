import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetPrescriptionsQuery } from "@/api/prescriptions.api";
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
import { formatDate } from "@/lib/formatters";
import type { Prescription } from "@/lib/apiTypes";
import AppErrorState from "@/components/shared/AppErrorState";
import DepartmentSelector, {
  AppEmptyState,
  useDepartmentSelector,
} from "@/components/shared/DepartmentSelector";
import { Skeleton } from "@/components/primitive/skeleton";
const PRESCRIPTION_STATUSES = ["active", "completed", "cancelled"] as const;
const CYCLE_STATUSES = [
  "ready",
  "partially_delivered",
  "delivered",
  "missed",
  "cancelled",
] as const;

export default function PrescriptionsPage() {
  const { t } = useTranslation("prescriptions");
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [cycleStatus, setCycleStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");

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

  const { data, isLoading, isFetching, isError, refetch } =
    useGetPrescriptionsQuery(
      {
        page,
        limit: 20,
        ...(status ? { status } : {}),
        ...(cycleStatus ? { cycleStatus } : {}),
        ...(departmentId ? { departmentId } : {}),
      },
      { skip: scoped && !departmentId && !noAccess },
    );

  const columns: ColumnDef<Prescription>[] = [
    {
      key: "patient",
      header: t("patient"),
      cell: (r) => <span className="font-medium">{r.patient?.fullName}</span>,
    },
    {
      key: "doctor",
      header: t("doctor"),
      cell: (r) => r.doctor?.fullName ?? "—",
    },
    {
      key: "start",
      header: t("startDate"),
      cell: (r) => formatDate(r.startDate),
    },
    {
      key: "cycle",
      header: t("cycle"),
      cell: (r) =>
        r.totalCycles
          ? `${r.currentCycleNumber}/${r.totalCycles}`
          : t("indefinite"),
    },
    {
      key: "cycleStatus",
      header: t("cycleStatus"),
      cell: (r) =>
        r.currentCycleStatus ? (
          <StatusBadge
            status={r.currentCycleStatus}
            domain="prescriptionCycle"
          />
        ) : (
          "—"
        ),
    },
    {
      key: "status",
      header: t("status"),
      cell: (r) => <StatusBadge status={r.status} domain="prescription" />,
    },
    {
      key: "items",
      header: t("medications"),
      cell: (r) => t("itemCount", { count: r.items?.length ?? 0 }),
    },
  ];

  if (deptLoading)
    return (
      <div>
        <AppPageHeader title={t("title")} />
        <Skeleton className="h-48 w-full" />
      </div>
    );

  if (noAccess) {
    return (
      <div>
        <AppPageHeader title={t("title")} />
        <AppEmptyState
          title={t("common:forbidden")}
          description={t("noAccess", {
            defaultValue:
              "Not assigned to an eligible department for this page.",
          })}
        />
      </div>
    );
  }

  return (
    <div>
      <AppPageHeader title={t("title")} />
      <div className="flex gap-3 mb-4 flex-wrap">
        <Select
          value={status || "__all__"}
          onValueChange={(v) => {
            setStatus(v === "__all__" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("common:filters.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("common:filters.all")}</SelectItem>
            {PRESCRIPTION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status:prescription.${s}`, { defaultValue: s })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={cycleStatus || "__all__"}
          onValueChange={(v) => {
            setCycleStatus(v === "__all__" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue
              placeholder={t("common:filters.allCycleStatuses", {
                defaultValue: "All cycle statuses",
              })}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("common:filters.all")}</SelectItem>
            {CYCLE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status:prescriptionCycle.${s}`, {
                  defaultValue: s.replace(/_/g, " "),
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canFilterByDepartment ? (
          <Select
            value={departmentId || "__all__"}
            onValueChange={(v) => {
              setDepartmentId(v === "__all__" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("common:filters.allDepartments")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("common:filters.all")}</SelectItem>
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
            onRowClick={(r) => navigate(`/prescriptions/${r.id}`)}
          />
        )}
      </div>
    </div>
  );
}
