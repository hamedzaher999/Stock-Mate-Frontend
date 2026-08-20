import QuantityMismatchDialog, {
  getQuantityMismatches,
  MismatchDiff,
} from "@/components/shared/QuantityMisMatchDialog";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle } from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppErrorState from "@/components/shared/AppErrorState";
import AppEmptyState from "@/components/shared/AppEmptyState";
import AppPermissionGate from "@/components/shared/AppPermissionGate";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import { Button } from "@/components/primitive/button";
import { Badge } from "@/components/primitive/badge";
import { Label } from "@/components/primitive/label";
import { Input } from "@/components/primitive/input";
import { Textarea } from "@/components/primitive/textarea";
import { Skeleton } from "@/components/primitive/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/primitive/dialog";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate, formatDateTime } from "@/lib/formatters";
import {
  useGetDisposalTransferByIdQuery,
  useConfirmDisposalTransferMutation,
  useCancelDisposalTransferMutation,
} from "@/api/disposal.api";

export default function DisposalTransferDetailPage() {
  const { t } = useTranslation("disposal");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useGetDisposalTransferByIdQuery(
    id!,
  );
  const transfer = data?.data;

  usePermission(PERMISSIONS.MANAGE_DISPOSAL_TRANSFERS);

  const [confirmTransfer, { isLoading: confirming }] =
    useConfirmDisposalTransferMutation();
  const [cancelTransfer, { isLoading: cancelling }] =
    useCancelDisposalTransferMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmedQuantities, setConfirmedQuantities] = useState<
    Record<string, number>
  >({});
  const [confirmNotes, setConfirmNotes] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [mismatchOpen, setMismatchOpen] = useState(false);
  const [pendingMismatches, setPendingMismatches] = useState<MismatchDiff[]>(
    [],
  );
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  if (isLoading)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (isError)
    return (
      <div className="p-6">
        <AppErrorState onRetry={() => refetch()} />
      </div>
    );
  if (!transfer)
    return (
      <div className="p-6">
        <AppEmptyState
          title={t("common:actions.notFound")}
          description={t("transfers.notFoundDescription", {
            defaultValue:
              "This disposal transfer may have been removed or you don't have access to it.",
          })}
        />
      </div>
    );

  const isPending = transfer.status === "initiated";

  function openConfirm() {
    const qty: Record<string, number> = {};
    transfer!.items?.forEach((item) => {
      qty[item.id] = Number(item.shippedQuantity);
    });
    setConfirmedQuantities(qty);
    setConfirmNotes("");
    setConfirmError(null);
    setConfirmOpen(true);
  }

  async function submitConfirm() {
    setConfirmError(null);
    try {
      await confirmTransfer({
        id: transfer!.id,
        notes: confirmNotes || undefined,
        items: transfer!.items.map((item) => ({
          disposalTransferItemId: item.id,
          confirmedQuantity:
            confirmedQuantities[item.id] ?? Number(item.shippedQuantity),
        })),
      }).unwrap();
      setConfirmOpen(false);
      setMismatchOpen(false);
    } catch (e: unknown) {
      setConfirmError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  function handleConfirm() {
    setConfirmError(null);
    const mismatches = getQuantityMismatches(
      transfer!.items.map((item) => ({
        name: item.variant?.variantName ?? "—",
        expected: Number(item.shippedQuantity),
        entered: confirmedQuantities[item.id] ?? Number(item.shippedQuantity),
      })),
    );
    if (mismatches.length > 0) {
      setPendingMismatches(mismatches);
      setMismatchOpen(true);
      return;
    }
    submitConfirm();
  }

  async function handleCancel() {
    await cancelTransfer({
      id: transfer!.id,
      reason: cancelReason || undefined,
    }).unwrap();
    setCancelOpen(false);
    setCancelReason("");
  }

  return (
    <div className="p-6 space-y-6">
      <AppPageHeader
        title={t("transfers.detail.title", { id: transfer.id.slice(0, 8) })}
        subtitle={formatDateTime(transfer.initiatedAt)}
        actions={
          <StatusBadge status={transfer.status} domain="disposalTransfer" />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("transfers.detail.items")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("transfers.detail.material")}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("transfers.detail.source")}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("transfers.detail.batch")}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("transfers.detail.shippedQty")}
                      </th>
                      {transfer.status !== "initiated" && (
                        <>
                          <th className="px-3 py-2 text-start font-medium">
                            {t("transfers.detail.confirmedQty")}
                          </th>
                          <th className="px-3 py-2 text-start font-medium">
                            {t("transfers.detail.discrepancy")}
                          </th>
                        </>
                      )}
                      <th className="px-3 py-2 text-start font-medium">
                        {t("transfers.detail.expDate")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfer.items?.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2">
                          {item.variant?.variantName ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={
                              item.sourceType === "adjustment"
                                ? "danger"
                                : "warning"
                            }
                          >
                            {t(`transfers.source.${item.sourceType}`, {
                              defaultValue: item.sourceType,
                            })}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <code className="text-xs bg-muted px-1 rounded">
                            {item.batch?.batchNumber}
                          </code>
                        </td>
                        <td className="px-3 py-2">{item.shippedQuantity}</td>
                        {transfer.status !== "initiated" && (
                          <>
                            <td className="px-3 py-2">
                              {item.confirmedQuantity ?? "—"}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={
                                  item.quantityDiscrepancy
                                    ? "text-danger font-medium"
                                    : "text-muted-foreground"
                                }
                              >
                                {item.quantityDiscrepancy ?? 0}
                              </span>
                            </td>
                          </>
                        )}
                        <td className="px-3 py-2">
                          {formatDate(item.batch?.expirationDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {transfer.notes && (
            <p className="text-sm text-muted-foreground">
              {t("transfers.detail.notes")}: {transfer.notes}
            </p>
          )}

          {transfer.status === "cancelled" && transfer.cancelReason && (
            <Card className="border-danger/30 bg-danger/5">
              <CardContent className="p-4">
                <p className="text-xs text-danger font-medium uppercase tracking-wide">
                  {t("transfers.detail.cancelReason")}
                </p>
                <p className="text-sm mt-1">{transfer.cancelReason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("transfers.detail.department")}
                </span>
                <span>{transfer.department?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("transfers.detail.initiatedBy")}
                </span>
                <span>{transfer.initiatedBy?.fullName}</span>
              </div>
              {transfer.confirmedBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("transfers.detail.confirmedBy")}
                  </span>
                  <span>{transfer.confirmedBy.fullName}</span>
                </div>
              )}
              {transfer.confirmedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("transfers.detail.confirmedAt")}
                  </span>
                  <span>{formatDateTime(transfer.confirmedAt)}</span>
                </div>
              )}
              {transfer.cancelledBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("transfers.detail.cancelledBy")}
                  </span>
                  <span>{transfer.cancelledBy.fullName}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <AppPermissionGate permission={PERMISSIONS.MANAGE_DISPOSAL_TRANSFERS}>
          {isPending && (
            <Button onClick={openConfirm} disabled={confirming}>
              <CheckCircle className="size-4 mr-2" />
              {t("transfers.detail.confirm")}
            </Button>
          )}
          {isPending && (
            <Button
              variant="destructive"
              onClick={() => setCancelOpen(true)}
              disabled={cancelling}
            >
              <XCircle className="size-4 mr-2" />
              {t("transfers.detail.cancel")}
            </Button>
          )}
        </AppPermissionGate>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          {t("common:actions.back")}
        </Button>
      </div>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("transfers.detail.confirmTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <p className="text-xs text-muted-foreground bg-info/10 rounded-xl px-3 py-2">
              {t("transfers.detail.confirmHint")}
            </p>
            {transfer.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {item.variant?.variantName ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("transfers.detail.shipped")}: {item.shippedQuantity}
                  </p>
                </div>
                <div className="w-32">
                  <Label className="text-xs">
                    {t("transfers.detail.confirmedQty")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={item.shippedQuantity}
                    step="any"
                    value={confirmedQuantities[item.id] ?? item.shippedQuantity}
                    onChange={(e) =>
                      setConfirmedQuantities((prev) => ({
                        ...prev,
                        [item.id]: Math.min(
                          Number(e.target.value),
                          item.shippedQuantity,
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>{t("transfers.detail.notes")}</Label>
              <Input
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
              />
            </div>
            {confirmError && (
              <p className="text-xs text-danger">{confirmError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleConfirm} loading={confirming}>
              {t("transfers.detail.confirmBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <QuantityMismatchDialog
        open={mismatchOpen}
        onOpenChange={setMismatchOpen}
        mismatches={pendingMismatches}
        loading={confirming}
        onConfirm={submitConfirm}
      />

      {/* Cancel dialog */}
      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transfers.detail.cancelTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{t("transfers.detail.cancelReason")}</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder={t("transfers.detail.cancelReasonPlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              {t("common:actions.back")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              loading={cancelling}
            >
              {t("transfers.detail.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
