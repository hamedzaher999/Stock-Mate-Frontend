import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/primitive/button";
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import { Textarea } from "@/components/primitive/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/primitive/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable, { ColumnDef } from "@/components/shared/AppDataTable";
import AppErrorState from "@/components/shared/AppErrorState";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatCurrency } from "@/lib/formatters";
import type { DisposalSaleRequest } from "@/lib/apiTypes";
import {
  useGetDisposalSaleRequestsQuery,
  useGetDisposalSaleLiveStockQuery,
  useCreateDisposalSaleRequestMutation,
} from "@/api/disposalSales.api";
import { useGetDestinationsQuery } from "@/api/destinations.api";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";

const STATUSES = [
  "all",
  "pending_approval",
  "awaiting_confirmation",
  "rejected",
  "completed",
  "cancelled",
] as const;

interface SaleItemLine {
  batchId: string;
  variantId: string;
  quantity: string;
  price: string;
}

export default function DisposalSalesPage() {
  const { t } = useTranslation("disposal");
  const navigate = useNavigate();
  const canCreate = usePermission(PERMISSIONS.CREATE_DISPOSAL_SALE_REQUEST);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");

  const { data, isLoading, isFetching, isError, refetch } =
    useGetDisposalSaleRequestsQuery({
      page,
      limit: 20,
      ...(status !== "all" ? { status } : {}),
    });

  const [open, setOpen] = useState(false);
  const [destinationId, setDestinationId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<SaleItemLine[]>([
    { batchId: "", variantId: "", quantity: "", price: "" },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: destData } = useGetDestinationsQuery(
    { isActive: true },
    { skip: !open },
  );
  const destinations = destData?.data?.items ?? [];

  const { data: stockData, isLoading: stockLoading } =
    useGetDisposalSaleLiveStockQuery({ limit: 200 }, { skip: !open });
  const stockRows = stockData?.data?.items ?? [];

  // Flatten batches across all variants at the disposal warehouse for selection
  const batchOptions = stockRows.flatMap((row) =>
    (row.batches ?? []).map((b) => ({
      batchId: b.batchId,
      batchNumber: b.batchNumber,
      variantId: row.variantId,
      variantName: row.variantName,
      quantity: b.quantity,
    })),
  );

  const [createRequest, { isLoading: creating }] =
    useCreateDisposalSaleRequestMutation();

  function openCreateDialog() {
    setDestinationId("");
    setNotes("");
    setLines([{ batchId: "", variantId: "", quantity: "", price: "" }]);
    setFormError(null);
    setOpen(true);
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { batchId: "", variantId: "", quantity: "", price: "" },
    ]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: keyof SaleItemLine, value: string) {
    setLines((prev) =>
      prev.map((line, idx) => {
        if (idx !== i) return line;
        if (field === "batchId") {
          const batch = batchOptions.find((b) => b.batchId === value);
          return {
            ...line,
            batchId: value,
            variantId: batch?.variantId ?? "",
          };
        }
        return { ...line, [field]: value };
      }),
    );
  }

  const estTotal = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.price) || 0),
    0,
  );

  async function handleCreate() {
    setFormError(null);
    if (!destinationId) {
      setFormError(t("sales.selectDestination"));
      return;
    }
    const activeLines = lines.filter((l) => l.batchId);
    if (activeLines.length === 0) {
      setFormError(t("sales.atLeastOneItem"));
      return;
    }
    if (activeLines.some((l) => !l.quantity || !l.price)) {
      setFormError(t("sales.allItemFieldsRequired"));
      return;
    }
    try {
      const res = await createRequest({
        destinationId,
        ...(notes ? { notes } : {}),
        items: activeLines.map((l) => ({
          variantId: l.variantId,
          batchId: l.batchId,
          quantity: Number(l.quantity),
          price: Number(l.price),
        })),
      }).unwrap();
      setOpen(false);
      navigate(`/disposal/sales/${res.data.id}`);
    } catch (e: unknown) {
      setFormError(
        (e as { data?: { message?: string } })?.data?.message ??
          t("sales.errorCreating"),
      );
    }
  }

  const columns: ColumnDef<DisposalSaleRequest>[] = [
    {
      key: "id",
      header: t("sales.requestNumber"),
      cell: (r) => (
        <span className="font-mono text-xs">{r.id.slice(0, 8)}</span>
      ),
    },
    {
      key: "destination",
      header: t("sales.destination"),
      cell: (r) => r.destination?.name,
    },
    {
      key: "items",
      header: t("sales.items"),
      cell: (r) => r.items?.length ?? 0,
    },
    {
      key: "total",
      header: t("sales.estTotal"),
      cell: (r) =>
        formatCurrency(
          r.items?.reduce((s, i) => s + i.quantity * i.price, 0) ?? 0,
        ),
    },
    {
      key: "by",
      header: t("sales.requestedBy"),
      cell: (r) => r.requestedBy?.fullName,
    },
    {
      key: "date",
      header: t("sales.date"),
      cell: (r) => formatDate(r.createdAt),
    },
    {
      key: "status",
      header: t("sales.status"),
      cell: (r) => (
        <StatusBadge status={r.status} domain="disposalSaleRequest" />
      ),
    },
  ];

  return (
    <div className="p-6">
      <AppPageHeader
        title={t("sales.title")}
        actions={
          canCreate && (
            <Button onClick={openCreateDialog}>
              <Plus className="size-4 mr-2" />
              {t("sales.new")}
            </Button>
          )
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
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all"
                  ? t("common:filters.all")
                  : t(`status:disposalSaleRequest.${s}`, {
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
          onRowClick={(r) => navigate(`/disposal/sales/${r.id}`)}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("sales.newTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label required>{t("sales.destination")}</Label>
              <Select value={destinationId} onValueChange={setDestinationId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("sales.selectDestination")} />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label required>{t("sales.items")}</Label>
                {stockLoading && (
                  <Loader2 className="size-3 animate-spin text-muted-foreground" />
                )}
              </div>
              {lines.map((line, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-muted/50"
                >
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">{t("sales.selectBatch")}</Label>
                    <Select
                      value={line.batchId}
                      onValueChange={(v) => updateLine(i, "batchId", v)}
                      disabled={stockLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            stockLoading ? "Loading…" : t("sales.selectBatch")
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {batchOptions.map((b) => (
                          <SelectItem key={b.batchId} value={b.batchId}>
                            {b.variantName} — {b.batchNumber} (
                            {t("sales.qtyAvailable", { qty: b.quantity })})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("sales.quantity")}</Label>
                    <Input
                      type="number"
                      min={0.01}
                      step="any"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(i, "quantity", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("sales.price")}</Label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={line.price}
                      onChange={(e) => updateLine(i, "price", e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-4 flex justify-end">
                    {lines.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(i)}
                      >
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="size-4" /> {t("sales.addItem")}
              </Button>
            </div>

            <div className="flex justify-end text-sm font-medium">
              {t("sales.estTotal")}: {formatCurrency(estTotal)}
            </div>

            <div className="space-y-1.5">
              <Label>{t("sales.notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {formError && <p className="text-xs text-danger">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              {t("sales.createRequest")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
