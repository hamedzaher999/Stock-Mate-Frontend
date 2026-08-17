import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil } from "lucide-react";
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
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable, { ColumnDef } from "@/components/shared/AppDataTable";
import type { Destination } from "@/lib/apiTypes";
import {
  useGetDestinationsQuery,
  useCreateDestinationMutation,
  useUpdateDestinationMutation,
} from "@/api/destinations.api";

interface Form {
  name: string;
  phone: string;
  email: string;
  address: string;
}
const EMPTY: Form = { name: "", phone: "", email: "", address: "" };

export default function DestinationsPage() {
  const { t } = useTranslation("disposal");
  const { data, isLoading, isFetching, isError, refetch } =
    useGetDestinationsQuery();
  const [create, { isLoading: creating }] = useCreateDestinationMutation();
  const [update, { isLoading: updating }] = useUpdateDestinationMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setOpen(true);
  };
  const openEdit = (d: Destination) => {
    setEditing(d);
    setForm({
      name: d.name,
      phone: d.phone ?? "",
      email: d.email ?? "",
      address: d.address ?? "",
    });
    setError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError(t("destinations.fields.name") + " is required");
      return;
    }
    setError(null);
    try {
      const body = {
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
      };
      if (editing) {
        await update({ id: editing.id, data: body }).unwrap();
      } else {
        await create(body).unwrap();
      }
      setOpen(false);
    } catch (e: unknown) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  };

  const columns: ColumnDef<Destination>[] = [
    { key: "name", header: t("destinations.fields.name"), cell: (r) => r.name },
    {
      key: "phone",
      header: t("destinations.fields.phone"),
      cell: (r) => r.phone ?? "—",
    },
    {
      key: "email",
      header: t("destinations.fields.email"),
      cell: (r) => r.email ?? "—",
    },
    {
      key: "address",
      header: t("destinations.fields.address"),
      cell: (r) => r.address ?? "—",
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
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
      ),
    },
  ];

  return (
    <div className="p-6">
      <AppPageHeader
        title={t("destinations.title")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4 mr-2" />
            {t("destinations.addDestination")}
          </Button>
        }
      />
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <AppDataTable
          data={data?.data}
          columns={columns}
          isLoading={isLoading}
          isFetching={isFetching}
          rowKey={(r) => r.id}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t("destinations.editDestination")
                : t("destinations.new")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(["name", "phone", "email", "address"] as (keyof Form)[]).map(
              (field) => (
                <div key={field} className="space-y-1">
                  <Label required={field === "name"}>
                    {t(`destinations.fields.${field}`)}
                  </Label>
                  <Input
                    value={form[field]}
                    onChange={(e) =>
                      setForm({ ...form, [field]: e.target.value })
                    }
                  />
                </div>
              ),
            )}
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={creating || updating || !form.name}
            >
              {t("common:actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
