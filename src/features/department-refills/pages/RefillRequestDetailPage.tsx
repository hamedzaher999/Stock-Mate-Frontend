import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { CheckCircle, XCircle, Loader2, Truck } from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/primitive/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import { Textarea } from "@/components/primitive/textarea";
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
import { Skeleton } from "@/components/primitive/skeleton";
import {
  useGetRefillRequestByIdQuery,
  useSubmitRefillRequestMutation,
  useHospitalApproveRefillMutation,
  useHospitalRejectRefillMutation,
  useManagerApproveRefillMutation,
  useManagerRejectRefillMutation,
  useCompleteRefillRequestMutation,
  useCancelRefillRequestMutation,
  useCreateDeliveryMutation,
  useGetDeliveriesQuery,
} from "@/api/refills.api";
import { usePermission, useCurrentUser } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { useTranslation } from "react-i18next";
import { useGetBatchesQuery } from "@/api/inventory.api";
import { useGetDepartmentsQuery } from "@/api/departments.api";
const STEPS = [
  "draft",
  "pending_hospital_approval",
  "pending_manager_approval",
  "preparing",
  "complete",
];

const SHIPPABLE_STATUSES = ["preparing", "partially_complete"];

interface DeliveryLine {
  refillItemId: string;
  batchId: string;
  shippedQuantity: string;
}

export default function RefillRequestDetailPage() {
  const { t } = useTranslation("refills");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useGetRefillRequestByIdQuery(id!);
  const req = data?.data;

  const canHospitalApprove = usePermission(
    PERMISSIONS.APPROVE_DEPARTMENT_REFILL_REQUEST_HOSPITAL,
  );
  const canManagerApprove = usePermission(
    PERMISSIONS.APPROVE_DEPARTMENT_REFILL_REQUEST_MANAGER,
  );
  const canPrepareDelivery = usePermission(
    PERMISSIONS.PREPARE_DEPARTMENT_REFILL,
  );
  const currentUser = useCurrentUser();

  const [submit, { isLoading: submitting }] = useSubmitRefillRequestMutation();
  const [hospitalApprove, { isLoading: hospitalApproving }] =
    useHospitalApproveRefillMutation();
  const [hospitalReject] = useHospitalRejectRefillMutation();
  const [managerApprove, { isLoading: managerApproving }] =
    useManagerApproveRefillMutation();
  const [managerReject] = useManagerRejectRefillMutation();
  const [complete] = useCompleteRefillRequestMutation();
  const [cancel] = useCancelRefillRequestMutation();

  const [hospitalRejectOpen, setHospitalRejectOpen] = useState(false);
  const [hospitalRejectReason, setHospitalRejectReason] = useState("");

  const [managerApproveOpen, setManagerApproveOpen] = useState(false);
  const [approvedQuantities, setApprovedQuantities] = useState<
    Record<string, number>
  >({});
  const [approvalPolicy, setApprovalPolicy] = useState<
    "auto_approved" | "approval_required_each_cycle"
  >("auto_approved");

  const [managerRejectOpen, setManagerRejectOpen] = useState(false);
  const [managerRejectReason, setManagerRejectReason] = useState("");

  // ── Ship Delivery ──────────────────────────────────────────
  const [shipOpen, setShipOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"batch" | "final_batch">(
    "batch",
  );
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveryLines, setDeliveryLines] = useState<DeliveryLine[]>([]);
  const [shipError, setShipError] = useState<string | null>(null);

  const { data: warehouseData } = useGetDepartmentsQuery(
    { type: "central_warehouse", limit: 1 },
    { skip: !shipOpen },
  );
  const warehouse = warehouseData?.data?.items?.[0];

  const {
    data: deliveriesData,
    isLoading: deliveriesLoading,
    isFetching: deliveriesFetching,
  } = useGetDeliveriesQuery({ refillRequestId: id, limit: 50 }, { skip: !id });
  const deliveries = deliveriesData?.data?.items ?? [];

  const [createDelivery, { isLoading: shipping }] = useCreateDeliveryMutation();

  // Items still awaiting shipment (approved, not fully delivered)
  const shippableItems = (req?.items ?? []).filter(
    (item) =>
      item.approvedQuantity != null &&
      Number(item.deliveredQuantity ?? 0) < Number(item.approvedQuantity),
  );

  function openShipDialog() {
    setDeliveryType("batch");
    setDeliveryNotes("");
    setDeliveryLines(
      shippableItems.map((item) => ({
        refillItemId: item.id,
        batchId: "",
        shippedQuantity: "",
      })),
    );
    setShipError(null);
    setShipOpen(true);
  }

  function updateDeliveryLine(
    i: number,
    field: keyof DeliveryLine,
    value: string,
  ) {
    setDeliveryLines((prev) =>
      prev.map((line, idx) => (idx === i ? { ...line, [field]: value } : line)),
    );
  }

  async function handleShip() {
    setShipError(null);
    if (!warehouse) {
      setShipError(t("requests.warehouseNotFound"));
      return;
    }
    const activeLines = deliveryLines.filter(
      (l) => l.batchId && l.shippedQuantity,
    );
    if (activeLines.length === 0) {
      setShipError(t("requests.atLeastOneLineRequired"));
      return;
    }
    try {
      await createDelivery({
        refillRequestId: req!.id,
        type: deliveryType,
        ...(deliveryNotes ? { notes: deliveryNotes } : {}),
        items: activeLines.map((l) => ({
          refillItemId: l.refillItemId,
          batchId: l.batchId,
          shippedQuantity: Number(l.shippedQuantity),
        })),
      }).unwrap();
      setShipOpen(false);
    } catch (e: unknown) {
      setShipError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  function BatchPickerForLine({
    line,
    index,
  }: {
    line: DeliveryLine;
    index: number;
  }) {
    const item = shippableItems.find((i) => i.id === line.refillItemId);
    const {
      data: batchData,
      isLoading: batchesLoading,
      isFetching: batchesFetching,
    } = useGetBatchesQuery(
      {
        variantId: item?.variantId,
        departmentId: warehouse?.id,
        limit: 50,
      } as { variantId: string; departmentId: string; limit: number },
      { skip: !item?.variantId || !warehouse?.id },
    );
    const batches = batchData?.data?.items ?? [];
    const remaining = item
      ? Number(item.approvedQuantity ?? 0) - Number(item.deliveredQuantity ?? 0)
      : 0;
    const batchesBusy = batchesLoading || batchesFetching;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-muted/50">
        <div className="sm:col-span-2">
          <p className="text-sm font-medium">
            {item?.variant?.variantName ?? item?.variantId}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("requests.stillNeeded", { remaining })}
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">{t("requests.warehouseBatch")}</Label>
            {batchesBusy && (
              <Loader2 className="size-3 animate-spin text-muted-foreground" />
            )}
          </div>
          <Select
            value={line.batchId}
            onValueChange={(v) => updateDeliveryLine(index, "batchId", v)}
            disabled={batchesLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  batchesLoading
                    ? t("requests.loadingBatches", {
                        defaultValue: "Loading batches…",
                      })
                    : t("requests.selectBatch")
                }
              />
            </SelectTrigger>
            <SelectContent>
              {!batchesLoading && batches.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {t("requests.noBatchesAvailable", {
                    defaultValue: "No batches available.",
                  })}
                </div>
              )}
              {batches.map((b) => {
                const qtyAtWarehouse =
                  b.batchStocks?.find((s) => s.departmentId === warehouse?.id)
                    ?.quantity ?? 0;
                return (
                  <SelectItem key={b.id} value={b.id}>
                    {b.batchNumber} (
                    {t("requests.qtyAvailable", { qty: qtyAtWarehouse })})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("requests.shippedQty")}</Label>
          <Input
            type="number"
            min={0.01}
            step="any"
            value={line.shippedQuantity}
            onChange={(e) =>
              updateDeliveryLine(index, "shippedQuantity", e.target.value)
            }
          />
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!req)
    return (
      <div className="p-6 text-muted-foreground">{t("requests.notFound")}</div>
    );

  const status = req.status;
  const owns = req.requestedById === currentUser?.id;
  const normalizedStatus = ["complete", "partially_complete"].includes(status)
    ? "complete"
    : status;
  const stepIdx = STEPS.indexOf(normalizedStatus);

  const canSubmit = status === "draft" && owns && (req.items?.length ?? 0) > 0;
  const canCancel =
    ["draft", "pending_hospital_approval", "pending_manager_approval"].includes(
      status,
    ) && owns;
  const canHospApprove =
    status === "pending_hospital_approval" && canHospitalApprove;
  const canHospReject =
    status === "pending_hospital_approval" && canHospitalApprove;
  const canMgrApprove =
    status === "pending_manager_approval" && canManagerApprove;
  const unconfirmedDeliveries = ((req as any).deliveries ?? []).some(
    (d: any) => !d.confirmedAt,
  );
  const canMgrReject =
    (status === "pending_manager_approval" ||
      (status === "preparing" &&
        (req as any).approvedById === currentUser?.id &&
        !(req as any).deliveries?.length)) &&
    canManagerApprove;
  const canManualComplete =
    status === "partially_complete" &&
    (req as any).approvedById === currentUser?.id &&
    !unconfirmedDeliveries;
  const canShip =
    SHIPPABLE_STATUSES.includes(status) &&
    canPrepareDelivery &&
    shippableItems.length > 0;

  function openManagerApprove() {
    const qty: Record<string, number> = {};
    req!.items?.forEach((item: any) => {
      qty[item.id] = item.requestedQuantity;
    });
    setApprovedQuantities(qty);
    setManagerApproveOpen(true);
  }

  async function handleManagerApprove() {
    const items = req!.items?.map((item: any) => ({
      refillItemId: item.id,
      approvedQuantity: approvedQuantities[item.id] ?? item.requestedQuantity,
    }));
    const showPolicy =
      req!.requestType !== "normal" && !req!.periodicScheduleId;
    await managerApprove({
      id: req!.id,
      items,
      ...(showPolicy ? { approvalPolicy } : {}),
    });
    setManagerApproveOpen(false);
  }

  return (
    <div className="p-6 space-y-6">
      <AppPageHeader
        title={`${t("requests.title")} ${req.requestNumber}`}
        subtitle={`${req.department?.name} – ${req.priority} ${t("requests.priorityLabel")}`}
        actions={<StatusBadge status={status} domain="refillRequest" />}
      />

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((step, i) => {
          const label =
            step === "complete"
              ? `${t("status:refillRequest.complete")} / ${t("status:refillRequest.partially_complete")}`
              : t(`status:refillRequest.${step}`, {
                  defaultValue: step.replace(/_/g, " "),
                });
          const done = i <= stepIdx;
          return (
            <div key={step} className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {i < stepIdx && <CheckCircle className="size-3" />}
                {label}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-4 shrink-0 ${i < stepIdx ? "bg-primary" : "bg-border"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Items Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-start font-medium">
                {t("requests.item")}
              </th>
              <th className="px-4 py-2 text-start font-medium">
                {t("requests.requestedQty")}
              </th>
              {req.items?.some((i: any) => i.approvedQuantity != null) && (
                <th className="px-4 py-2 text-start font-medium">
                  {t("requests.approvedQty")}
                </th>
              )}
              {req.items?.some((i: any) => i.deliveredQuantity != null) && (
                <th className="px-4 py-2 text-start font-medium">
                  {t("requests.deliveredQty")}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {req.items?.map((item: any) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-2">
                  {item.variant?.variantName ?? item.variantId}
                </td>
                <td className="px-4 py-2">{item.requestedQuantity}</td>
                {item.approvedQuantity != null && (
                  <td className="px-4 py-2">{item.approvedQuantity}</td>
                )}
                {item.deliveredQuantity != null && (
                  <td className="px-4 py-2">{item.deliveredQuantity ?? 0}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {req.notes && (
        <p className="text-sm text-muted-foreground">
          {t("requests.notes")}: {req.notes}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {t("requests.createdBy", {
          date: formatDate(req.createdAt),
          name: req.requestedBy?.fullName,
        })}
      </p>

      {/* Deliveries list */}
      {(deliveriesLoading || deliveries.length > 0 || deliveriesFetching) && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            {t("requests.deliveries")}
          </h3>
          {deliveriesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="relative">
              <div
                className={
                  deliveriesFetching
                    ? "pointer-events-none opacity-60 transition-opacity duration-150"
                    : "transition-opacity duration-150"
                }
              >
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-start font-medium">
                          {t("deliveries.deliveryId")}
                        </th>
                        <th className="px-4 py-2 text-start font-medium">
                          {t("deliveries.date")}
                        </th>
                        <th className="px-4 py-2 text-start font-medium">
                          {t("deliveries.status")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map((d) => (
                        <tr
                          key={d.id}
                          className="border-t cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            navigate(`/refills/deliveries/${d.id}`)
                          }
                        >
                          <td className="px-4 py-2">
                            <span className="font-mono text-xs">
                              {d.id.slice(0, 8)}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {formatDateTime(d.deliveredAt)}
                          </td>
                          <td className="px-4 py-2">
                            <StatusBadge
                              status={d.confirmedAt ? "confirmed" : "pending"}
                              domain="delivery"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {deliveriesFetching && (
                <div className="absolute inset-0 flex items-start justify-center pt-6">
                  <div className="flex items-center gap-2 rounded-full bg-card border border-border shadow-md px-3 py-1.5 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>
                      {t("common:table.updating", {
                        defaultValue: "Updating…",
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {canSubmit && (
          <Button onClick={() => submit(req.id)} disabled={submitting}>
            {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            {t("requests.submit")}
          </Button>
        )}
        {canHospApprove && (
          <Button
            onClick={() => hospitalApprove({ id: req.id })}
            disabled={hospitalApproving}
          >
            <CheckCircle className="size-4 mr-2" /> {t("requests.approve")}
          </Button>
        )}
        {canHospReject && (
          <Button
            variant="destructive"
            onClick={() => setHospitalRejectOpen(true)}
          >
            <XCircle className="size-4 mr-2" /> {t("requests.reject")}
          </Button>
        )}
        {canMgrApprove && (
          <Button onClick={openManagerApprove} disabled={managerApproving}>
            <CheckCircle className="size-4 mr-2" />{" "}
            {t("requests.managerApprove")}
          </Button>
        )}
        {canMgrReject && (
          <Button
            variant="destructive"
            onClick={() => setManagerRejectOpen(true)}
          >
            <XCircle className="size-4 mr-2" /> {t("requests.managerReject")}
          </Button>
        )}
        {canShip && (
          <Button onClick={openShipDialog}>
            <Truck className="size-4 mr-2" /> {t("requests.shipDelivery")}
          </Button>
        )}
        {canManualComplete && (
          <Button onClick={() => complete(req.id)}>
            {t("requests.markComplete")}
          </Button>
        )}
        {canCancel && (
          <Button variant="outline" onClick={() => cancel(req.id)}>
            {t("requests.cancelRequest")}
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate(-1)}>
          {t("common:actions.back")}
        </Button>
      </div>

      {/* Hospital Reject Dialog */}
      <Dialog open={hospitalRejectOpen} onOpenChange={setHospitalRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("requests.hospitalRejectTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t("requests.reason")}</Label>
            <Textarea
              value={hospitalRejectReason}
              onChange={(e) => setHospitalRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setHospitalRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await hospitalReject({
                  id: req.id,
                  reason: hospitalRejectReason,
                });
                setHospitalRejectOpen(false);
                setHospitalRejectReason("");
              }}
              disabled={!hospitalRejectReason}
            >
              {t("requests.rejectBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager Approve Dialog */}
      <Dialog open={managerApproveOpen} onOpenChange={setManagerApproveOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("requests.managerApproveTitle")}</DialogTitle>{" "}
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {req.items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                <p className="flex-1 text-sm">
                  {item.variant?.variantName ?? item.variantId}
                </p>
                <div className="w-32">
                  <Label className="text-xs">
                    {t("requests.qtyMax", { max: item.requestedQuantity })}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={item.requestedQuantity}
                    value={
                      approvedQuantities[item.id] ?? item.requestedQuantity
                    }
                    onChange={(e) =>
                      setApprovedQuantities((prev) => ({
                        ...prev,
                        [item.id]: Math.min(
                          Number(e.target.value),
                          item.requestedQuantity,
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
            {req.requestType !== "normal" && !req.periodicScheduleId && (
              <div className="space-y-1.5 mt-2">
                <Label>{t("requests.approvalPolicy")}</Label>
                <Select
                  value={approvalPolicy}
                  onValueChange={(v) =>
                    setApprovalPolicy(v as typeof approvalPolicy)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto_approved">
                      {t("requests.autoApproved")}
                    </SelectItem>
                    <SelectItem value="approval_required_each_cycle">
                      {t("requests.approvalEachCycle")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManagerApproveOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleManagerApprove} disabled={managerApproving}>
              {t("requests.approveBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager Reject Dialog */}
      <Dialog open={managerRejectOpen} onOpenChange={setManagerRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("requests.managerRejectTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={managerRejectReason}
              onChange={(e) => setManagerRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManagerRejectOpen(false)}
            >
              {t("common:actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await managerReject({
                  id: req.id,
                  reason: managerRejectReason,
                });
                setManagerRejectOpen(false);
                setManagerRejectReason("");
              }}
              disabled={!managerRejectReason}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ship Delivery Dialog */}
      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("requests.shipDeliveryTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {!warehouse && (
              <p className="text-xs text-muted-foreground">
                {t("requests.loadingWarehouse")}
              </p>
            )}
            <div className="space-y-1.5">
              <Label>{t("receipts.form.batchType")}</Label>
              <Select
                value={deliveryType}
                onValueChange={(v) =>
                  setDeliveryType(v as "batch" | "final_batch")
                }
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="batch">
                    {t("status:batchType.batch")}
                  </SelectItem>
                  <SelectItem value="final_batch">
                    {t("status:batchType.final_batch")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("requests.finalBatchDeliveryHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("requests.itemsToShip")}</Label>
              {deliveryLines.map((line, i) => (
                <BatchPickerForLine
                  key={line.refillItemId}
                  line={line}
                  index={i}
                />
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>{t("requests.notes")}</Label>
              <Textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={2}
              />
            </div>

            {shipError && <p className="text-xs text-danger">{shipError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleShip} loading={shipping}>
              {t("requests.shipDelivery")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
