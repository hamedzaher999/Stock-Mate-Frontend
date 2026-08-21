import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetStockCountsQuery,
  useCreateStockCountMutation,
} from "@/api/inventory.api";
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
import AppErrorState from "@/components/shared/AppErrorState";
import DepartmentSelector, {
  useDepartmentSelector,
} from "@/components/shared/DepartmentSelector";
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

  const {
    resolved,
    noAccess,
    scoped,
    departments: selectableDepartments,
    isLoading: deptLoading,
  } = useDepartmentSelector("stock");

  useEffect(() => {
    if (open && resolved && !form.departmentId) {
      setForm((f) => ({ ...f, departmentId: resolved.id }));
    }
  }, [open, resolved]);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetStockCountsQuery({ page, limit: 20 });
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

  function openCreateDialog() {
    setForm({
      departmentId: resolved ? resolved.id : "",
      countDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setFormError(null);
    setOpen(true);
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
          <Button onClick={openCreateDialog} disabled={deptLoading}>
            {t("stockCounts.new")}
          </Button>
        }
      />
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
            onRowClick={(r) => navigate(`/inventory/stock-counts/${r.id}`)}
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("stockCounts.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {noAccess ? (
              <p className="text-sm text-muted-foreground">
                {t("stockCounts.noAccess", {
                  defaultValue:
                    "Not assigned to an eligible department for stock counts.",
                })}
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label required>{t("stockCounts.department")}</Label>
                  {scoped ? (
                    <DepartmentSelector
                      context="stock"
                      value={form.departmentId}
                      onChange={(id) =>
                        setForm((f) => ({ ...f, departmentId: id }))
                      }
                    />
                  ) : (
                    <Select
                      value={form.departmentId}
                      onValueChange={(v) =>
                        setForm({ ...form, departmentId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("stockCounts.selectDepartment")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {selectableDepartments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                {formError && (
                  <p className="text-xs text-danger">{formError}</p>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              loading={creating}
              disabled={noAccess}
            >
              {t("stockCounts.createSession")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
