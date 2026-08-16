import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  useGetPurchaseRequestsQuery,
  useCreatePurchaseRequestMutation,
} from "@/api/purchasing.api";
import { useGetVariantsQuery } from "@/api/catalog.api";
import { formatDate, formatCurrency } from "@/lib/formatters";
import type { PurchaseRequest } from "@/lib/apiTypes";
import type { ColumnDef } from "@/components/shared/AppDataTable";
import { useTranslation } from "react-i18next";
import AppErrorState from "@/components/shared/AppErrorState";
interface ItemRow {
  variantId: string;
  requestedQuantity: number;
  estimatedPrice: number;
}
const REQUEST_STATUSES = [
  "draft",
  "pending_hospital_approval",
  "pending_manager_approval",
  "hospital_rejected",
  "manager_rejected",
  "preparing",
  "complete",
  "partially_complete",
  "cancelled",
] as const;
export default function PurchaseRequestsPage() {
  const { t } = useTranslation("purchasing");
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const { data, isLoading, isFetching, isError, refetch } =
    useGetPurchaseRequestsQuery({
      page,
      limit: 20,
      ...(status ? { status } : {}),
    });
  const [create, { isLoading: creating }] = useCreatePurchaseRequestMutation();
  const { data: variantData } = useGetVariantsQuery({
    isActive: true,
    limit: 100,
  });

  const variants = variantData?.data?.items ?? [];

  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([
    { variantId: "", requestedQuantity: 1, estimatedPrice: 0 },
  ]);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { variantId: "", requestedQuantity: 1, estimatedPrice: 0 },
    ]);
  const removeItem = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (
    i: number,
    field: keyof ItemRow,
    value: string | number,
  ) =>
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)),
    );

  const handleCreate = async () => {
    await create({
      items: items.map((i) => ({
        variantId: i.variantId,
        requestedQuantity: i.requestedQuantity,
        estimatedPrice: i.estimatedPrice,
      })),
      notes,
    });
    setOpen(false);
    setItems([{ variantId: "", requestedQuantity: 1, estimatedPrice: 0 }]);
    setNotes("");
  };

  const columns: ColumnDef<PurchaseRequest>[] = [
    {
      key: "number",
      header: t("requests.number"),
      cell: (r) => <span className="font-mono text-xs">{r.requestNumber}</span>,
    },
    {
      key: "items",
      header: t("requests.items"),
      cell: (r) => r.items?.length ?? 0,
    },
    {
      key: "total",
      header: t("requests.estTotal"),
      cell: (r) =>
        formatCurrency(
          r.items?.reduce(
            (s: number, i: any) =>
              s + (i.estimatedPrice ?? 0) * i.requestedQuantity,
            0,
          ) ?? 0,
        ),
    },
    {
      key: "by",
      header: t("requests.requestedBy"),
      cell: (r) => r.requestedBy?.fullName,
    },
    {
      key: "date",
      header: t("requests.date"),
      cell: (r) => formatDate(r.createdAt),
    },
    {
      key: "status",
      header: t("requests.status"),
      cell: (r) => <StatusBadge status={r.status} domain="purchaseRequest" />,
    },
  ];

  return (
    <div className="p-6">
      <AppPageHeader
        title={t("requests.title")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4 mr-2" /> {t("requests.new")}
          </Button>
        }
      />
      <div className="flex gap-3 mb-4 flex-wrap">
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder={t("common:filters.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("common:filters.all")}</SelectItem>
            {REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status:purchaseRequest.${s}`, {
                  defaultValue: s.replace(/_/g, " "),
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
          onRowClick={(r) => navigate(r.id)}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("requests.newTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-end border rounded p-3">
                <div className="flex-1 space-y-1">
                  <Label>{t("requests.variant")}</Label>
                  <Select
                    value={item.variantId}
                    onValueChange={(v) => updateItem(i, "variantId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("requests.selectVariant")} />
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
                <div className="w-24 space-y-1">
                  <Label>{t("requests.qty")}</Label>
                  <Input
                    type="number"
                    value={item.requestedQuantity}
                    onChange={(e) =>
                      updateItem(i, "requestedQuantity", Number(e.target.value))
                    }
                  />
                </div>
                <div className="w-28 space-y-1">
                  <Label>{t("requests.estPrice")}</Label>
                  <Input
                    type="number"
                    value={item.estimatedPrice}
                    onChange={(e) =>
                      updateItem(i, "estimatedPrice", Number(e.target.value))
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="size-4 mr-1" /> {t("requests.addItem")}
            </Button>
            <div className="space-y-1">
              <Label>{t("requests.notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || items.some((i) => !i.variantId)}
            >
              {t("common:actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
