import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
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
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import { Textarea } from "@/components/primitive/textarea";
import { Skeleton } from "@/components/primitive/skeleton";
import {
  useGetPurchaseRequestByIdQuery,
  useSubmitPurchaseRequestMutation,
  useHospitalApprovePRMutation,
  useHospitalRejectPRMutation,
  useManagerApprovePRMutation,
  useManagerRejectPRMutation,
  useCompletePurchaseRequestMutation,
  useCancelPurchaseRequestMutation,
} from "@/api/purchasing.api";
import { usePermission, useCurrentUser } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { useTranslation } from "react-i18next";
const STEPS = [
  "draft",
  "pending_hospital_approval",
  "pending_manager_approval",
  "preparing",
  "complete",
];

export default function PurchaseRequestDetailPage() {
  const { t } = useTranslation("purchasing");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useGetPurchaseRequestByIdQuery(id!);
  const req = data?.data;

  const canHospitalApprove = usePermission(
    PERMISSIONS.APPROVE_PURCHASE_REQUEST_HOSPITAL,
  );
  const canManagerApprove = usePermission(
    PERMISSIONS.APPROVE_PURCHASE_REQUEST_MANAGER,
  );
  const currentUser = useCurrentUser();

  const [submit, { isLoading: submitting }] =
    useSubmitPurchaseRequestMutation();
  const [hospitalApprove, { isLoading: hospitalApproving }] =
    useHospitalApprovePRMutation();
  const [hospitalReject] = useHospitalRejectPRMutation();
  const [managerApprove, { isLoading: managerApproving }] =
    useManagerApprovePRMutation();
  const [managerReject] = useManagerRejectPRMutation();
  const [complete] = useCompletePurchaseRequestMutation();
  const [cancel] = useCancelPurchaseRequestMutation();

  const [hospitalRejectOpen, setHospitalRejectOpen] = useState(false);
  const [hospitalRejectReason, setHospitalRejectReason] = useState("");

  const [managerApproveOpen, setManagerApproveOpen] = useState(false);
  const [approvedQuantities, setApprovedQuantities] = useState<
    Record<string, number>
  >({});

  const [managerRejectOpen, setManagerRejectOpen] = useState(false);
  const [managerRejectReason, setManagerRejectReason] = useState("");

  if (isLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!req)
    return (
      <div className="p-6 text-muted-foreground">
        {t("common:actions.notFound")}
      </div>
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
  const approvedById =
    (req as any).approvedById ?? (req as any).committeeApprovedById;
  const deliveriesExist = !!(req as any).receipts?.length;
  const canMgrReject =
    (status === "pending_manager_approval" ||
      (status === "preparing" &&
        approvedById === currentUser?.id &&
        !deliveriesExist)) &&
    canManagerApprove;
  const canManualComplete =
    status === "partially_complete" && approvedById === currentUser?.id;

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
      purchaseRequestItemId: item.id,
      approvedQuantity: Math.min(
        approvedQuantities[item.id] ?? item.requestedQuantity,
        item.requestedQuantity,
      ),
    }));
    await managerApprove({ id: req!.id, items });
    setManagerApproveOpen(false);
  }

  return (
    <div className="p-6 space-y-6">
      <AppPageHeader
        title={`${t("requests.title")} ${req.requestNumber}`}
        subtitle={`${t("requests.requestedBy")}: ${req.requestedBy?.fullName}`}
        actions={<StatusBadge status={status} domain="purchaseRequest" />}
      />

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((step, i) => {
          const label =
            step === "complete"
              ? `${t("status:purchaseRequest.complete")} / ${t("status:purchaseRequest.partially_complete")}`
              : t(`status:purchaseRequest.${step}`, {
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

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-start font-medium">
                {t("requests.variant")}
              </th>
              <th className="px-4 py-2 text-start font-medium">
                {t("requests.qty")}
              </th>
              <th className="px-4 py-2 text-start font-medium">
                {t("requests.estPrice")}
              </th>
            </tr>
          </thead>
          <tbody>
            {req.items?.map((item: any) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-2">
                  {item.variant?.variantName ?? item.variantId}
                </td>
                <td className="px-4 py-2">{item.requestedQuantity}</td>
                <td className="px-4 py-2">
                  {formatCurrency(item.estimatedPrice ?? 0)}
                </td>
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
        Created {formatDate(req.createdAt)}
      </p>

      <div className="flex gap-2 flex-wrap">
        {canSubmit && (
          <Button onClick={() => submit(req.id)} disabled={submitting}>
            {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            {t("requests.submit")}
          </Button>
        )}
        {canHospApprove && (
          <Button
            onClick={() => hospitalApprove(req.id)}
            disabled={hospitalApproving}
          >
            <CheckCircle className="size-4 mr-2" />{" "}
            {t("requests.hospitalApprove")}
          </Button>
        )}
        {canHospReject && (
          <Button
            variant="destructive"
            onClick={() => setHospitalRejectOpen(true)}
          >
            <XCircle className="size-4 mr-2" /> {t("requests.hospitalReject")}
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
        {canManualComplete && (
          <Button onClick={() => complete(req.id)}>
            {t("requests.markComplete")}
          </Button>
        )}
        {canCancel && (
          <Button variant="outline" onClick={() => cancel(req.id)}>
            {t("requests.cancel")}
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
              {t("requests.reject")}
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManagerApproveOpen(false)}
            >
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleManagerApprove} disabled={managerApproving}>
              {t("requests.approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager Reject Dialog */}
      <Dialog open={managerRejectOpen} onOpenChange={setManagerRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("requests.managerRejectTitle")}</DialogTitle>{" "}
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
              Cancel
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
    </div>
  );
}
