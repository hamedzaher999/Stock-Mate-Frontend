import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetVisitsQuery } from "@/api/visits.api";
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
import type { Visit } from "@/lib/apiTypes";
import { useNavigate } from "react-router-dom";
const VISIT_STATUSES = ["completed", "cancelled"] as const;
export default function VisitsPage() {
  const { t } = useTranslation("visits");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [deptId, setDeptId] = useState("");
  const navigate = useNavigate();
  const { data, isLoading } = useGetVisitsQuery({
    page,
    limit: 20,
    ...(status ? { status } : {}),
    ...(deptId ? { departmentId: deptId } : {}),
  });
  const { data: deptData } = useGetDepartmentsQuery();

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

  return (
    <div>
      <AppPageHeader title={t("title")} />
      <div className="flex gap-3 mb-4 flex-wrap">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("common:filters.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("common:filters.all")}</SelectItem>
            {VISIT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status:visit.${s}`, { defaultValue: s })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <AppDataTable
          data={data?.data}
          columns={columns}
          isLoading={isLoading}
          rowKey={(r) => r.id}
          onPageChange={setPage}
          onRowClick={(r) => navigate(`/visits/${r.id}`)}
        />
      </div>
    </div>
  );
}
