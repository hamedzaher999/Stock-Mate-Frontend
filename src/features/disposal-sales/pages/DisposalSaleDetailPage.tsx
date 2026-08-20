import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle, Upload, ImageOff } from "lucide-react";
import { Button } from "@/components/primitive/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import { Skeleton } from "@/components/primitive/skeleton";
import { Textarea } from "@/components/primitive/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppErrorState from "@/components/shared/AppErrorState";
import AppEmptyState from "@/components/shared/AppEmptyState";
import AppPermissionGate from "@/components/shared/AppPermissionGate";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/formatters";
import {
  useGetDisposalSaleRequestByIdQuery,
  useGetDisposalSaleImagesQuery,
  useApproveDisposalSaleRequestMutation,
  useRejectDisposalSaleRequestMutation,
  useCancelDisposalSaleRequestMutation,
  useAddDisposalSaleImagesMutation,
  useConfirmDisposalSaleRequestMutation,
} from "@/api/disposalSales.api";
import { usePermission, useCurrentUser } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";

export default function DisposalSaleDetailPage() {
  const { t } = useTranslation("disposal");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const { data, isLoading, isError, refetch } =
    useGetDisposalSaleRequestByIdQuery(id!);
  const request = data?.data;

  const {
    data: imagesData,
    isLoading: imagesLoading,
    isError: imagesError,
    refetch: refetchImages,
  } = useGetDisposalSaleImagesQuery(id!, { skip: !id });
  const images = imagesData?.data ?? [];

  const canApprove = usePermission(PERMISSIONS.APPROVE_DISPOSAL_SALE_REQUEST);
  const canCreate = usePermission(PERMISSIONS.CREATE_DISPOSAL_SALE_REQUEST);

  const [approve, { isLoading: approving }] =
    useApproveDisposalSaleRequestMutation();
  const [reject, { isLoading: rejecting }] =
    useRejectDisposalSaleRequestMutation();
  const [cancel] = useCancelDisposalSaleRequestMutation();
  const [addImages, { isLoading: uploadingImages }] =
    useAddDisposalSaleImagesMutation();
  const [confirmSale, { isLoading: confirming }] =
    useConfirmDisposalSaleRequestMutation();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (isLoading)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (isError)
    return (
      <div className="p-6">
        <AppErrorState onRetry={() => refetch()} />
      </div>
    );
  if (!request)
    return (
      <div className="p-6">
        <AppEmptyState
          title={t("sales.notFound")}
          description={t("sales.notFoundDescription")}
        />
      </div>
    );

  const isOwner = request.requestedById === currentUser?.id;
  const isPendingApproval = request.status === "pending_approval";
  const isAwaitingConfirmation = request.status === "awaiting_confirmation";

  const canApproveThis = isPendingApproval && canApprove;
  const canRejectThis = isPendingApproval && canApprove;
  const canCancelThis = isPendingApproval && isOwner && canCreate;
  const canManageImages = isAwaitingConfirmation && canCreate;
  const canConfirmThis =
    isAwaitingConfirmation && canCreate && request.images.length > 0;

  const total = request.items.reduce((s, i) => s + i.quantity * i.price, 0);

  function openUploadDialog() {
    setPendingFiles([]);
    setUploadError(null);
    setUploadOpen(true);
  }

  function handleSelectFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  }

  function removePendingFile(i: number) {
    setPendingFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleUpload() {
    setUploadError(null);
    if (pendingFiles.length === 0) {
      setUploadError(t("sales.imagesRequired"));
      return;
    }
    const formData = new FormData();
    pendingFiles.forEach((f) => formData.append("images", f));
    try {
      await addImages({ id: request!.id, formData }).unwrap();
      setUploadOpen(false);
    } catch (e: unknown) {
      setUploadError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  async function handleConfirm() {
    setConfirmError(null);
    try {
      await confirmSale(request!.id).unwrap();
      setConfirmOpen(false);
    } catch (e: unknown) {
      setConfirmError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  return (
    <div className="p-6 space-y-6">
      <AppPageHeader
        title={t("sales.detail.title", { id: request.id.slice(0, 8) })}
        subtitle={formatDateTime(request.createdAt)}
        actions={
          <StatusBadge status={request.status} domain="disposalSaleRequest" />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("sales.items")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("sales.detail.material")}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("sales.detail.batch")}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("sales.detail.qty")}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("sales.detail.price")}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t("sales.detail.lineTotal")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.items?.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2">
                          {item.variant?.variantName ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <code className="text-xs bg-muted px-1 rounded">
                            {item.batch?.batchNumber}
                          </code>
                        </td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        <td className="px-3 py-2">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {formatCurrency(item.quantity * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/50">
                      <td
                        colSpan={4}
                        className="px-3 py-2 text-end font-medium"
                      >
                        {t("sales.total")}
                      </td>
                      <td className="px-3 py-2 font-bold">
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {request.notes && (
            <p className="text-sm text-muted-foreground">
              {t("sales.detail.notes")}: {request.notes}
            </p>
          )}

          {request.status === "rejected" && request.rejectionReason && (
            <Card className="border-danger/30 bg-danger/5">
              <CardContent className="p-4">
                <p className="text-xs text-danger font-medium uppercase tracking-wide">
                  {t("sales.detail.rejectionReason")}
                </p>
                <p className="text-sm mt-1">{request.rejectionReason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("sales.detail.destination")}
                </span>
                <span>{request.destination?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("sales.detail.requestedBy")}
                </span>
                <span>{request.requestedBy?.fullName}</span>
              </div>
              {request.approvedBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("sales.detail.approvedBy")}
                  </span>
                  <span>{request.approvedBy.fullName}</span>
                </div>
              )}
              {request.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("sales.detail.approvedAt")}
                  </span>
                  <span>{formatDate(request.approvedAt)}</span>
                </div>
              )}
              {request.confirmedBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("sales.detail.confirmedBy")}
                  </span>
                  <span>{request.confirmedBy.fullName}</span>
                </div>
              )}
              {request.confirmedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("sales.detail.confirmedAt")}
                  </span>
                  <span>{formatDate(request.confirmedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {t("sales.imagesCount", { count: images.length })}
              </CardTitle>
              <AppPermissionGate
                permission={PERMISSIONS.CREATE_DISPOSAL_SALE_REQUEST}
              >
                {canManageImages && (
                  <Button variant="ghost" size="sm" onClick={openUploadDialog}>
                    <Upload className="size-4" />
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
              {!imagesLoading && imagesError && (
                <AppErrorState
                  title={t("sales.imagesErrorTitle", {
                    defaultValue: "Couldn't load images",
                  })}
                  description=""
                  onRetry={() => refetchImages()}
                />
              )}
              {!imagesLoading && !imagesError && images.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                  <ImageOff className="size-6 opacity-50" />
                  <p className="text-sm">{t("sales.noImages")}</p>
                </div>
              )}
              {!imagesLoading && !imagesError && images.length > 0 && (
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
                        alt={t("sales.imageAlt", {
                          n: i + 1,
                          defaultValue: `Image ${i + 1}`,
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
        <AppPermissionGate
          permission={PERMISSIONS.APPROVE_DISPOSAL_SALE_REQUEST}
        >
          {canApproveThis && (
            <Button onClick={() => approve(request.id)} loading={approving}>
              <CheckCircle className="size-4 mr-2" />
              {t("sales.approve")}
            </Button>
          )}
          {canRejectThis && (
            <Button variant="destructive" onClick={() => setRejectOpen(true)}>
              <XCircle className="size-4 mr-2" />
              {t("sales.reject")}
            </Button>
          )}
        </AppPermissionGate>
        <AppPermissionGate
          permission={PERMISSIONS.CREATE_DISPOSAL_SALE_REQUEST}
        >
          {canConfirmThis && (
            <Button onClick={() => setConfirmOpen(true)}>
              <CheckCircle className="size-4 mr-2" />
              {t("sales.confirm")}
            </Button>
          )}
          {canCancelThis && (
            <Button variant="outline" onClick={() => cancel(request.id)}>
              {t("sales.cancel")}
            </Button>
          )}
        </AppPermissionGate>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          {t("common:actions.back")}
        </Button>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sales.rejectTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("sales.reason")}</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setRejectConfirmOpen(true)}
              disabled={!rejectReason}
            >
              {t("sales.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={rejectConfirmOpen}
        onOpenChange={(v) => !rejecting && setRejectConfirmOpen(v)}
        title={t("sales.rejectTitle")}
        description={t("common:confirmReject.description", {
          defaultValue:
            "This will reject the request and notify the requester. This action cannot be undone.",
        })}
        confirmLabel={t("sales.reject")}
        loading={rejecting}
        onConfirm={async () => {
          if (rejecting) return;
          try {
            await reject({ id: request.id, reason: rejectReason }).unwrap();
            setRejectConfirmOpen(false);
            setRejectOpen(false);
            setRejectReason("");
          } catch {
            // keep dialog open on failure so the user can retry
          }
        }}
      />
      {/* Upload Images Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("sales.uploadImages")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("sales.uploadImages")}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleSelectFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {pendingFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {pendingFiles.map((file, i) => (
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
                      onClick={() => removePendingFile(i)}
                      className="absolute top-1 inset-e-1 rounded-full bg-black/60 text-white p-1"
                    >
                      <XCircle className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {uploadError && (
              <p className="text-xs text-danger">{uploadError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleUpload} loading={uploadingImages}>
              {t("sales.addImages")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Sale Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sales.confirm")}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground bg-info/10 rounded-xl px-3 py-2">
            {t("sales.confirmHint")}
          </p>
          {confirmError && (
            <p className="text-xs text-danger mt-2">{confirmError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleConfirm} loading={confirming}>
              {t("sales.confirmBtn")}
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
                  {t("receipts.detail.next", { defaultValue: "Next" })}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
