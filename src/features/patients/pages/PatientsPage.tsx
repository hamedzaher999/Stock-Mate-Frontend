import AppPermissionGate from "@/components/shared/AppPermissionGate";
import { PERMISSIONS } from "@/lib/permissions";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserPlus, Pencil } from "lucide-react";
import {
  useGetPatientsQuery,
  useCreatePatientMutation,
  useUpdatePatientMutation,
} from "@/api/patients.api";
import { usePermission } from "@/hooks/usePermission";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable, { type ColumnDef } from "@/components/shared/AppDataTable";
import AppSearchInput from "@/components/shared/AppSearchInput";
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
import type { Patient } from "@/lib/apiTypes";
import { formatDate } from "@/lib/formatters";
import AppErrorState from "@/components/shared/AppErrorState";
export default function PatientsPage() {
  const { t } = useTranslation("patients");
  const navigate = useNavigate();
  const canAdd = usePermission(PERMISSIONS.ADD_PATIENT);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isFetching, isError, refetch } = useGetPatientsQuery(
    {
      page,
      limit: 20,
      search: debouncedSearch || undefined,
    },
  );
  const [createPatient, { isLoading: creating }] = useCreatePatientMutation();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    nationalId: "",
    familyBookNumber: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    nationalId: "",
    familyBookNumber: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [updatePatient, { isLoading: updating }] = useUpdatePatientMutation();

  function openEdit(patient: Patient) {
    setEditTarget(patient);
    setEditForm({
      fullName: patient.fullName,
      nationalId: patient.nationalId ?? "",
      familyBookNumber: patient.familyBookNumber ?? "",
    });
    setEditError(null);
  }

  async function handleEditSave() {
    if (!editTarget) return;
    if (!editForm.fullName.trim()) {
      setEditError(t("form.required"));
      return;
    }
    setEditError(null);
    try {
      const data: Record<string, string> = { fullName: editForm.fullName };
      if (editForm.nationalId) data.nationalId = editForm.nationalId;
      if (editForm.familyBookNumber)
        data.familyBookNumber = editForm.familyBookNumber;
      await updatePatient({ id: editTarget.id, data }).unwrap();
      setEditTarget(null);
    } catch (e: unknown) {
      setEditError(
        (e as { data?: { message?: string } })?.data?.message ??
          "Error updating patient",
      );
    }
  }
  async function handleCreate() {
    if (!form.fullName.trim()) {
      setFormError(t("form.required"));
      return;
    }
    setFormError(null);
    try {
      const body: Record<string, string> = { fullName: form.fullName };
      if (form.nationalId) body.nationalId = form.nationalId;
      if (form.familyBookNumber) body.familyBookNumber = form.familyBookNumber;
      await createPatient(
        body as {
          fullName: string;
          nationalId?: string;
          familyBookNumber?: string;
        },
      ).unwrap();
      setOpen(false);
      setForm({ fullName: "", nationalId: "", familyBookNumber: "" });
    } catch (e: unknown) {
      setFormError(
        (e as { data?: { message?: string } })?.data?.message ??
          "Error creating patient",
      );
    }
  }

  const columns: ColumnDef<Patient>[] = [
    {
      key: "name",
      header: t("fields.fullName"),
      cell: (r) => <span className="font-medium">{r.fullName}</span>,
    },
    {
      key: "patientId",
      header: t("fields.patientId"),
      cell: (r) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
          {r.patientId}
        </code>
      ),
    },
    {
      key: "nationalId",
      header: t("fields.nationalId"),
      cell: (r) => r.nationalId ?? "—",
    },
    {
      key: "familyBook",
      header: t("fields.familyBookNumber"),
      cell: (r) => r.familyBookNumber ?? "—",
    },
    {
      key: "registered",
      header: t("fields.registeredAt"),
      cell: (r) => formatDate(r.createdAt),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <AppPermissionGate permission={PERMISSIONS.ADD_PATIENT}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(r);
            }}
          >
            <Pencil className="size-4" />
          </Button>
        </AppPermissionGate>
      ),
    },
  ];

  return (
    <div>
      <AppPageHeader
        title={t("title")}
        actions={
          canAdd && (
            <Button onClick={() => setOpen(true)}>
              <UserPlus className="size-4" />
              {t("register")}
            </Button>
          )
        }
      />

      <div className="mb-4">
        <AppSearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("search.placeholder")}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {isError && !isLoading ? (
          <AppErrorState onRetry={() => refetch()} />
        ) : (
          <AppDataTable
            data={data?.data}
            columns={columns}
            isLoading={isLoading}
            isFetching={isFetching}
            rowKey={(r) => r.id}
            onPageChange={setPage}
            onRowClick={(r) => navigate(`/patients/${r.id}`)}
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("register")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label required>{t("fields.fullName")}</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("fields.nationalId")}</Label>
              <Input
                value={form.nationalId}
                onChange={(e) =>
                  setForm({ ...form, nationalId: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("fields.familyBookNumber")}</Label>
              <Input
                value={form.familyBookNumber}
                onChange={(e) =>
                  setForm({ ...form, familyBookNumber: e.target.value })
                }
              />
            </div>
            {formError && <p className="text-xs text-danger">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              {t("register")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("fields.fullName")} — {t("common:actions.edit")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label required>{t("fields.fullName")}</Label>
              <Input
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm({ ...editForm, fullName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("fields.nationalId")}</Label>
              <Input
                value={editForm.nationalId}
                onChange={(e) =>
                  setEditForm({ ...editForm, nationalId: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("fields.familyBookNumber")}</Label>
              <Input
                value={editForm.familyBookNumber}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    familyBookNumber: e.target.value,
                  })
                }
              />
            </div>
            {editError && <p className="text-xs text-danger">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleEditSave} loading={updating}>
              {t("common:actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
