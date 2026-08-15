import { useState } from "react";
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
const PRESCRIPTION_STATUSES = ["active", "completed", "cancelled"] as const;
export default function PrescriptionsPage() {
  const { t } = useTranslation("prescriptions");
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useGetPrescriptionsQuery({
    page,
    limit: 20,
    ...(status ? { status } : {}),
  });

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

  return (
    <div>
      <AppPageHeader title={t("title")} />
      <div className="flex gap-3 mb-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("common:filters.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("common:filters.all")}</SelectItem>
            {PRESCRIPTION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status:prescription.${s}`, { defaultValue: s })}
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
          onRowClick={(r) => navigate(`/prescriptions/${r.id}`)}
        />
      </div>
    </div>
  );
}
