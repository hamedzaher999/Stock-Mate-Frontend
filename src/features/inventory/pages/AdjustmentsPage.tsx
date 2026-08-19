import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetAdjustmentsQuery,
  useCreateAdjustmentMutation,
  useGetBatchesQuery,
  useGetStockSettingsQuery,
} from "@/api/inventory.api";
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
import type { Adjustment, VariantRef } from "@/lib/apiTypes";
import AppErrorState from "@/components/shared/AppErrorState";
import { Loader2 } from "lucide-react";
import DepartmentSelector, {
  useDepartmentSelector,
} from "@/components/shared/DepartmentSelector";
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

  const { data, isLoading, isFetching, isError, refetch } =
    useGetAdjustmentsQuery({ page, limit: 20 });

  const {
    resolved,
    noAccess,
    isLoading: deptLoading,
  } = useDepartmentSelector("stock");

  useEffect(() => {
    if (open && resolved && !form.departmentId) {
      setForm((f) => ({ ...f, departmentId: resolved.id }));
    }
  }, [open, resolved]);

  const { data: stockSettingsData, isFetching: stockSettingsFetching } =
    useGetStockSettingsQuery(
      {
        departmentId: form.departmentId,
        isActive: true,
        limit: 100,
      } as { departmentId: string; isActive: boolean; limit: number },
      { skip: !form.departmentId },
    );
  const stockSettingVariants = (stockSettingsData?.data?.items ?? [])
    .map((s) => s.variant)
    .filter((v): v is VariantRef => !!v);

  const {
    data: batchData,
    isLoading: batchesLoading,
    isFetching: batchesFetching,
  } = useGetBatchesQuery(
    {
      variantId: form.variantId,
      departmentId: form.departmentId,
      limit: 50,
    } as { variantId: string; departmentId: string; limit: number },
    { skip: !form.variantId || !form.departmentId },
  );
  const batchesBusy = batchesLoading || batchesFetching;
  const [createAdjustment, { isLoading: creating }] =
    useCreateAdjustmentMutation();

  const selectedVariant = stockSettingVariants.find(
    (v) => v.id === form.variantId,
  );
  const isFixedAsset = selectedVariant?.product?.materialType === "fixed_asset";
  const allowedTypes = isFixedAsset
    ? ["damaged", "shrinkage"]
    : ["damaged", "expired", "shrinkage", "found"];

  function openCreateDialog() {
    setForm({
      variantId: "",
      departmentId: resolved ? resolved.id : "",
      batchId: "",
      adjustmentType: "",
      quantity: "",
      notes: "",
    });
    setFormError(null);
    setOpen(true);
  }

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
            <Button onClick={openCreateDialog} disabled={deptLoading}>
              {t("adjustments.create")}
            </Button>
          )
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
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adjustments.create")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {noAccess ? (
              <p className="text-sm text-muted-foreground">
                {t("adjustments.noAccess", {
                  defaultValue:
                    "Not assigned to an eligible department for adjustments.",
                })}
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label required>{t("adjustments.department")}</Label>
                  <DepartmentSelector
                    context="stock"
                    value={form.departmentId}
                    onChange={(id) =>
                      setForm({
                        ...form,
                        departmentId: id,
                        variantId: "",
                        batchId: "",
                        adjustmentType: "",
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label required>{t("adjustments.variant")}</Label>
                    {stockSettingsFetching && (
                      <Loader2 className="size-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
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
                    disabled={!form.departmentId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          form.departmentId
                            ? t("adjustments.selectMaterial")
                            : t("adjustments.selectDepartmentFirst", {
                                defaultValue: "Select a department first",
                              })
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {stockSettingVariants.length === 0 &&
                        form.departmentId && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            {t("adjustments.noConfiguredMaterials", {
                              defaultValue:
                                "No materials are configured for this department.",
                            })}
                          </div>
                        )}
                      {stockSettingVariants.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.variantName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label required>{t("adjustments.batch")}</Label>
                    {batchesBusy && (
                      <Loader2 className="size-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <Select
                    value={form.batchId}
                    onValueChange={(v) => setForm({ ...form, batchId: v })}
                    disabled={
                      !form.variantId || !form.departmentId || batchesLoading
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          batchesLoading
                            ? t("adjustments.loadingBatches", {
                                defaultValue: "Loading batches…",
                              })
                            : t("adjustments.selectBatch")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {!batchesLoading &&
                        form.variantId &&
                        form.departmentId &&
                        (batchData?.data?.items ?? []).length === 0 && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            {t("adjustments.noBatchesAvailable", {
                              defaultValue: "No batches available.",
                            })}
                          </div>
                        )}
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
                    onValueChange={(v) =>
                      setForm({ ...form, adjustmentType: v })
                    }
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
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("adjustments.notes")}</Label>
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
              {t("adjustments.createAdjustment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
