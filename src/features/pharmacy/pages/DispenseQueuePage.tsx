import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import {
  useGetDispenseQueueQuery,
  useLookupDispenseQueueQuery,
  useDispensePrescriptionMutation,
} from "@/api/pharmacy.api";
import { useGetPrescriptionByIdQuery } from "@/api/prescriptions.api";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable, { type ColumnDef } from "@/components/shared/AppDataTable";
import { Button } from "@/components/primitive/button";
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import { formatDate, formatRelative } from "@/lib/formatters";
import type { DispenseQueueEntry } from "@/lib/apiTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
function DispenseForm({
  prescriptionId,
  onClose,
}: {
  prescriptionId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation("pharmacy");
  const { data: rxData } = useGetPrescriptionByIdQuery(prescriptionId);
  const [dispense, { isLoading }] = useDispensePrescriptionMutation();
  const rx = rxData?.data;
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const items = rx?.items ?? [];

  async function handleDispense() {
    setError(null);
    try {
      await dispense({
        prescriptionId,
        ...(notes ? { notes } : {}),
        items: items.map((i) => ({
          prescriptionItemId: i.id,
          quantity:
            quantities[i.id] ?? i.prescribedQuantity - i.dispensedQuantity,
        })),
      }).unwrap();
      onClose();
    } catch (e: unknown) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ??
          t("dispense.errorDispensing"),
      );
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("dispense.patient")}: <strong>{rx?.patient?.fullName}</strong>
      </p>
      <p className="text-xs text-muted-foreground bg-info/10 text-info rounded-xl px-3 py-2">
        {t("dispense.batchInfo")}
      </p>
      {items.map((item) => {
        const remaining = item.prescribedQuantity - item.dispensedQuantity;
        return (
          <div
            key={item.id}
            className="rounded-xl border border-border p-3 space-y-2"
          >
            <p className="text-sm font-medium">{item.variant?.variantName}</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>
                {t("dispense.prescribed")}: {item.prescribedQuantity}
              </span>
              <span>
                {t("dispense.dispensed")}: {item.dispensedQuantity}
              </span>
              <span className="font-medium text-foreground">
                {t("dispense.remaining")}: {remaining}
              </span>
            </div>
            <div className="space-y-1">
              <Label>{t("dispense.toDispense")}</Label>
              <Input
                type="number"
                min={0}
                max={remaining}
                value={quantities[item.id] ?? remaining}
                onChange={(e) =>
                  setQuantities({
                    ...quantities,
                    [item.id]: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>
        );
      })}
      <div className="space-y-1.5">
        <Label>{t("dispense.notes")}</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          {t("common:actions.cancel")}
        </Button>
        <Button onClick={handleDispense} loading={isLoading}>
          {t("dispense.submit")}
        </Button>
      </div>
    </div>
  );
}

export default function DispenseQueuePage() {
  const { t } = useTranslation("pharmacy");
  const [page, setPage] = useState(1);
  const [lookupField, setLookupField] = useState<
    "nationalId" | "familyBookNumber"
  >("nationalId");
  const [lookupValue, setLookupValue] = useState("");
  const [searchTrigger, setSearchTrigger] = useState("");
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<
    string | null
  >(null);

  const { data, isLoading } = useGetDispenseQueueQuery({ page, limit: 20 });
  const { data: lookupData } = useLookupDispenseQueueQuery(
    { [lookupField]: searchTrigger },
    { skip: !searchTrigger },
  );

  const columns: ColumnDef<DispenseQueueEntry>[] = [
    {
      key: "patient",
      header: t("dispenseQueue.patient"),
      cell: (r) => <span className="font-medium">{r.patientName}</span>,
    },
    {
      key: "id",
      header: t("dispenseQueue.nationalIdCol"),
      cell: (r) => r.nationalId ?? r.familyBookNumber ?? "—",
    },
    {
      key: "cycle",
      header: t("dispenseQueue.cycleNumber"),
      cell: (r) => r.cycleNumber,
    },
    {
      key: "meds",
      header: t("dispenseQueue.meds"),
      cell: (r) => (
        <span className="text-xs line-clamp-2">{r.medicationSummary}</span>
      ),
    },
    {
      key: "ready",
      header: t("dispenseQueue.ready"),
      cell: (r) => formatRelative(r.readySince),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPrescriptionId(r.prescriptionId);
          }}
        >
          {t("dispenseQueue.dispense")}
        </Button>
      ),
    },
  ];

  const lookupResults = lookupData?.data?.results ?? [];

  return (
    <div>
      <AppPageHeader title={t("dispenseQueue.title")} />

      {/* Lookup */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("dispenseQueue.lookup")}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Select
            value={lookupField}
            onValueChange={(v) =>
              setLookupField(v as "nationalId" | "familyBookNumber")
            }
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder={t("dispenseQueue.lookup")} />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="nationalId">
                {t("dispenseQueue.nationalId")}
              </SelectItem>

              <SelectItem value="familyBookNumber">
                {t("dispenseQueue.familyBookNumber")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={lookupValue}
            onChange={(e) => setLookupValue(e.target.value)}
            placeholder={t("dispenseQueue.enterValue")}
            className="max-w-xs"
            onKeyDown={(e) =>
              e.key === "Enter" && setSearchTrigger(lookupValue)
            }
          />
          <Button
            onClick={() => setSearchTrigger(lookupValue)}
            variant="outline"
          >
            <Search className="size-4" />
            {t("dispenseQueue.search")}
          </Button>
        </CardContent>
        {searchTrigger && (
          <CardContent className="pt-0">
            {lookupResults.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("dispenseQueue.noResults")}
              </p>
            )}
            {lookupResults.map((entry) => (
              <div
                key={(entry as DispenseQueueEntry).id}
                className="flex items-center justify-between rounded-xl border border-border p-3 mb-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    {(entry as DispenseQueueEntry).patientName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(entry as DispenseQueueEntry).medicationSummary}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    setSelectedPrescriptionId(
                      (entry as DispenseQueueEntry).prescriptionId,
                    )
                  }
                >
                  Dispense
                </Button>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Full queue */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <AppDataTable
          data={data?.data}
          columns={columns}
          isLoading={isLoading}
          rowKey={(r) => r.id}
          onPageChange={setPage}
        />
      </div>

      {/* Dispense dialog */}
      <Dialog
        open={!!selectedPrescriptionId}
        onOpenChange={(v) => !v && setSelectedPrescriptionId(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("dispense.title")}</DialogTitle>
          </DialogHeader>
          {selectedPrescriptionId && (
            <DispenseForm
              prescriptionId={selectedPrescriptionId}
              onClose={() => setSelectedPrescriptionId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
