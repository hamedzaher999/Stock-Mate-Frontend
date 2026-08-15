import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CheckCircle,
  Pencil,
  RotateCcw,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import { Button } from "@/components/primitive/button";
import { Skeleton } from "@/components/primitive/skeleton";
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import AppPermissionGate from "@/components/shared/AppPermissionGate";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate, formatCurrency } from "@/lib/formatters";
import {
  useGetPurchaseReceiptByIdQuery,
  useConfirmPurchaseReceiptMutation,
  useCancelPurchaseReceiptMutation,
  useGetPurchaseReceiptImagesQuery,
  useUpdatePurchaseReceiptMutation,
} from "@/api/purchasing.api";
export default function PurchaseReceiptDetailPage() {
  const { t } = useTranslation("purchasing");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useGetPurchaseReceiptByIdQuery(id!);
  const receipt = data?.data;

  const { data: imagesData, isLoading: imagesLoading } =
    useGetPurchaseReceiptImagesQuery(id!, { skip: !id });
  const images = imagesData?.data ?? [];

  const [confirmReceipt, { isLoading: confirming }] =
    useConfirmPurchaseReceiptMutation();
  const [cancelReceipt] = useCancelPurchaseReceiptMutation();
  const [updateReceipt, { isLoading: updatingImages }] =
    useUpdatePurchaseReceiptMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmedQuantities, setConfirmedQuantities] = useState<
    Record<string, number>
  >({});
  const [confirmNotes, setConfirmNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Image management (edit) state
  const [manageOpen, setManageOpen] = useState(false);
  const [removeImageIds, setRemoveImageIds] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  if (isLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!receipt)
    return (
      <div className="p-6 text-muted-foreground">
        {t("common:actions.notFound")}
      </div>
    );

  const canConfirm = receipt.status === "pending_confirmation";
  const canEditOrCancel = receipt.status === "pending_confirmation";

  const remainingAfterEdit =
    images.length - removeImageIds.length + newImages.length;

  function openConfirm() {
    const qty: Record<string, number> = {};
    receipt!.items?.forEach((item) => {
      qty[item.id] = Number(item.quantity);
    });
    setConfirmedQuantities(qty);
    setError(null);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setError(null);
    try {
      await confirmReceipt({
        id: receipt!.id,
        notes: confirmNotes || undefined,
        items: receipt!.items.map((item) => ({
          purchaseReceiptItemId: item.id,
          confirmedQuantity:
            confirmedQuantities[item.id] ?? Number(item.quantity),
        })),
      }).unwrap();
      setConfirmOpen(false);
    } catch (e: unknown) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  async function handleCancel() {
    await cancelReceipt(receipt!.id);
  }

  function openManageImages() {
    setRemoveImageIds([]);
    setNewImages([]);
    setImageError(null);
    setManageOpen(true);
  }

  function toggleRemoveImage(imageId: string) {
    setRemoveImageIds((prev) =>
      prev.includes(imageId)
        ? prev.filter((x) => x !== imageId)
        : [...prev, imageId],
    );
  }

  function handleAddNewImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    setNewImages((prev) => [...prev, ...Array.from(files)]);
  }

  function removeNewImageAt(i: number) {
    setNewImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSaveImages() {
    setImageError(null);
    if (remainingAfterEdit < 1) {
      setImageError(t("receipts.detail.mustKeepOneImage"));
      return;
    }

    const formData = new FormData();
    if (removeImageIds.length > 0) {
      formData.append("removeImageIds", JSON.stringify(removeImageIds));
    }
    newImages.forEach((file) => formData.append("newImages", file));

    try {
      await updateReceipt({
        id: receipt!.id,
        data: formData as unknown as {
          receivingDate?: string;
          notes?: string;
          items?: unknown[];
        },
      }).unwrap();
      setManageOpen(false);
    } catch (e: unknown) {
      setImageError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  return (
    <div className="p-6 space-y-6">
      <AppPageHeader
        title={t("receipts.detail.title", {
          id: receipt.id.slice(0, 8),
        })}
        subtitle={formatDate(receipt.receivingDate)}
        actions={
          <StatusBadge status={receipt.status} domain="purchaseReceipt" />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("receipts.detail.items")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("receipts.detail.material")}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("receipts.detail.batch")}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("receipts.detail.qty")}
                      </th>
                      {receipt.status === "confirmed" && (
                        <th className="px-3 py-2 text-start font-medium">
                          {t("receipts.detail.confirmedQty")}
                        </th>
                      )}
                      <th className="px-3 py-2 text-start font-medium">
                        {t("receipts.detail.expDate")}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("receipts.detail.price")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items?.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2">
                          {item.variant?.variantName ?? item.variantId}
                        </td>
                        <td className="px-3 py-2">
                          <code className="text-xs bg-muted px-1 rounded">
                            {item.batchNumber}
                          </code>
                        </td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        {receipt.status === "confirmed" && (
                          <td className="px-3 py-2">
                            {item.confirmedQuantity ?? "—"}
                          </td>
                        )}
                        <td className="px-3 py-2">
                          {formatDate(item.expirationDate)}
                        </td>
                        <td className="px-3 py-2">
                          {formatCurrency(item.purchasePrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {receipt.notes && (
            <p className="text-sm text-muted-foreground">
              {t("receipts.detail.notes")}: {receipt.notes}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("receipts.detail.receivedBy")}
                </span>
                <span>{receipt.receivedBy?.fullName}</span>
              </div>
              {receipt.confirmedBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("receipts.detail.confirmedBy")}
                  </span>
                  <span>{receipt.confirmedBy.fullName}</span>
                </div>
              )}
              {receipt.confirmedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("receipts.detail.confirmedAt")}
                  </span>
                  <span>{formatDate(receipt.confirmedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {t("receipts.detail.receiptImages", { count: images.length })}
              </CardTitle>
              <AppPermissionGate permission={PERMISSIONS.RECEIVE_PURCHASE}>
                {canEditOrCancel && (
                  <Button variant="ghost" size="sm" onClick={openManageImages}>
                    <Pencil className="size-4" />
                  </Button>
                )}
              </AppPermissionGate>
            </CardHeader>
            <CardContent>
              {imagesLoading && (
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              )}
              {!imagesLoading && images.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("receipts.detail.noImages")}
                </p>
              )}
              {!imagesLoading && images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className="rounded-xl border border-border overflow-hidden hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={img.url}
                        alt={t("receipts.detail.receiptImageAlt", {
                          n: i + 1,
                        })}
                        className="w-full h-24 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <AppPermissionGate permission={PERMISSIONS.CONFIRM_PURCHASE_RECEIPT}>
          {canConfirm && (
            <Button onClick={openConfirm} disabled={confirming}>
              <CheckCircle className="size-4 mr-2" />
              {t("receipts.detail.confirm")}
            </Button>
          )}
        </AppPermissionGate>
        <AppPermissionGate permission={PERMISSIONS.RECEIVE_PURCHASE}>
          {canEditOrCancel && (
            <Button variant="destructive" onClick={handleCancel}>
              <XCircle className="size-4 mr-2" />
              {t("receipts.detail.cancel")}
            </Button>
          )}
        </AppPermissionGate>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          {t("common:actions.back")}
        </Button>
      </div>

      {/* Confirm receipt dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("receipts.detail.confirmTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {receipt.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <p className="flex-1 text-sm">
                  {item.variant?.variantName ?? item.variantId}
                </p>
                <div className="w-32">
                  <Label className="text-xs">
                    {t("receipts.detail.qtyMax", { max: item.quantity })}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={item.quantity}
                    value={confirmedQuantities[item.id] ?? item.quantity}
                    onChange={(e) =>
                      setConfirmedQuantities((prev) => ({
                        ...prev,
                        [item.id]: Math.min(
                          Number(e.target.value),
                          item.quantity,
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>{t("receipts.form.notes")}</Label>
              <Input
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
              />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleConfirm} loading={confirming}>
              {t("receipts.detail.confirmBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage images dialog (add/remove) */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("receipts.detail.manageImages")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {images.length > 0 && (
              <div className="space-y-1.5">
                <Label>{t("receipts.detail.existingImages")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img) => {
                    const marked = removeImageIds.includes(img.id);
                    return (
                      <div
                        key={img.id}
                        className={`relative rounded-xl border overflow-hidden ${marked ? "border-danger" : "border-border"}`}
                      >
                        <img
                          src={img.url}
                          alt=""
                          className={`w-full h-20 object-cover ${marked ? "opacity-40" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleRemoveImage(img.id)}
                          className={`absolute top-1 inset-e-1 rounded-full p-1 text-white ${marked ? "bg-danger" : "bg-black/60"}`}
                          title={
                            marked
                              ? t("receipts.detail.undoRemove")
                              : t("receipts.detail.markRemove")
                          }
                        >
                          {marked ? (
                            <RotateCcw className="size-3" />
                          ) : (
                            <X className="size-3" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>{t("receipts.detail.addImages")}</Label>
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
                    handleAddNewImages(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              {newImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {newImages.map((file, i) => (
                    <div
                      key={`${file.name}-${i}`}
                      className="relative rounded-xl border border-border overflow-hidden"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-20 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImageAt(i)}
                        className="absolute top-1 inset-e-1 rounded-full bg-black/60 text-white p-1"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {t("receipts.detail.remainingAfterSave", {
                count: remainingAfterEdit,
              })}
            </p>
            {imageError && <p className="text-xs text-danger">{imageError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleSaveImages} loading={updatingImages}>
              {t("common:actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(v) => !v && setLightboxIndex(null)}
      >
        <DialogContent className="max-w-3xl">
          {lightboxIndex !== null && images[lightboxIndex] && (
            <div className="space-y-3">
              <img
                src={images[lightboxIndex].url}
                alt=""
                className="w-full max-h-[75vh] object-contain rounded-xl"
              />
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={lightboxIndex === 0}
                  onClick={() =>
                    setLightboxIndex((i) => (i !== null ? i - 1 : i))
                  }
                >
                  {t("common:actions.back")}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {lightboxIndex + 1} / {images.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={lightboxIndex === images.length - 1}
                  onClick={() =>
                    setLightboxIndex((i) => (i !== null ? i + 1 : i))
                  }
                >
                  {t("receipts.detail.next")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
