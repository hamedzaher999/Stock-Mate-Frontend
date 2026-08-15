import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/primitive/card";
import { Button } from "@/components/primitive/button";
import { Skeleton } from "@/components/primitive/skeleton";
import AppPageHeader from "@/components/shared/AppPageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/formatters";
import { useGetVisitByIdQuery } from "@/api/visits.api";
export default function VisitDetailPage() {
  const { t } = useTranslation("visits");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useGetVisitByIdQuery(id!);
  const visit = data?.data;

  if (isLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!visit)
    return (
      <div className="p-6 text-muted-foreground">
        {t("common:actions.notFound")}
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <AppPageHeader
        title={`${t("title")} – ${visit.patient?.fullName}`}
        subtitle={formatDateTime(visit.visitDate)}
        actions={<StatusBadge status={visit.status} domain="visit" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("clinicalNotes")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("clinicalNotes")}
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {visit.clinicalNotes ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("diagnosis")}
                </p>
                <p className="mt-1">{visit.diagnosis ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("externalMedications")}
                </p>
                <p className="mt-1 whitespace-pre-wrap">
                  {visit.externalMedications ?? "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {visit.status === "cancelled" && visit.cancelReason && (
            <Card className="border-danger/30 bg-danger/5">
              <CardContent className="p-4">
                <p className="text-xs text-danger font-medium uppercase tracking-wide">
                  {t("cancelReason", { defaultValue: "Cancel Reason" })}
                </p>
                <p className="text-sm mt-1">{visit.cancelReason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("patient")}</span>
                <button
                  className="text-primary hover:underline font-medium"
                  onClick={() => navigate(`/patients/${visit.patientId}`)}
                >
                  {visit.patient?.fullName}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("doctor")}</span>
                <span>{visit.doctor?.fullName ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("department")}</span>
                <span>{visit.department?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("visitDate")}</span>
                <span>{formatDateTime(visit.visitDate)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Button variant="ghost" onClick={() => navigate(-1)}>
        {t("common:actions.back")}
      </Button>
    </div>
  );
}
