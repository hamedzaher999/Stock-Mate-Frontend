import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useGetPrescriptionByIdQuery,
  useCancelPrescriptionMutation,
} from "@/api/prescriptions.api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import { Button } from "@/components/primitive/button";
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import { Skeleton } from "@/components/primitive/skeleton";
import StatusBadge from "@/components/shared/StatusBadge";
import AppPageHeader from "@/components/shared/AppPageHeader";
import { usePermission } from "@/hooks/usePermission";
import { useCurrentUser } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/formatters";

export default function PrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation("prescriptions");
  const currentUser = useCurrentUser();
  const canCancel = usePermission(PERMISSIONS.CANCEL_PRESCRIPTION);
  const canManageAll = usePermission(PERMISSIONS.MANAGE_ALL_PRESCRIPTIONS);

  const { data, isLoading } = useGetPrescriptionByIdQuery(id!);
  const [cancelRx, { isLoading: cancelling }] = useCancelPrescriptionMutation();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const rx = data?.data;

  const isOwner = currentUser?.id === rx?.doctorId;
  const canCancelThis = (canCancel && isOwner) || canManageAll;

  async function handleCancel() {
    if (!id || !cancelReason) return;
    await cancelRx({ id, reason: cancelReason }).unwrap();
    setCancelOpen(false);
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!rx) return <p className="text-muted-foreground">{t("notFound")}</p>;

  const cycleProgress = rx.totalCycles
    ? (rx.currentCycleNumber ?? 0) / rx.totalCycles
    : null;

  return (
    <div>
      <AppPageHeader
        title={`${t("detail")} – ${rx.patient?.fullName}`}
        subtitle={t("prescribedBy", { name: rx.doctor?.fullName })}
        actions={
          canCancelThis &&
          rx.status === "active" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelOpen(true)}
            >
              {t("cancel")}
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Cycle progress */}
          {rx.totalCycles && (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    {t("currentCycle")} {rx.currentCycleNumber}/{rx.totalCycles}
                  </p>
                  {rx.currentCycleStatus && (
                    <StatusBadge
                      status={rx.currentCycleStatus}
                      domain="prescriptionCycle"
                    />
                  )}
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(cycleProgress ?? 0) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatDate(rx.currentCycleStart)}</span>
                  <span>{formatDate(rx.currentCycleEnd)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>{t("items")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rx.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-muted/50 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {item.variant?.variantName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.dosage} · {item.frequency}
                    </p>
                    {item.durationDays && (
                      <p className="text-xs text-muted-foreground">
                        {item.durationDays} {t("days")}
                      </p>
                    )}
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-medium">
                      {item.dispensedQuantity}/{item.prescribedQuantity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("dispensed")}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("status")}</span>{" "}
                <StatusBadge status={rx.status} domain="prescription" />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("startDate")}</span>{" "}
                <span>{formatDate(rx.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("totalCycles")}
                </span>{" "}
                <span>{rx.totalCycles ?? t("indefinite")}</span>
              </div>
              {rx.frequencyUnit && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("frequency")}
                  </span>{" "}
                  <span>
                    {t("everyN", {
                      n: rx.frequencyInterval,
                      unit: rx.frequencyUnit,
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cancel")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label required>{t("cancelReason")}</Label>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              loading={cancelling}
              disabled={!cancelReason}
            >
              {t("confirmCancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
