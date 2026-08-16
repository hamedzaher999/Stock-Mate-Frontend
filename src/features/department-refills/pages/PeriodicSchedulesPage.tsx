import { useState } from "react";
import { Trash2 } from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable from "@/components/shared/AppDataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import AppPermissionGate from "@/components/shared/AppPermissionGate";
import { Button } from "@/components/primitive/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import { Textarea } from "@/components/primitive/textarea";
import { Label } from "@/components/primitive/label";
import {
  useGetPeriodicSchedulesQuery,
  useCancelPeriodicScheduleMutation,
} from "@/api/refills.api";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/formatters";
import type { PeriodicSchedule } from "@/lib/apiTypes";
import type { ColumnDef } from "@/components/shared/AppDataTable";
import { useTranslation } from "react-i18next";
import AppErrorState from "@/components/shared/AppErrorState";
export default function PeriodicSchedulesPage() {
  const { t } = useTranslation("refills");
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } =
    useGetPeriodicSchedulesQuery({ page, limit: 20 });
  const [cancel] = useCancelPeriodicScheduleMutation();
  const [selected, setSelected] = useState<PeriodicSchedule | null>(null);
  const [reason, setReason] = useState("");

  const handleCancel = async () => {
    if (!selected) return;
    await cancel({ id: selected.id, reason });
    setSelected(null);
    setReason("");
  };

  const columns: ColumnDef<PeriodicSchedule>[] = [
    {
      key: "number",
      header: t("schedules.requestNumber"),
      cell: (r) => r.originRequest?.requestNumber ?? "—",
    },
    {
      key: "dept",
      header: t("schedules.department"),
      cell: (r) => r.department?.name,
    },
    {
      key: "type",
      header: t("schedules.type"),
      cell: (r) => <StatusBadge status={r.requestType} domain="refillType" />,
    },
    {
      key: "freq",
      header: t("schedules.frequency"),
      cell: (r) =>
        t("schedules.everyN", { n: r.frequencyInterval, type: r.requestType }),
    },
    {
      key: "next",
      header: t("schedules.nextDue"),
      cell: (r) => (r.nextRunDate ? formatDate(r.nextRunDate) : "—"),
    },
    {
      key: "status",
      header: t("schedules.status"),
      cell: (r) => <StatusBadge status={r.status} domain="periodicSchedule" />,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <AppPermissionGate
          permission={PERMISSIONS.MANAGE_PERIODIC_REFILL_SCHEDULES}
        >
          {r.status === "active" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelected(r);
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </AppPermissionGate>
      ),
    },
  ];

  return (
    <div className="p-6">
      <AppPageHeader title={t("schedules.title")} />
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

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("schedules.cancelTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t("schedules.reason")}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              {t("common:actions.back")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!reason}
            >
              {t("schedules.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
