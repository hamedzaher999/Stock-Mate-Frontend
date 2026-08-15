import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetPatientByIdQuery } from "@/api/patients.api";
import { useGetPatientHistoryQuery } from "@/api/visits.api";
import { useGetPrescriptionsQuery } from "@/api/prescriptions.api";
import { Card, CardContent } from "@/components/primitive/card";
import { useNavigate } from "react-router-dom";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/primitive/tabs";
import { Skeleton } from "@/components/primitive/skeleton";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/formatters";
import AppPageHeader from "@/components/shared/AppPageHeader";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation("patients");
  const navigate = useNavigate();
  const { data: patientData, isLoading } = useGetPatientByIdQuery(id!);
  const { data: historyData } = useGetPatientHistoryQuery(id!);
  const { data: rxData } = useGetPrescriptionsQuery({ patientId: id });

  const patient = patientData?.data;
  const history = historyData?.data as
    | {
        patient: unknown;
        departments: Array<{
          id: string;
          name: string;
          visits: Array<{
            id: string;
            visitDate: string;
            status: string;
            diagnosis?: string;
            doctor: { fullName: string };
          }>;
        }>;
      }
    | undefined;
  const prescriptions = rxData?.data?.items ?? [];

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!patient)
    return (
      <p className="text-muted-foreground">{t("common:actions.notFound")}</p>
    );

  return (
    <div>
      <AppPageHeader
        title={patient.fullName}
        subtitle={`Patient ID: ${patient.patientId}`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: t("fields.patientId"), value: patient.patientId },
          { label: t("fields.nationalId"), value: patient.nationalId ?? "—" },
          {
            label: t("fields.familyBookNumber"),
            value: patient.familyBookNumber ?? "—",
          },
          {
            label: t("fields.registeredAt"),
            value: formatDate(patient.createdAt),
          },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="visits">
        <TabsList>
          <TabsTrigger value="visits">{t("tabs.visits")}</TabsTrigger>
          <TabsTrigger value="prescriptions">
            {t("tabs.prescriptions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visits">
          {history?.departments?.map((dept) => (
            <div key={dept.id} className="mb-6">
              <p className="text-sm font-semibold text-muted-foreground mb-2">
                {dept.name}
              </p>
              <div className="space-y-2">
                {dept.visits.map((v) => (
                  <Card
                    key={v.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/visits/${v.id}`)}
                  >
                    <CardContent className="p-4 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {formatDateTime(v.visitDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {v.doctor?.fullName}
                        </p>
                        {v.diagnosis && (
                          <p className="text-xs mt-1">{v.diagnosis}</p>
                        )}
                      </div>
                      <StatusBadge status={v.status} domain="visit" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          {!history?.departments?.length && (
            <p className="text-sm text-muted-foreground py-4">
              {t("history.noVisits")}
            </p>
          )}
        </TabsContent>

        <TabsContent value="prescriptions">
          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <Card
                key={rx.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/prescriptions/${rx.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Dr. {rx.doctor?.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(rx.startDate)} —{" "}
                      {rx.totalCycles
                        ? `${rx.totalCycles} cycles`
                        : "Indefinite"}
                    </p>
                    <p className="text-xs mt-1">
                      {rx.items?.length} medication(s)
                    </p>
                  </div>
                  <StatusBadge status={rx.status} domain="prescription" />
                </CardContent>
              </Card>
            ))}
            {prescriptions.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">
                {t("tabs.prescriptions")} — {t("common:empty.title")}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
