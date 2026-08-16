import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle } from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppPermissionGate from "@/components/shared/AppPermissionGate";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/primitive/card";
import { Button } from "@/components/primitive/button";
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import { Skeleton } from "@/components/primitive/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { PERMISSIONS } from "@/lib/permissions";
import { usePermission } from "@/hooks/usePermission";
import {
  useGetDeliveryByIdQuery,
  useConfirmDeliveryMutation,
  useGetRefillRequestByIdQuery,
} from "@/api/refills.api";
import AppEmptyState from "@/components/shared/AppEmptyState";
import AppErrorState from "@/components/shared/AppErrorState";
export default function DeliveryDetailPage() {
  const { t } = useTranslation("refills");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useGetDeliveryByIdQuery(id!);
  const delivery = data?.data;

  const {
    data: requestData,
    isLoading: requestLoading,
    isFetching: requestFetching,
  } = useGetRefillRequestByIdQuery(delivery?.refillRequestId ?? "", {
    skip: !delivery?.refillRequestId,
  });
  const request = requestData?.data;
  const requestBusy = requestLoading || requestFetching;

  const [confirmDelivery, { isLoading: confirming }] =
    useConfirmDeliveryMutation();

  const canConfirm = usePermission(PERMISSIONS.CONFIRM_DEPARTMENT_DELIVERY);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receivedQuantities, setReceivedQuantities] = useState<
    Record<string, number>
  >({});
  const [confirmNotes, setConfirmNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

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
  if (!delivery)
    return (
      <div className="p-6">
        <AppEmptyState
          title={t("common:actions.notFound")}
          description={t("deliveries.notFoundDescription", {
            defaultValue:
              "This delivery may have been removed or you don't have access to it.",
          })}
        />
      </div>
    );

  const isPending = !delivery.confirmedAt;

  function openConfirm() {
    const qty: Record<string, number> = {};
    delivery!.items?.forEach((item) => {
      qty[item.id] = Number(item.shippedQuantity);
    });
    setReceivedQuantities(qty);
    setConfirmNotes("");
    setError(null);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setError(null);
    try {
      await confirmDelivery({
        id: delivery!.id,
        notes: confirmNotes || undefined,
        items: delivery!.items.map((item) => ({
          deliveryItemId: item.id,
          receivedQuantity:
            receivedQuantities[item.id] ?? Number(item.shippedQuantity),
        })),
      }).unwrap();
      setConfirmOpen(false);
    } catch (e: unknown) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  return (
    <div className="p-6 space-y-6">
      <AppPageHeader
        title={t("deliveries.detail.title", { id: delivery.id.slice(0, 8) })}
        subtitle={formatDateTime(delivery.deliveredAt)}
        actions={
          <StatusBadge
            status={delivery.confirmedAt ? "confirmed" : "pending"}
            domain="delivery"
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("deliveries.detail.items")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("deliveries.detail.material")}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("deliveries.detail.batch")}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("deliveries.detail.shippedQty")}
                      </th>
                      {delivery.confirmedAt && (
                        <>
                          <th className="px-3 py-2 text-start font-medium">
                            {t("deliveries.detail.receivedQty")}
                          </th>
                          <th className="px-3 py-2 text-start font-medium">
                            {t("deliveries.detail.discrepancy")}
                          </th>
                        </>
                      )}
                      <th className="px-3 py-2 text-start font-medium">
                        {t("deliveries.detail.expDate")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {delivery.items?.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2">
                          {item.batch?.variant?.variantName ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <code className="text-xs bg-muted px-1 rounded">
                            {item.batch?.batchNumber}
                          </code>
                        </td>
                        <td className="px-3 py-2">{item.shippedQuantity}</td>
                        {delivery.confirmedAt && (
                          <>
                            <td className="px-3 py-2">
                              {item.receivedQuantity ?? "—"}
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

          {delivery.notes && (
            <p className="text-sm text-muted-foreground">
              {t("deliveries.detail.notes")}: {delivery.notes}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {t("deliveries.detail.refillRequest")}
                </span>
                {requestBusy ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <button
                    className="text-primary hover:underline font-mono text-xs"
                    onClick={() =>
                      navigate(`/refills/requests/${delivery.refillRequestId}`)
                    }
                  >
                    {request?.requestNumber ??
                      delivery.refillRequestId.slice(0, 8)}
                  </button>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {t("deliveries.detail.department")}
                </span>
                {requestBusy ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span>{request?.department?.name ?? "—"}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("deliveries.detail.batchType")}
                </span>
                <StatusBadge
                  status={delivery.type ?? "batch"}
                  domain="batchType"
                />
              </div>
              {delivery.confirmedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("deliveries.detail.confirmedAt")}
                  </span>
                  <span>{formatDateTime(delivery.confirmedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <AppPermissionGate permission={PERMISSIONS.CONFIRM_DEPARTMENT_DELIVERY}>
          {isPending && canConfirm && (
            <Button onClick={openConfirm} disabled={confirming}>
              <CheckCircle className="size-4 mr-2" />
              {t("deliveries.detail.confirm")}
            </Button>
          )}
        </AppPermissionGate>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          {t("common:actions.back")}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("deliveries.detail.confirmTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <p className="text-xs text-muted-foreground bg-info/10 rounded-xl px-3 py-2">
              {t("deliveries.detail.confirmHint")}
            </p>
            {delivery.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {item.batch?.variant?.variantName ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("deliveries.detail.shipped")}: {item.shippedQuantity}
                  </p>
                </div>
                <div className="w-32">
                  <Label className="text-xs">
                    {t("deliveries.detail.received")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={receivedQuantities[item.id] ?? item.shippedQuantity}
                    onChange={(e) =>
                      setReceivedQuantities((prev) => ({
                        ...prev,
                        [item.id]: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>{t("deliveries.detail.notes")}</Label>
              <Input
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
              />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleConfirm} loading={confirming}>
              {t("deliveries.detail.confirmBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
