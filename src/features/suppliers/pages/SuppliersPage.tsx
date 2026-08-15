import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable from "@/components/shared/AppDataTable";
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
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from "@/api/suppliers.api";
import type { Supplier } from "@/lib/apiTypes";
import type { ColumnDef } from "@/components/shared/AppDataTable";
import { useTranslation } from "react-i18next";
interface Form {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}
const EMPTY: Form = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
};

export default function SuppliersPage() {
  const { t } = useTranslation("suppliers");
  const { data, isLoading } = useGetSuppliersQuery();
  const [create, { isLoading: creating }] = useCreateSupplierMutation();
  const [update, { isLoading: updating }] = useUpdateSupplierMutation();

  const suppliersResult = data?.data as any;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      contactPerson: (s as any).contactPerson ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      address: s.address ?? "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await update({ id: editing.id, data: form });
    } else {
      await create(form);
    }
    setOpen(false);
  };

  const columns: ColumnDef<Supplier>[] = [
    { key: "name", header: "Name", cell: (r) => r.name },
    {
      key: "contact",
      header: t("fields.contactPerson"),
      cell: (r) => (r as any).contactPerson ?? "—",
    },
    { key: "phone", header: t("fields.phone"), cell: (r) => r.phone ?? "—" },
    { key: "email", header: t("fields.email"), cell: (r) => r.email ?? "—" },
    { key: "address", header: "Address", cell: (r) => r.address ?? "—" },
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
        title={t("title")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4 mr-2" />
            {t("addSupplier")}
          </Button>
        }
      />
      <AppDataTable
        data={suppliersResult}
        columns={columns}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("editSupplier") : t("new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(
              [
                "name",
                "contactPerson",
                "phone",
                "email",
                "address",
              ] as (keyof Form)[]
            ).map((field) => (
              <div key={field} className="space-y-1">
                <Label>{t(`fields.${field}`)}</Label>{" "}
                <Input
                  value={form[field]}
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.value })
                  }
                />
              </div>
            ))}
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
