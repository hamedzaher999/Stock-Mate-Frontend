import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetAdjustmentsQuery,
  useCreateAdjustmentMutation,
  useGetBatchesQuery,
} from "@/api/inventory.api";
import { useGetVariantsQuery } from "@/api/catalog.api";
import { useGetDepartmentsQuery } from "@/api/departments.api";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";
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
import { formatDateTime } from "@/lib/formatters";
import type { Adjustment } from "@/lib/apiTypes";

export default function AdjustmentsPage() {
  const { t } = useTranslation("inventory");
  const canCreate = usePermission(PERMISSIONS.PERFORM_INVENTORY_ADJUSTMENT);

  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    variantId: "",
    departmentId: "",
    batchId: "",
    adjustmentType: "",
    quantity: "",
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useGetAdjustmentsQuery({ page, limit: 20 });
  const { data: variantsData } = useGetVariantsQuery({
    isActive: true,
    limit: 100,
  } as { isActive: boolean; limit: number });
  const { data: deptData } = useGetDepartmentsQuery();
  const { data: batchData } = useGetBatchesQuery(
    {
      variantId: form.variantId,
      departmentId: form.departmentId,
      limit: 50,
    } as { variantId: string; departmentId: string; limit: number },
    { skip: !form.variantId || !form.departmentId },
  );
  const [createAdjustment, { isLoading: creating }] =
    useCreateAdjustmentMutation();

  const selectedVariant = variantsData?.data?.items?.find(
    (v) => v.id === form.variantId,
  );
  const isFixedAsset = selectedVariant?.product?.materialType === "fixed_asset";
  const allowedTypes = isFixedAsset
    ? ["damaged", "shrinkage"]
    : ["damaged", "expired", "shrinkage", "found"];

  async function handleCreate() {
    if (
      !form.variantId ||
      !form.departmentId ||
      !form.batchId ||
      !form.adjustmentType ||
      !form.quantity
    ) {
      setFormError(t("adjustments.allFieldsRequired"));
      return;
    }
    setFormError(null);
    try {
      await createAdjustment({
        variantId: form.variantId,
        departmentId: form.departmentId,
        batchId: form.batchId,
        adjustmentType: form.adjustmentType,
        quantity: parseInt(form.quantity),
        ...(form.notes ? { notes: form.notes } : {}),
      }).unwrap();
      setOpen(false);
      setForm({
        variantId: "",
        departmentId: "",
        batchId: "",
        adjustmentType: "",
        quantity: "",
        notes: "",
      });
    } catch (e: unknown) {
      setFormError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  const columns: ColumnDef<Adjustment>[] = [
    {
      key: "type",
      header: t("adjustments.type"),
      cell: (r) => (
        <StatusBadge status={r.adjustmentType} domain="adjustment" />
      ),
    },
    {
      key: "material",
      header: t("adjustments.material"),
      cell: (r) => (
        <span className="font-medium text-sm">{r.variant?.variantName}</span>
      ),
    },
    {
      key: "dept",
      header: t("adjustments.department"),
      cell: (r) => r.department?.name,
    },
    {
      key: "batch",
      header: t("adjustments.batch"),
      cell: (r) => (
        <code className="text-xs bg-muted px-1 rounded">
          {r.batch?.batchNumber}
        </code>
      ),
    },
    {
      key: "qty",
      header: t("adjustments.quantity"),
      cell: (r) => <span className="font-mono font-medium">{r.quantity}</span>,
    },
    {
      key: "notes",
      header: t("adjustments.notes"),
      cell: (r) => r.notes ?? "—",
    },
    {
      key: "by",
      header: t("adjustments.reportedBy"),
      cell: (r) => r.reportedBy?.fullName,
    },
    {
      key: "date",
      header: t("adjustments.date"),
      cell: (r) => formatDateTime(r.createdAt),
    },
  ];

  return (
    <div>
      <AppPageHeader
        title={t("adjustments.title")}
        actions={
          canCreate && (
            <Button onClick={() => setOpen(true)}>
              {t("adjustments.create")}
            </Button>
          )
        }
      />
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <AppDataTable
          data={data?.data}
          columns={columns}
          isLoading={isLoading}
          rowKey={(r) => r.id}
          onPageChange={setPage}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adjustments.create")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label required>{t("adjustments.variant")}</Label>
              <Select
                value={form.variantId}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    variantId: v,
                    batchId: "",
                    adjustmentType: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("adjustments.selectMaterial")} />
                </SelectTrigger>
                <SelectContent>
                  {(variantsData?.data?.items ?? []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.variantName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label required>{t("adjustments.department")}</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) =>
                  setForm({ ...form, departmentId: v, batchId: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("adjustments.selectDepartment")}
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
              <Label required>{t("adjustments.batch")}</Label>
              <Select
                value={form.batchId}
                onValueChange={(v) => setForm({ ...form, batchId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("adjustments.selectBatch")} />
                </SelectTrigger>
                <SelectContent>
                  {(batchData?.data?.items ?? []).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.batchNumber} (Qty:{" "}
                      {b.batchStocks?.find(
                        (s) => s.departmentId === form.departmentId,
                      )?.quantity ?? 0}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label required>{t("adjustments.type")}</Label>
              <Select
                value={form.adjustmentType}
                onValueChange={(v) => setForm({ ...form, adjustmentType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("adjustments.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {allowedTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`status:adjustment.${type}`, {
                        defaultValue:
                          type.charAt(0).toUpperCase() + type.slice(1),
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label required>{t("adjustments.quantity")}</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("adjustments.notes")}</Label>
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
              {t("adjustments.createAdjustment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
