import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, UserPlus, ScanLine, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/primitive/input";
import { Button } from "@/components/primitive/button";
import { Label } from "@/components/primitive/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/primitive/select";
import { Card, CardContent } from "@/components/primitive/card";
import {
  useLookupPatientQuery,
  useGetPatientsQuery,
  useCreatePatientMutation,
} from "@/api/patients.api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Patient } from "@/lib/apiTypes";

type LookupField = "patientId" | "nationalId" | "familyBookNumber";

interface PatientQuickFindPanelProps {
  onSelect: (patient: Patient) => void;
  selectedPatientId?: string;
}

const LOOKUP_FIELDS: { value: LookupField; labelKey: string }[] = [
  { value: "patientId", labelKey: "quickFind.byPatientId" },
  { value: "nationalId", labelKey: "quickFind.byNationalId" },
  { value: "familyBookNumber", labelKey: "quickFind.byFamilyBook" },
];

export default function PatientQuickFindPanel({
  onSelect,
  selectedPatientId,
}: PatientQuickFindPanelProps) {
  const { t } = useTranslation("queue");

  const [mode, setMode] = useState<"id" | "name">("id");
  const [lookupField, setLookupField] = useState<LookupField>("patientId");
  const [lookupValue, setLookupValue] = useState("");
  const [searchTrigger, setSearchTrigger] = useState("");

  const [nameSearch, setNameSearch] = useState("");
  const debouncedNameSearch = useDebouncedValue(nameSearch);

  const [createOpen, setCreateOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    fullName: "",
    nationalId: "",
    familyBookNumber: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: lookupData, isFetching: lookupLoading } = useLookupPatientQuery(
    { [lookupField]: searchTrigger },
    { skip: !searchTrigger },
  );
  const { data: nameData, isFetching: nameLoading } = useGetPatientsQuery(
    { search: debouncedNameSearch, limit: 8 },
    { skip: !debouncedNameSearch },
  );
  const [createPatient, { isLoading: creating }] = useCreatePatientMutation();

  const lookupResult = lookupData?.data;
  const lookupNotFound =
    searchTrigger && !lookupLoading && lookupResult == null;
  const lookupMultiple =
    lookupResult && "multipleMatches" in lookupResult
      ? lookupResult.multipleMatches
      : null;
  const lookupSingle =
    lookupResult && !("multipleMatches" in lookupResult)
      ? (lookupResult as Patient)
      : null;

  const nameResults = nameData?.data?.items ?? [];

  function openCreateWithPrefill() {
    setNewForm({
      fullName: mode === "name" ? nameSearch : "",
      nationalId:
        mode === "id" && lookupField === "nationalId" ? lookupValue : "",
      familyBookNumber:
        mode === "id" && lookupField === "familyBookNumber" ? lookupValue : "",
    });
    setCreateError(null);
    setCreateOpen(true);
  }

  async function handleCreate() {
    if (!newForm.fullName.trim()) {
      setCreateError(t("quickFind.nameRequired"));
      return;
    }
    setCreateError(null);
    try {
      const body: Record<string, string> = { fullName: newForm.fullName };
      if (newForm.nationalId) body.nationalId = newForm.nationalId;
      if (newForm.familyBookNumber)
        body.familyBookNumber = newForm.familyBookNumber;
      const res = await createPatient(
        body as {
          fullName: string;
          nationalId?: string;
          familyBookNumber?: string;
        },
      ).unwrap();
      setCreateOpen(false);
      onSelect(res.data);
    } catch (e: unknown) {
      setCreateError(
        (e as { data?: { message?: string } })?.data?.message ??
          t("quickFind.errorCreating"),
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode("id")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "id"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ScanLine className="size-3.5" />
          {t("quickFind.scanOrId")}
        </button>
        <button
          type="button"
          onClick={() => setMode("name")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "name"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="size-3.5" />
          {t("quickFind.byName")}
        </button>
      </div>

      {mode === "id" && (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Select
              value={lookupField}
              onValueChange={(v) => {
                setLookupField(v as LookupField);
                setSearchTrigger("");
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOOKUP_FIELDS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {t(f.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              autoFocus
              value={lookupValue}
              onChange={(e) => setLookupValue(e.target.value)}
              placeholder={t("quickFind.scanOrTypePlaceholder")}
              className="flex-1 min-w-45"
              onKeyDown={(e) => {
                if (e.key === "Enter") setSearchTrigger(lookupValue.trim());
              }}
            />
            <Button
              variant="outline"
              onClick={() => setSearchTrigger(lookupValue.trim())}
              disabled={!lookupValue.trim()}
            >
              <Search className="size-4" />
              {t("quickFind.find")}
            </Button>
          </div>

          {lookupLoading && (
            <p className="text-xs text-muted-foreground">
              {t("quickFind.searching")}
            </p>
          )}

          {lookupSingle && (
            <Card
              className={
                selectedPatientId === lookupSingle.id
                  ? "border-primary ring-1 ring-primary"
                  : "cursor-pointer hover:border-primary/50 transition-colors"
              }
              onClick={() => onSelect(lookupSingle)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{lookupSingle.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {lookupSingle.patientId}
                    {lookupSingle.nationalId
                      ? ` · ${lookupSingle.nationalId}`
                      : ""}
                  </p>
                </div>
                {selectedPatientId === lookupSingle.id && (
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                )}
              </CardContent>
            </Card>
          )}

          {lookupMultiple && lookupMultiple.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                {t("quickFind.multipleMatches")}
              </p>
              {lookupMultiple.map((p) => (
                <Card
                  key={p.id}
                  className={
                    selectedPatientId === p.id
                      ? "border-primary ring-1 ring-primary"
                      : "cursor-pointer hover:border-primary/50 transition-colors"
                  }
                  onClick={() => onSelect(p)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.patientId}
                      </p>
                    </div>
                    {selectedPatientId === p.id && (
                      <CheckCircle2 className="size-4 text-primary shrink-0" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {lookupNotFound && (
            <div className="rounded-xl border border-dashed border-border p-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t("quickFind.noMatchFound")}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={openCreateWithPrefill}
              >
                <UserPlus className="size-4" />
                {t("quickFind.registerNew")}
              </Button>
            </div>
          )}
        </div>
      )}

      {mode === "name" && (
        <div className="space-y-2">
          <Input
            autoFocus
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder={t("quickFind.namePlaceholder")}
            leftIcon={<Search />}
          />
          {nameLoading && (
            <p className="text-xs text-muted-foreground">
              {t("quickFind.searching")}
            </p>
          )}
          {!nameLoading && debouncedNameSearch && nameResults.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t("quickFind.noMatchFound")}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={openCreateWithPrefill}
              >
                <UserPlus className="size-4" />
                {t("quickFind.registerNew")}
              </Button>
            </div>
          )}
          {nameResults.length > 0 && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {nameResults.map((p) => (
                <Card
                  key={p.id}
                  className={
                    selectedPatientId === p.id
                      ? "border-primary ring-1 ring-primary"
                      : "cursor-pointer hover:border-primary/50 transition-colors"
                  }
                  onClick={() => onSelect(p)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.patientId}
                        {p.nationalId ? ` · ${p.nationalId}` : ""}
                        {p.familyBookNumber ? ` · ${p.familyBookNumber}` : ""}
                      </p>
                    </div>
                    {selectedPatientId === p.id && (
                      <CheckCircle2 className="size-4 text-primary shrink-0" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inline create-patient mini form */}
      {createOpen && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">{t("quickFind.registerNew")}</p>
            <div className="space-y-1.5">
              <Label required>{t("quickFind.fullName")}</Label>
              <Input
                value={newForm.fullName}
                onChange={(e) =>
                  setNewForm({ ...newForm, fullName: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>{t("quickFind.nationalId")}</Label>
                <Input
                  value={newForm.nationalId}
                  onChange={(e) =>
                    setNewForm({ ...newForm, nationalId: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("quickFind.familyBookNumber")}</Label>
                <Input
                  value={newForm.familyBookNumber}
                  onChange={(e) =>
                    setNewForm({ ...newForm, familyBookNumber: e.target.value })
                  }
                />
              </div>
            </div>
            {createError && (
              <p className="text-xs text-danger">{createError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
              >
                {t("common:actions.cancel")}
              </Button>
              <Button size="sm" onClick={handleCreate} loading={creating}>
                {t("quickFind.registerAndSelect")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
