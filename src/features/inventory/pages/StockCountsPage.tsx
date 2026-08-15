import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetStockCountsQuery,
  useCreateStockCountMutation,
} from "@/api/inventory.api";
import { useGetDepartmentsQuery } from "@/api/departments.api";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable, { type ColumnDef } from "@/components/shared/AppDataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/primitive/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import { Textarea } from "@/components/primitive/textarea";
import { formatDate } from "@/lib/formatters";
import type { StockCountSession } from "@/lib/apiTypes";
import { useTranslation } from "react-i18next";

export default function StockCountsPage() {
  const { t } = useTranslation("inventory");
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    departmentId: "",
    countDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: deptData } = useGetDepartmentsQuery();
  const { data, isLoading } = useGetStockCountsQuery({ page, limit: 20 });
  const [createStockCount, { isLoading: creating }] =
    useCreateStockCountMutation();

  async function handleCreate() {
    if (!form.departmentId) {
      setFormError(t("stockCounts.departmentRequired"));
      return;
    }
    setFormError(null);
    try {
      const res = await createStockCount({
        departmentId: form.departmentId,
        countDate: form.countDate,
        ...(form.notes ? { notes: form.notes } : {}),
      }).unwrap();
      setOpen(false);
      navigate(`/inventory/stock-counts/${res.data.id}`);
    } catch (e: unknown) {
      setFormError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  const columns: ColumnDef<StockCountSession>[] = [
    {
      key: "dept",
      header: t("stockCounts.department"),
      cell: (r) => <span className="font-medium">{r.department?.name}</span>,
    },
    {
      key: "date",
      header: t("stockCounts.countDate"),
      cell: (r) => formatDate(r.countDate),
    },
    {
      key: "items",
      header: t("stockCounts.items"),
      cell: (r) => r.items?.length ?? 0,
    },
    {
      key: "by",
      header: t("stockCounts.initiatedBy"),
      cell: (r) => r.initiatedBy?.fullName,
    },
    {
      key: "status",
      header: t("stockCounts.status"),
      cell: (r) => <StatusBadge status={r.status} domain="stockCount" />,
    },
    {
      key: "completed",
      header: t("stockCounts.completed"),
      cell: (r) => formatDate(r.completedAt),
    },
  ];

  return (
    <div>
      <AppPageHeader
        title={t("stockCounts.title")}
        actions={
          <Button onClick={() => setOpen(true)}>{t("stockCounts.new")}</Button>
        }
      />
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <AppDataTable
          data={data?.data}
          columns={columns}
          isLoading={isLoading}
          rowKey={(r) => r.id}
          onPageChange={setPage}
          onRowClick={(r) => navigate(`/inventory/stock-counts/${r.id}`)}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("stockCounts.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label required>{t("stockCounts.department")}</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => setForm({ ...form, departmentId: v })}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("stockCounts.selectDepartment")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(deptData?.data?.items ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label required>{t("stockCounts.countDate")}</Label>
              <Input
                type="date"
                value={form.countDate}
                onChange={(e) =>
                  setForm({ ...form, countDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("stockCounts.notes")}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
            {formError && <p className="text-xs text-danger">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              {t("stockCounts.createSession")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
