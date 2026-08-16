import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable from "@/components/shared/AppDataTable";
import StatusBadge from "@/components/shared/StatusBadge";
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
import { Textarea } from "@/components/primitive/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/primitive/tabs";
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useGetUnitsQuery,
  useCreateUnitMutation,
  useDeleteUnitMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetVariantsQuery,
  useCreateVariantMutation,
  useUpdateVariantStatusMutation,
} from "@/api/catalog.api";
import type { Product, Unit, Category, VariantListItem } from "@/lib/apiTypes";
import type { ColumnDef } from "@/components/shared/AppDataTable";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/primitive/switch";
function ProductsTab() {
  const { t } = useTranslation("catalog");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetProductsQuery({ page, limit: 20 });
  const { data: cats } = useGetCategoriesQuery();
  const [create, { isLoading: creating }] = useCreateProductMutation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    materialType: "consumable",
    description: "",
  });

  const columns: ColumnDef<Product>[] = [
    { key: "name", header: t("products.name"), cell: (r) => r.name },
    {
      key: "category",
      header: t("products.category"),
      cell: (r) => r.category?.name ?? "—",
    },
    {
      key: "type",
      header: t("products.type"),
      cell: (r) => <StatusBadge status={r.materialType} domain="material" />,
    },
    {
      key: "status",
      header: t("products.status"),
      cell: (r) => (
        <StatusBadge
          status={r.isActive ? "active" : "inactive"}
          domain="user"
        />
      ),
    },
  ];

  const handleCreate = async () => {
    await create({
      name: form.name,
      categoryId: form.categoryId || undefined,
      materialType: form.materialType,
      description: form.description || undefined,
    });
    setOpen(false);
    setForm({
      name: "",
      categoryId: "",
      materialType: "consumable",
      description: "",
    });
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4 mr-2" />
          {t("products.addProduct")}
        </Button>
      </div>
      <AppDataTable
        data={data?.data}
        columns={columns}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        onPageChange={setPage}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("products.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t("products.name")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("products.category")}</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("products.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {cats?.data?.map((c: Category) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("products.type")}</Label>
              <Select
                value={form.materialType}
                onValueChange={(v) => setForm({ ...form, materialType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consumable">
                    {t("status:material.consumable")}
                  </SelectItem>
                  <SelectItem value="fixed_asset">
                    {t("status:material.fixed_asset")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("products.description")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={creating || !form.name}>
              {t("common:actions.create")}{" "}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UnitsTab() {
  const { t } = useTranslation("catalog");
  const { data, isLoading } = useGetUnitsQuery();
  const [create] = useCreateUnitMutation();
  const [del] = useDeleteUnitMutation();
  const [name, setName] = useState("");
  const [abbr, setAbbr] = useState("");
  const units: Unit[] = data?.data ?? [];
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="space-y-1">
          <Label>{t("units.name")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label>{t("units.abbreviation")}</Label>
          <Input
            value={abbr}
            onChange={(e) => setAbbr(e.target.value)}
            className="w-24"
          />
        </div>
        <Button
          onClick={() => {
            create({ name, abbreviation: abbr });
            setName("");
            setAbbr("");
          }}
          disabled={!name}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-start">{t("units.name")}</th>
              <th className="px-4 py-2 text-start">
                {t("units.abbreviation")}
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? null
              : units.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.abbreviation ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => del(u.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesTab() {
  const { data, isLoading } = useGetCategoriesQuery();
  const [create] = useCreateCategoryMutation();
  const [del] = useDeleteCategoryMutation();
  const [name, setName] = useState("");
  const cats: Category[] = data?.data ?? [];
  const { t } = useTranslation("catalog");
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="space-y-1">
          <Label>{t("categories.name")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-48"
          />
        </div>
        <Button
          onClick={() => {
            create({ name });
            setName("");
          }}
          disabled={!name}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-start">{t("categories.name")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? null
              : cats.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => del(c.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function VariantsTab() {
  const { t } = useTranslation("catalog");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetVariantsQuery({ page, limit: 20 });
  const { data: productsData } = useGetProductsQuery({ limit: 100 });
  const { data: unitsData } = useGetUnitsQuery();
  const [create, { isLoading: creating }] = useCreateVariantMutation();
  const [updateStatus] = useUpdateVariantStatusMutation();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleStatusToggle(id: string, isActive: boolean) {
    setTogglingId(id);
    try {
      await updateStatus({ id, isActive }).unwrap();
    } finally {
      setTogglingId(null);
    }
  }

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    variantName: "",
    sku: "",
    unitId: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const products = productsData?.data?.items ?? [];
  const units = unitsData?.data ?? [];

  const columns: ColumnDef<VariantListItem>[] = [
    {
      key: "name",
      header: t("variants.variantName"),
      cell: (r) => <span className="font-medium">{r.variantName}</span>,
    },
    {
      key: "sku",
      header: t("variants.sku"),
      cell: (r) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.sku}</code>
      ),
    },
    {
      key: "product",
      header: t("variants.product"),
      cell: (r) => r.product?.name ?? "—",
    },
    {
      key: "unit",
      header: t("variants.unit"),
      cell: (r) => r.unit?.abbreviation ?? r.unit?.name ?? "—",
    },
    {
      key: "status",
      header: t("variants.status"),
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={r.isActive}
            onCheckedChange={(v) => handleStatusToggle(r.id, v)}
            onClick={(e) => e.stopPropagation()}
            disabled={togglingId === r.id}
          />
          {togglingId === r.id && (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          )}
        </div>
      ),
    },
  ];

  const handleCreate = async () => {
    if (!form.productId || !form.variantName || !form.sku || !form.unitId) {
      setFormError(t("variants.allFieldsRequired"));
      return;
    }
    setFormError(null);
    try {
      await create(form).unwrap();
      setOpen(false);
      setForm({ productId: "", variantName: "", sku: "", unitId: "" });
    } catch (e: unknown) {
      setFormError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4 mr-2" />
          {t("variants.addVariant")}
        </Button>
      </div>
      <AppDataTable
        data={data?.data}
        columns={columns}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        onPageChange={setPage}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("variants.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label required>{t("variants.product")}</Label>
              <Select
                value={form.productId}
                onValueChange={(v) => setForm({ ...form, productId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("variants.selectProduct")} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p: Product) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label required>{t("variants.variantName")}</Label>
              <Input
                value={form.variantName}
                onChange={(e) =>
                  setForm({ ...form, variantName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label required>{t("variants.sku")}</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label required>{t("variants.unit")}</Label>
              <Select
                value={form.unitId}
                onValueChange={(v) => setForm({ ...form, unitId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("variants.selectUnit")} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u: Unit) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} {u.abbreviation ? `(${u.abbreviation})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formError && <p className="text-xs text-danger">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {t("common:actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
export default function ProductsPage() {
  const { t } = useTranslation("catalog");
  return (
    <div className="p-6">
      <AppPageHeader title={t("title")} />
      <Tabs defaultValue="products">
        <TabsList className="mb-4">
          <TabsTrigger value="products">{t("products.tab")}</TabsTrigger>
          <TabsTrigger value="variants">{t("variants.tab")}</TabsTrigger>
          <TabsTrigger value="units">{t("units.tab")}</TabsTrigger>
          <TabsTrigger value="categories">{t("categories.tab")}</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="variants">
          <VariantsTab />
        </TabsContent>
        <TabsContent value="units">
          <UnitsTab />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
