import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetVisitsQuery } from "@/api/visits.api";
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
import type { Visit } from "@/lib/apiTypes";
import { useNavigate } from "react-router-dom";
import AppErrorState from "@/components/shared/AppErrorState";
import DepartmentSelector, {
  AppEmptyState,
  useDepartmentSelector,
} from "@/components/shared/DepartmentSelector";
import { Skeleton } from "@/components/primitive/skeleton";
const VISIT_STATUSES = ["completed", "cancelled"] as const;
export default function VisitsPage() {
  const { t } = useTranslation("visits");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [deptId, setDeptId] = useState("");
  const navigate = useNavigate();

  const {
    resolved,
    noAccess,
    scoped,
    departments: selectableDepartments,
    isLoading: deptLoading,
  } = useDepartmentSelector("batches");

  useEffect(() => {
    if (resolved && !deptId) {
      setDeptId(resolved.id);
    }
  }, [resolved, deptId]);

  const canFilterByDepartment = !scoped;

  const { data, isLoading, isFetching, isError, refetch } = useGetVisitsQuery(
    {
      page,
      limit: 20,
      ...(status ? { status } : {}),
      ...(deptId ? { departmentId: deptId } : {}),
    },
    { skip: scoped && !deptId && !noAccess },
  );

  const columns: ColumnDef<Visit>[] = [
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
      key: "dept",
      header: t("department"),
      cell: (r) => r.department?.name ?? "—",
    },
    {
      key: "date",
      header: t("visitDate"),
      cell: (r) => formatDateTime(r.visitDate),
    },
    {
      key: "diagnosis",
      header: t("diagnosis"),
      cell: (r) =>
        r.diagnosis ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "status",
      header: t("status"),
      cell: (r) => <StatusBadge status={r.status} domain="visit" />,
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
            {VISIT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status:visit.${s}`, { defaultValue: s })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canFilterByDepartment ? (
          <Select
            value={deptId || "__all__"}
            onValueChange={(v) => {
              setDeptId(v === "__all__" ? "" : v);
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
            value={deptId}
            onChange={(id) => {
              setDeptId(id);
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
            onRowClick={(r) => navigate(`/visits/${r.id}`)}
          />
        )}
      </div>
    </div>
  );
}
