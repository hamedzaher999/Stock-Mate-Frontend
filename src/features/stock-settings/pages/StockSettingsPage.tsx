import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, PlusCircle, Trash2 } from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable from "@/components/shared/AppDataTable";
import { Button } from "@/components/primitive/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import { Switch } from "@/components/primitive/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
import {
  useGetStockSettingsQuery,
  useCreateStockSettingMutation,
  useUpdateStockSettingStatusMutation,
  useUpdateStockSettingMutation,
} from "@/api/inventory.api";
import { useGetVariantsQuery } from "@/api/catalog.api";
import type {
  CreateStockSettingResultItem,
  StockSetting,
} from "@/lib/apiTypes";
import type { ColumnDef } from "@/components/shared/AppDataTable";
import { useTranslation } from "react-i18next";
import AppErrorState from "@/components/shared/AppErrorState";
import DepartmentSelector, {
  AppEmptyState,
  useDepartmentSelector,
} from "@/components/shared/DepartmentSelector";
import { Skeleton } from "@/components/primitive/skeleton";
interface StockSettingItemForm {
  variantId: string;
  storageLocation: string;
  minimumStock: number;
  maximumStock: number;
}

interface Form {
  departmentId: string;
  items: StockSettingItemForm[];
}

const EMPTY_ITEM: StockSettingItemForm = {
  variantId: "",
  storageLocation: "",
  minimumStock: 0,
  maximumStock: 0,
};

const EMPTY: Form = {
  departmentId: "",
  items: [{ ...EMPTY_ITEM }],
};

interface EditForm {
  minimumStock: number;
  maximumStock: number;
}

export default function StockSettingsPage() {
  const { t } = useTranslation("inventory");
  const [page, setPage] = useState(1);
  const [variantFilter, setVariantFilter] = useState("");

  const [deptFilter, setDeptFilter] = useState("");
  const {
    resolved,
    noAccess,
    scoped,
    departments: selectableDepartments,
    isLoading: deptLoading,
  } = useDepartmentSelector("stock-settings");

  useEffect(() => {
    if (resolved && !deptFilter) {
      setDeptFilter(resolved.id);
    }
  }, [resolved, deptFilter]);

  const canFilterByDepartment = !scoped;

  const { data, isLoading, isFetching, isError, refetch } =
    useGetStockSettingsQuery(
      {
        page,
        limit: 20,
        ...(deptFilter ? { departmentId: deptFilter } : {}),
        ...(variantFilter ? { variantId: variantFilter } : {}),
      },
      { skip: scoped && !deptFilter && !noAccess },
    );
  const [create, { isLoading: creating }] = useCreateStockSettingMutation();
  const [update, { isLoading: updating }] = useUpdateStockSettingMutation();
  const [updateStatus] = useUpdateStockSettingStatusMutation();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleStatusToggle(id: string, isActive: boolean) {
    setTogglingId(id);
    try {
      await updateStatus({ id, isActive }).unwrap();
    } finally {
      setTogglingId(null);
    }
  }
  const { data: variantData } = useGetVariantsQuery({
    isActive: true,
    limit: 100,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<StockSetting | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    minimumStock: 0,
    maximumStock: 0,
  });
  const [editError, setEditError] = useState<string | null>(null);

  const variants = variantData?.data?.items ?? [];

  const [createResults, setCreateResults] = useState<
    CreateStockSettingResultItem[] | null
  >(null);

  function openCreateDialog() {
    setForm({
      departmentId: resolved ? resolved.id : "",
      items: [{ ...EMPTY_ITEM }],
    });
    setFormError(null);
    setCreateResults(null);
    setOpen(true);
  }

  function addFormItem() {
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
  }

  function removeFormItem(i: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  }

  function updateFormItem(
    i: number,
    field: keyof StockSettingItemForm,
    value: string | number,
  ) {
    setForm((f) => ({
      ...f,
      items: f.items.map((item, idx) =>
        idx === i ? { ...item, [field]: value } : item,
      ),
    }));
  }

  const handleCreate = async () => {
    setFormError(null);
    try {
      const res = await create({
        departmentId: form.departmentId,
        items: form.items
          .filter((i) => i.variantId)
          .map((i) => ({
            variantId: i.variantId,
            storageLocation: i.storageLocation || undefined,
            minimumStock: i.minimumStock,
            maximumStock: i.maximumStock,
          })),
      }).unwrap();
      setCreateResults(res.data.results);
      if (res.data.failed > 0) {
        const succeededIds = new Set(
          res.data.results.filter((r) => r.success).map((r) => r.variantId),
        );
        setForm((f) => ({
          ...f,
          items: f.items.filter((i) => !succeededIds.has(i.variantId)),
        }));
      }
      if (res.data.failed === 0) {
        setOpen(false);
        setForm(EMPTY);
      }
    } catch (e: unknown) {
      setFormError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  };

  function openEdit(setting: StockSetting) {
    setEditTarget(setting);
    setEditForm({
      minimumStock: setting.minimumStock ?? 0,
      maximumStock: setting.maximumStock ?? 0,
    });
    setEditError(null);
  }

  async function handleEditSave() {
    if (!editTarget) return;
    if (
      editForm.minimumStock > editForm.maximumStock &&
      editForm.maximumStock > 0
    ) {
      setEditError(t("stockSettings.minMaxError"));
      return;
    }
    setEditError(null);
    try {
      await update({
        id: editTarget.id,
        data: {
          minimumStock: editForm.minimumStock,
          maximumStock: editForm.maximumStock,
        },
      }).unwrap();
      setEditTarget(null);
    } catch (e: unknown) {
      setEditError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  const columns: ColumnDef<StockSetting>[] = [
    {
      key: "variant",
      header: t("stockSettings.variant"),
      cell: (r) => r.variant?.variantName ?? r.variantId,
    },
    {
      key: "dept",
      header: t("stockSettings.department"),
      cell: (r) => r.department?.name ?? r.departmentId,
    },
    {
      key: "min",
      header: t("stockSettings.min"),
      cell: (r) => r.minimumStock ?? "—",
    },
    {
      key: "max",
      header: t("stockSettings.max"),
      cell: (r) => r.maximumStock ?? "—",
    },
    {
      key: "active",
      header: t("stockSettings.active"),
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={r.isActive}
            onCheckedChange={(v) => handleStatusToggle(r.id, v)}
            onClick={(e) => e.stopPropagation()}
            disabled={togglingId === r.id}
          />
          {togglingId === r.id && (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(r);
          }}
        >
          <Pencil className="size-4" />
        </Button>
      ),
    },
  ];

  if (deptLoading) {
    return (
      <div className="p-6">
        <AppPageHeader title={t("stockSettings.title")} />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (noAccess) {
    return (
      <div className="p-6">
        <AppPageHeader title={t("stockSettings.title")} />
        <AppEmptyState
          title={t("common:forbidden")}
          description={t("stockSettings.noAccess", {
            defaultValue:
              "Not assigned to an eligible department for this page.",
          })}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <AppPageHeader
        title={t("stockSettings.title")}
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="size-4 mr-2" />
            {t("stockSettings.create")}
          </Button>
        }
      />

      <div className="flex gap-3 mb-4 flex-wrap items-center">
        {canFilterByDepartment ? (
          <Select
            value={deptFilter || "__all__"}
            onValueChange={(v) => {
              setDeptFilter(v === "__all__" ? "" : v);
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
            context="stock-settings"
            value={deptFilter}
            onChange={(id) => {
              setDeptFilter(id);
              setPage(1);
            }}
          />
        )}
        <Select
          value={variantFilter || "__all__"}
          onValueChange={(v) => {
            setVariantFilter(v === "__all__" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder={t("stockSettings.allVariants")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("common:filters.all")}</SelectItem>
            {variants.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.variantName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
      {/* Create Dialog */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setCreateResults(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("stockSettings.newTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label required>{t("stockSettings.department")}</Label>
              {scoped ? (
                <DepartmentSelector
                  context="stock-settings"
                  value={form.departmentId}
                  onChange={(id) =>
                    setForm((f) => ({ ...f, departmentId: id }))
                  }
                />
              ) : (
                <Select
                  value={form.departmentId}
                  onValueChange={(v) => setForm({ ...form, departmentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("stockSettings.selectDepartment")}
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

            <div className="space-y-2">
              <Label required>{t("stockSettings.items")}</Label>
              {form.items.map((item, i) => {
                const result = createResults?.find(
                  (r) => r.variantId === item.variantId,
                );
                return (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-muted/50"
                  >
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs">
                        {t("stockSettings.variant")}
                      </Label>
                      <Select
                        value={item.variantId}
                        onValueChange={(v) => updateFormItem(i, "variantId", v)}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("stockSettings.selectVariant")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {variants.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.variantName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {t("stockSettings.min")}
                      </Label>
                      <Input
                        type="number"
                        value={item.minimumStock}
                        onChange={(e) =>
                          updateFormItem(
                            i,
                            "minimumStock",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {t("stockSettings.max")}
                      </Label>
                      <Input
                        type="number"
                        value={item.maximumStock}
                        onChange={(e) =>
                          updateFormItem(
                            i,
                            "maximumStock",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div className="flex items-end justify-between gap-1">
                      {form.items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFormItem(i)}
                        >
                          <Trash2 className="size-4 text-danger" />
                        </Button>
                      )}
                    </div>
                    {result && !result.success && (
                      <p className="sm:col-span-5 text-xs text-danger">
                        {result.error}
                      </p>
                    )}
                    {result && result.success && (
                      <p className="sm:col-span-5 text-xs text-success">
                        {t("stockSettings.itemCreated")}
                      </p>
                    )}
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={addFormItem}>
                <PlusCircle className="size-4" /> {t("stockSettings.addItem")}
              </Button>
            </div>

            {formError && <p className="text-xs text-danger">{formError}</p>}
            {createResults && (
              <p className="text-xs text-muted-foreground">
                {t("stockSettings.createSummary", {
                  created: createResults.filter((r) => r.success).length,
                  failed: createResults.filter((r) => !r.success).length,
                })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                creating ||
                !form.departmentId ||
                form.items.every((i) => !i.variantId)
              }
            >
              {t("common:actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("stockSettings.editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {editTarget?.variant?.variantName} —{" "}
              {editTarget?.department?.name}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t("stockSettings.min")}</Label>
                <Input
                  type="number"
                  value={editForm.minimumStock}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      minimumStock: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{t("stockSettings.max")}</Label>
                <Input
                  type="number"
                  value={editForm.maximumStock}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      maximumStock: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            {editError && <p className="text-xs text-danger">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleEditSave} loading={updating}>
              {t("common:actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
