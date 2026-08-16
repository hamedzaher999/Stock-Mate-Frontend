import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useGetQueueQuery } from "@/api/queue.api";
import {
  useSelectPatientMutation,
  useCompleteConsultationMutation,
} from "@/api/visits.api";
import { useGetVariantsQuery } from "@/api/catalog.api";
import { Button } from "@/components/primitive/button";
import { Input } from "@/components/primitive/input";
import { Textarea } from "@/components/primitive/textarea";
import { Label } from "@/components/primitive/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
import AppPageHeader from "@/components/shared/AppPageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatRelative } from "@/lib/formatters";
import type { QueueEntry } from "@/lib/apiTypes";
import { Skeleton } from "@/components/primitive/skeleton";

interface PrescriptionItem {
  variantId: string;
  prescribedQuantity: number;
  dosage: string;
  frequency: string;
  durationDays: string;
}

interface PrescriptionForm {
  frequencyUnit: string;
  frequencyInterval: string;
  totalCycles: string;
  startDate: string;
  items: PrescriptionItem[];
}

export default function ConsultationPage() {
  const { t } = useTranslation("visits");

  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [externalMedications, setExternalMedications] = useState("");
  const [prescriptions, setPrescriptions] = useState<PrescriptionForm[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    data: queueData,
    isLoading: queueLoading,
    isFetching: queueFetching,
  } = useGetQueueQuery({ status: "waiting" }, { pollingInterval: 30000 });
  const { data: variantsData, isLoading: variantsLoading } =
    useGetVariantsQuery({
      isActive: true,
      limit: 100,
    } as { isActive: boolean; limit: number });
  const [selectPatient] = useSelectPatientMutation();
  const [completeConsultation, { isLoading: completing }] =
    useCompleteConsultationMutation();

  const waitingPatients = queueData?.data?.items ?? [];
  const variants = variantsData?.data?.items ?? [];

  async function handleSelectPatient(entry: QueueEntry) {
    try {
      await selectPatient({ queueEntryId: entry.id }).unwrap();
      setSelectedEntry(entry);
    } catch (e: unknown) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ??
          "Error selecting patient",
      );
    }
  }

  function addPrescription() {
    setPrescriptions((prev) => [
      ...prev,
      {
        frequencyUnit: "",
        frequencyInterval: "",
        totalCycles: "",
        startDate: new Date().toISOString().slice(0, 10),
        items: [
          {
            variantId: "",
            prescribedQuantity: 1,
            dosage: "",
            frequency: "",
            durationDays: "",
          },
        ],
      },
    ]);
  }

  function removePrescription(i: number) {
    setPrescriptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addItem(pi: number) {
    setPrescriptions((prev) =>
      prev.map((p, idx) =>
        idx === pi
          ? {
              ...p,
              items: [
                ...p.items,
                {
                  variantId: "",
                  prescribedQuantity: 1,
                  dosage: "",
                  frequency: "",
                  durationDays: "",
                },
              ],
            }
          : p,
      ),
    );
  }

  function removeItem(pi: number, ii: number) {
    setPrescriptions((prev) =>
      prev.map((p, idx) =>
        idx === pi ? { ...p, items: p.items.filter((_, i) => i !== ii) } : p,
      ),
    );
  }

  function updateRx(pi: number, field: keyof PrescriptionForm, value: string) {
    setPrescriptions((prev) =>
      prev.map((p, idx) => (idx === pi ? { ...p, [field]: value } : p)),
    );
  }

  function updateItem(
    pi: number,
    ii: number,
    field: keyof PrescriptionItem,
    value: string | number,
  ) {
    setPrescriptions((prev) =>
      prev.map((p, idx) =>
        idx === pi
          ? {
              ...p,
              items: p.items.map((item, i) =>
                i === ii ? { ...item, [field]: value } : item,
              ),
            }
          : p,
      ),
    );
  }

  async function handleComplete() {
    if (!selectedEntry) return;
    setError(null);
    try {
      const rxPayload = prescriptions
        .map((rx) => ({
          ...(rx.frequencyUnit
            ? {
                frequencyUnit: rx.frequencyUnit as "day" | "week" | "month",
                frequencyInterval: parseInt(rx.frequencyInterval) || 1,
                ...(rx.totalCycles
                  ? { totalCycles: parseInt(rx.totalCycles) }
                  : {}),
              }
            : {}),
          startDate: rx.startDate,
          items: rx.items
            .filter((i) => i.variantId)
            .map((i) => ({
              variantId: i.variantId,
              prescribedQuantity: Number(i.prescribedQuantity),
              ...(i.dosage ? { dosage: i.dosage } : {}),
              ...(i.frequency ? { frequency: i.frequency } : {}),
              ...(i.durationDays
                ? { durationDays: parseInt(i.durationDays) }
                : {}),
            })),
        }))
        .filter((rx) => rx.items.length > 0);

      await completeConsultation({
        queueEntryId: selectedEntry.id,
        ...(clinicalNotes ? { clinicalNotes } : {}),
        ...(diagnosis ? { diagnosis } : {}),
        ...(externalMedications ? { externalMedications } : {}),
        ...(rxPayload.length ? { prescriptions: rxPayload } : {}),
      }).unwrap();

      setSuccess(true);
      setSelectedEntry(null);
      setClinicalNotes("");
      setDiagnosis("");
      setExternalMedications("");
      setPrescriptions([]);
    } catch (e: unknown) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ??
          "Error completing consultation",
      );
    }
  }

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">✓</div>
        <p className="text-lg font-medium">{t("completed")}</p>
        <Button className="mt-4" onClick={() => setSuccess(false)}>
          {t("startNext")}
        </Button>
      </div>
    );
  }

  if (!selectedEntry) {
    return (
      <div>
        <AppPageHeader
          title={t("consultationRoom")}
          subtitle={t("selectPatientSubtitle")}
        />
        {queueLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="relative">
            <div
              className={
                queueFetching
                  ? "pointer-events-none opacity-60 transition-opacity duration-150 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                  : "transition-opacity duration-150 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              }
            >
              {waitingPatients.map((entry) => (
                <Card
                  key={entry.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectPatient(entry)}
                >
                  <CardContent className="p-4">
                    <p className="font-medium">{entry.patient?.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(entry.addedAt)}
                    </p>
                    <StatusBadge
                      status={entry.status}
                      domain="queue"
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
              ))}
              {waitingPatients.length === 0 && !queueFetching && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  {t("noPatientsWaiting")}
                </div>
              )}
            </div>
            {queueFetching && (
              <div className="absolute inset-0 flex items-start justify-center pt-8">
                <div className="flex items-center gap-2 rounded-full bg-card border border-border shadow-md px-3 py-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>
                    {t("common:table.updating", { defaultValue: "Updating…" })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        {error && <p className="text-xs text-danger mt-4">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <AppPageHeader
        title={t("consulting", { name: selectedEntry.patient?.fullName })}
        subtitle={selectedEntry.department?.name}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("clinicalNotes")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("clinicalNotes")}</Label>
                <Textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("diagnosis")}</Label>
                <Input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("externalMedications")}</Label>
                <Textarea
                  value={externalMedications}
                  onChange={(e) => setExternalMedications(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Prescriptions */}
          {prescriptions.map((rx, pi) => (
            <Card key={pi}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {t("prescription.prescription")} {pi + 1}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePrescription(pi)}
                  >
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t("prescription.frequencyUnit")}</Label>
                    <Select
                      value={rx.frequencyUnit}
                      onValueChange={(v) => updateRx(pi, "frequencyUnit", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="One-time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">
                          {t("prescription.oneTime")}
                        </SelectItem>
                        <SelectItem value="day">
                          {t("status:frequency.day")}
                        </SelectItem>
                        <SelectItem value="week">
                          {t("status:frequency.week")}
                        </SelectItem>
                        <SelectItem value="month">
                          {t("status:frequency.month")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {rx.frequencyUnit && (
                    <div className="space-y-1.5">
                      <Label>{t("prescription.frequencyInterval")}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={rx.frequencyInterval}
                        onChange={(e) =>
                          updateRx(pi, "frequencyInterval", e.target.value)
                        }
                      />
                    </div>
                  )}
                  {rx.frequencyUnit && (
                    <div className="space-y-1.5">
                      <Label>{t("prescription.totalCycles")}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={rx.totalCycles}
                        placeholder={t("prescription.indefinite")}
                        onChange={(e) =>
                          updateRx(pi, "totalCycles", e.target.value)
                        }
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>{t("prescription.startDate")}</Label>
                    <Input
                      type="date"
                      value={rx.startDate}
                      onChange={(e) =>
                        updateRx(pi, "startDate", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {rx.items.map((item, ii) => (
                    <div
                      key={ii}
                      className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-muted/50"
                    >
                      <div className="col-span-2 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Label>{t("prescription.variantId")}</Label>
                          {variantsLoading && (
                            <Loader2 className="size-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        <Select
                          value={item.variantId}
                          onValueChange={(v) =>
                            updateItem(pi, ii, "variantId", v)
                          }
                          disabled={variantsLoading}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                variantsLoading
                                  ? t("prescription.loadingMedications", {
                                      defaultValue: "Loading…",
                                    })
                                  : t("prescription.selectMedication")
                              }
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
                      <div className="space-y-1.5">
                        <Label>{t("prescription.prescribedQty")}</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.prescribedQuantity}
                          onChange={(e) =>
                            updateItem(
                              pi,
                              ii,
                              "prescribedQuantity",
                              parseInt(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t("prescription.dosage")}</Label>
                        <Input
                          value={item.dosage}
                          onChange={(e) =>
                            updateItem(pi, ii, "dosage", e.target.value)
                          }
                          placeholder="1 tablet"
                        />
                      </div>
                      <div className="flex items-end">
                        {rx.items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(pi, ii)}
                          >
                            <Trash2 className="size-4 text-danger" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addItem(pi)}
                  >
                    <PlusCircle className="size-4" /> {t("addItem")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addPrescription}>
            <PlusCircle className="size-4" /> {t("addPrescription")}
          </Button>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("patient")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">
                  {t("patientInfo.name")}:
                </span>{" "}
                {selectedEntry.patient?.fullName}
              </p>
              <p>
                <span className="text-muted-foreground">
                  {t("patientInfo.id")}:
                </span>{" "}
                {selectedEntry.patient?.patientId}
              </p>
              <p>
                <span className="text-muted-foreground">
                  {t("patientInfo.department")}:
                </span>{" "}
                {selectedEntry.department?.name}
              </p>
              <p>
                <span className="text-muted-foreground">
                  {t("patientInfo.waitingSince")}:
                </span>{" "}
                {formatRelative(selectedEntry.addedAt)}
              </p>
            </CardContent>
          </Card>

          {error && <p className="text-xs text-danger">{error}</p>}

          <Button
            className="w-full"
            onClick={handleComplete}
            loading={completing}
          >
            {t("complete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
