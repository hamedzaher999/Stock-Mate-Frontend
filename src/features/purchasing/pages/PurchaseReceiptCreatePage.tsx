import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Upload, X } from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import { Button } from "@/components/primitive/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import { Label } from "@/components/primitive/label";
import { Input } from "@/components/primitive/input";
import { Textarea } from "@/components/primitive/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/primitive/select";
import {
  useGetPurchaseRequestsQuery,
  useGetPurchaseRequestByIdQuery,
  useCreatePurchaseReceiptMutation,
} from "@/api/purchasing.api";
import { useGetSuppliersQuery } from "@/api/suppliers.api";
interface ReceiptItemForm {
  purchaseRequestItemId: string;
  quantity: string;
  batchNumber: string;
  manufacturingDate: string;
  expirationDate: string;
  purchasePrice: string;
}

const RECEIVABLE_STATUSES = ["preparing", "partially_complete"];
const MAX_IMAGES = 10; // mirrors PURCHASE_RECEIPT_MAX_IMAGES default; server enforces the real limit

export default function PurchaseReceiptCreatePage() {
  const { t } = useTranslation("purchasing");
  const navigate = useNavigate();

  const [purchaseRequestId, setPurchaseRequestId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [receivingDate, setReceivingDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [type, setType] = useState<"batch" | "final_batch">("batch");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ReceiptItemForm[]>([]);
  const [receiptImages, setReceiptImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: requestsData } = useGetPurchaseRequestsQuery({ limit: 100 });
  const { data: requestDetail } = useGetPurchaseRequestByIdQuery(
    purchaseRequestId,
    { skip: !purchaseRequestId },
  );
  const { data: suppliersData } = useGetSuppliersQuery({ isActive: true });
  const [createReceipt, { isLoading: creating }] =
    useCreatePurchaseReceiptMutation();

  const eligibleRequests = (requestsData?.data?.items ?? []).filter((r) =>
    RECEIVABLE_STATUSES.includes(r.status),
  );
  const suppliers = suppliersData?.data?.items ?? [];
  const requestItems = requestDetail?.data?.items ?? [];

  function handleSelectRequest(id: string) {
    setPurchaseRequestId(id);
    setItems([]);
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        purchaseRequestItemId: "",
        quantity: "",
        batchNumber: "",
        manufacturingDate: "",
        expirationDate: "",
        purchasePrice: "",
      },
    ]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof ReceiptItemForm, value: string) {
    setItems((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)),
    );
  }

  function availableItemsFor(currentIndex: number) {
    const usedIds = new Set(
      items
        .filter((_, idx) => idx !== currentIndex)
        .map((i) => i.purchaseRequestItemId)
        .filter(Boolean),
    );
    return requestItems.filter((ri) => !usedIds.has(ri.id));
  }

  function handleAddImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    setReceiptImages((prev) => {
      const combined = [...prev, ...Array.from(files)];
      return combined.slice(0, MAX_IMAGES);
    });
  }

  function removeImageAt(i: number) {
    setReceiptImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    setError(null);

    if (!purchaseRequestId || !supplierId || !receivingDate) {
      setError(t("receipts.form.requiredFields"));
      return;
    }
    if (items.length === 0) {
      setError(t("receipts.form.atLeastOneItem"));
      return;
    }
    if (
      items.some(
        (i) => !i.purchaseRequestItemId || !i.quantity || !i.batchNumber,
      )
    ) {
      setError(t("receipts.form.itemFieldsRequired"));
      return;
    }
    if (receiptImages.length === 0) {
      setError(t("receipts.form.imageRequired"));
      return;
    }

    const payloadItems = items.map((i) => ({
      purchaseRequestItemId: i.purchaseRequestItemId,
      quantity: Number(i.quantity),
      batchNumber: i.batchNumber,
      ...(i.manufacturingDate
        ? { manufacturingDate: i.manufacturingDate }
        : {}),
      ...(i.expirationDate ? { expirationDate: i.expirationDate } : {}),
      ...(i.purchasePrice ? { purchasePrice: Number(i.purchasePrice) } : {}),
    }));

    const formData = new FormData();
    formData.append("purchaseRequestId", purchaseRequestId);
    formData.append("supplierId", supplierId);
    formData.append("receivingDate", receivingDate);
    formData.append("type", type);
    if (notes) formData.append("notes", notes);
    formData.append("items", JSON.stringify(payloadItems));
    // Field name must be "receiptImages" and can be appended multiple times
    receiptImages.forEach((file) => formData.append("receiptImages", file));

    try {
      const res = await createReceipt(formData).unwrap();
      navigate(`/purchasing/receipts/${res.data.id}`);
    } catch (e: unknown) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ??
          t("receipts.form.errorCreating"),
      );
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <AppPageHeader
        title={t("receipts.form.title")}
        subtitle={t("receipts.form.subtitle")}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("receipts.form.details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label required>{t("receipts.form.purchaseRequest")}</Label>
            <Select
              value={purchaseRequestId}
              onValueChange={handleSelectRequest}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("receipts.form.selectPurchaseRequest")}
                />
              </SelectTrigger>
              <SelectContent>
                {eligibleRequests.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.requestNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {eligibleRequests.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t("receipts.form.noEligibleRequests")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label required>{t("receipts.form.supplier")}</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("receipts.form.selectSupplier")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label required>{t("receipts.form.receivingDate")}</Label>
              <Input
                type="date"
                value={receivingDate}
                onChange={(e) => setReceivingDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("receipts.form.batchType")}</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as "batch" | "final_batch")}
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="batch">
                  {t("status:batchType.batch")}
                </SelectItem>
                <SelectItem value="final_batch">
                  {t("status:batchType.final_batch")}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("receipts.form.finalBatchHint")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label required>{t("receipts.form.receiptImages")}</Label>
            <label className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("receipts.form.chooseImages")}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleAddImages(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>

            {receiptImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {receiptImages.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="relative rounded-xl border border-border overflow-hidden group"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImageAt(i)}
                      className="absolute top-1 inset-e-1 rounded-full bg-black/60 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                    <span className="absolute bottom-1 inset-s-1 rounded bg-black/60 text-white text-[10px] px-1.5 py-0.5">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {t("receipts.form.imagesCount", {
                count: receiptImages.length,
                max: MAX_IMAGES,
              })}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>{t("receipts.form.notes")}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("receipts.form.items")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!purchaseRequestId && (
            <p className="text-sm text-muted-foreground">
              {t("receipts.form.selectRequestFirst")}
            </p>
          )}
          {purchaseRequestId &&
            items.map((item, i) => {
              const options = availableItemsFor(i);
              const selectedItem = requestItems.find(
                (ri) => ri.id === item.purchaseRequestItemId,
              );
              const remaining = selectedItem
                ? Number(selectedItem.approvedQuantity ?? 0) -
                  Number(selectedItem.receivedQuantity ?? 0)
                : null;
              return (
                <div
                  key={i}
                  className="grid grid-cols-1 sm:grid-cols-6 gap-2 p-3 rounded-xl bg-muted/50"
                >
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">{t("receipts.form.item")}</Label>
                    <Select
                      value={item.purchaseRequestItemId}
                      onValueChange={(v) =>
                        updateItem(i, "purchaseRequestItemId", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("receipts.form.selectItem")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((ri) => (
                          <SelectItem key={ri.id} value={ri.id}>
                            {ri.variant?.variantName ?? ri.variantId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {remaining !== null && (
                      <p className="text-[11px] text-muted-foreground">
                        {t("receipts.form.remaining", { remaining })}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {t("receipts.form.quantity")}
                    </Label>
                    <Input
                      type="number"
                      min={0.0001}
                      step="any"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(i, "quantity", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {t("receipts.form.batchNumber")}
                    </Label>
                    <Input
                      value={item.batchNumber}
                      onChange={(e) =>
                        updateItem(i, "batchNumber", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {t("receipts.form.mfgDate")}
                    </Label>
                    <Input
                      type="date"
                      value={item.manufacturingDate}
                      onChange={(e) =>
                        updateItem(i, "manufacturingDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {t("receipts.form.expDate")}
                    </Label>
                    <Input
                      type="date"
                      value={item.expirationDate}
                      onChange={(e) =>
                        updateItem(i, "expirationDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {t("receipts.form.price")}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={item.purchasePrice}
                      onChange={(e) =>
                        updateItem(i, "purchasePrice", e.target.value)
                      }
                    />
                  </div>
                  <div className="sm:col-span-6 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(i)}
                    >
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                </div>
              );
            })}
          {purchaseRequestId && (
            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={items.length >= requestItems.length}
            >
              <Plus className="size-4" /> {t("receipts.form.addItem")}
            </Button>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => navigate(-1)}>
          {t("common:actions.cancel")}
        </Button>
        <Button onClick={handleSubmit} loading={creating}>
          {t("receipts.form.submit")}
        </Button>
      </div>
    </div>
  );
}
