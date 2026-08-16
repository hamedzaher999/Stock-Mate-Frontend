import AppErrorState from "@/components/shared/AppErrorState";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useGetRefillRequestsQuery,
  useCreateRefillRequestMutation,
} from "@/api/refills.api";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";
import DepartmentSelector, {
  useDepartmentSelector,
} from "@/components/shared/DepartmentSelector";
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
import { PlusCircle, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import type { RefillRequest } from "@/lib/apiTypes";
import { useGetStockSettingsQuery } from "@/api/inventory.api";
const REQUEST_STATUSES = [
  "draft",
  "pending_hospital_approval",
  "pending_manager_approval",
  "hospital_rejected",
  "manager_rejected",
  "preparing",
  "complete",
  "partially_complete",
  "cancelled",
] as const;
export default function RefillRequestsPage() {
  const { t } = useTranslation("refills");
  const navigate = useNavigate();
  const canCreate = usePermission(PERMISSIONS.CREATE_DEPARTMENT_REFILL_REQUEST);
  const [deptId, setDeptId] = useState("");
  const { resolved } = useDepartmentSelector("refill-requests");

  useEffect(() => {
    if (resolved && !deptId) setDeptId(resolved.id);
  }, [resolved, deptId]);
  useEffect(() => {
    setItems([{ variantId: "", requestedQuantity: "" }]);
  }, [deptId]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { variantId: "", requestedQuantity: "" },
  ]);
  const [priority, setPriority] = useState("normal");
  const [requestType, setRequestType] = useState("normal");
  const [frequencyInterval, setFrequencyInterval] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetRefillRequestsQuery({
      page,
      limit: 20,
      ...(status ? { status } : {}),
    });
  const { data: stockSettingsData } = useGetStockSettingsQuery(
    {
      departmentId: deptId,
      isActive: true,
      limit: 200,
    } as { departmentId: string; isActive: boolean; limit: number },
    { skip: !deptId },
  );
  const stockSettingVariants = (stockSettingsData?.data?.items ?? [])
    .map((s) => s.variant)
    .filter((v): v is { id: string; variantName: string; sku: string } => !!v);
  const [createRequest, { isLoading: creating }] =
    useCreateRefillRequestMutation();

  async function handleCreate() {
    if (items.some((i) => !i.variantId || !i.requestedQuantity)) {
      setFormError(t("requests.allItemsComplete"));
      return;
    }
    if (requestType !== "normal" && !frequencyInterval) {
      setFormError(t("requests.frequencyRequired"));
      return;
    }
    setFormError(null);
    try {
      const res = await createRequest({
        items: items.map((i) => ({
          variantId: i.variantId,
          requestedQuantity: parseInt(i.requestedQuantity),
        })),
        priority: priority as "normal" | "urgent",
        requestType: requestType as "normal" | "daily" | "weekly" | "monthly",
        ...(requestType !== "normal" && frequencyInterval
          ? { frequencyInterval: parseInt(frequencyInterval) }
          : {}),
        ...(notes ? { notes } : {}),
      }).unwrap();
      setOpen(false);
      navigate(`/refills/requests/${res.data.id}`);
    } catch (e: unknown) {
      setFormError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  const columns: ColumnDef<RefillRequest>[] = [
    {
      key: "num",
      header: t("requests.number"),
      cell: (r) => <code className="text-xs font-mono">{r.requestNumber}</code>,
    },
    {
      key: "dept",
      header: t("requests.department"),
      cell: (r) => r.department?.name,
    },
    {
      key: "priority",
      header: t("requests.priority"),
      cell: (r) => <StatusBadge status={r.priority} domain="priority" />,
    },
    { key: "type", header: t("requests.type"), cell: (r) => r.requestType },
    {
      key: "items",
      header: t("requests.items"),
      cell: (r) => r.items?.length ?? 0,
    },
    {
      key: "by",
      header: t("requests.requestedBy"),
      cell: (r) => r.requestedBy?.fullName,
    },
    {
      key: "date",
      header: t("requests.date"),
      cell: (r) => formatDate(r.createdAt),
    },
    {
      key: "status",
      header: t("requests.status"),
      cell: (r) => <StatusBadge status={r.status} domain="refillRequest" />,
    },
  ];

  return (
    <div>
      <AppPageHeader
        title={t("requests.title")}
        actions={
          canCreate && (
            <Button onClick={() => setOpen(true)}>{t("requests.new")}</Button>
          )
        }
      />
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <DepartmentSelector
          context="refill-requests"
          value={deptId}
          onChange={(id) => setDeptId(id)}
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder={t("common:filters.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("common:filters.all")}</SelectItem>
            {REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status:refillRequest.${s}`, {
                  defaultValue: s.replace(/_/g, " "),
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            onRowClick={(r) => navigate(`/refills/requests/${r.id}`)}
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("requests.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {deptId && (
              <p className="text-sm text-muted-foreground">
                {t("requests.department")}:{" "}
                <DepartmentSelector
                  context="refill-requests"
                  value={deptId}
                  onChange={(id) => setDeptId(id)}
                />
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("requests.priority")}</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">
                      {t("status:priority.normal")}
                    </SelectItem>
                    <SelectItem value="urgent">
                      {t("status:priority.urgent")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("requests.type")}</Label>
                <Select
                  value={requestType}
                  onValueChange={(v) => {
                    setRequestType(v);
                    if (v === "normal") setFrequencyInterval("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">
                      {t("status:refillType.normal")}
                    </SelectItem>
                    <SelectItem value="daily">
                      {t("status:refillType.daily")}
                    </SelectItem>
                    <SelectItem value="weekly">
                      {t("status:refillType.weekly")}
                    </SelectItem>
                    <SelectItem value="monthly">
                      {t("status:refillType.monthly")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {requestType !== "normal" && (
                <div className="col-span-2 space-y-1.5">
                  <Label required>{t("requests.frequencyInterval")}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={frequencyInterval}
                    onChange={(e) => setFrequencyInterval(e.target.value)}
                    placeholder="e.g. 1"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("requests.items")}</Label>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Select
                      value={item.variantId}
                      onValueChange={(v) =>
                        setItems((p) =>
                          p.map((x, idx) =>
                            idx === i ? { ...x, variantId: v } : x,
                          ),
                        )
                      }
                      disabled={!deptId}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            deptId
                              ? t("requests.selectMaterial")
                              : t("requests.selectDepartmentFirst", {
                                  defaultValue: "Select a department first",
                                })
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {stockSettingVariants.length === 0 && deptId && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            {t("requests.noConfiguredMaterials", {
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
                  <div className="w-24 space-y-1">
                    <Input
                      type="number"
                      min={1}
                      placeholder={t("requests.qty")}
                      value={item.requestedQuantity}
                      onChange={(e) =>
                        setItems((p) =>
                          p.map((x, idx) =>
                            idx === i
                              ? { ...x, requestedQuantity: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setItems((p) => p.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setItems((p) => [
                    ...p,
                    { variantId: "", requestedQuantity: "" },
                  ])
                }
              >
                <PlusCircle className="size-4" /> {t("requests.addItem")}
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label>{t("requests.notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              {t("requests.createAsDraft")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
