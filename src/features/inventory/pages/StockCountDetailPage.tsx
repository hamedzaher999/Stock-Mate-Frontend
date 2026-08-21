import { Loader2 } from "lucide-react";
import AppErrorState from "@/components/shared/AppErrorState";
import AppEmptyState from "@/components/shared/AppEmptyState";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import {
  useGetStockCountByIdQuery,
  useAddStockCountItemMutation,
  useCompleteStockCountMutation,
  useCancelStockCountMutation,
} from "@/api/inventory.api";
import { useGetVariantsQuery } from "@/api/catalog.api";
import { useGetBatchesQuery } from "@/api/inventory.api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import { Button } from "@/components/primitive/button";
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
import { Skeleton } from "@/components/primitive/skeleton";
import StatusBadge from "@/components/shared/StatusBadge";
import AppPageHeader from "@/components/shared/AppPageHeader";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";
export default function StockCountDetailPage() {
  const { t } = useTranslation("inventory");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGetStockCountByIdQuery(id!);
  const session = data?.data;
  const [newItem, setNewItem] = useState({
    variantId: "",
    batchId: "",
    countedQuantity: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: variantData } = useGetVariantsQuery({
    isActive: true,
    limit: 100,
  } as { isActive: boolean; limit: number });
  const {
    data: batchData,
    isLoading: batchesLoading,
    isFetching: batchesFetching,
  } = useGetBatchesQuery(
    {
      variantId: newItem.variantId,
      departmentId: session?.departmentId,
      limit: 50,
    } as { variantId: string; departmentId: string; limit: number },
    { skip: !newItem.variantId || !session?.departmentId },
  );
  const batchesBusy = batchesLoading || batchesFetching;

  const [addItem, { isLoading: adding }] = useAddStockCountItemMutation();
  const [completeSession, { isLoading: completing }] =
    useCompleteStockCountMutation();
  const [cancelSession, { isLoading: cancelling }] =
    useCancelStockCountMutation();

  const [cancelOpen, setCancelOpen] = useState(false);

  async function handleAddItem() {
    if (!newItem.variantId || !newItem.batchId || !newItem.countedQuantity) {
      setFormError(t("stockCounts.allFieldsRequired"));
      return;
    }
    setFormError(null);
    try {
      await addItem({
        sessionId: id!,
        variantId: newItem.variantId,
        batchId: newItem.batchId,
        countedQuantity: parseInt(newItem.countedQuantity),
      }).unwrap();
      setNewItem({ variantId: "", batchId: "", countedQuantity: "" });
    } catch (e: unknown) {
      setFormError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  async function handleCancel() {
    try {
      await cancelSession(id!).unwrap();
      setCancelOpen(false);
      navigate("/inventory/stock-counts");
    } catch {
      // toastMiddleware surfaces the error; keep the dialog open to retry
    }
  }

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (isError) return <AppErrorState onRetry={() => refetch()} />;
  if (!session)
    return (
      <AppEmptyState
        title={t("stockCounts.sessionNotFound")}
        description={t("stockCounts.sessionNotFoundDescription", {
          defaultValue:
            "This stock count session may have been removed or you don't have access to it.",
        })}
      />
    );

  const isDraft = session.status === "draft";

  return (
    <div>
      <AppPageHeader
        title={`${t("stockCounts.title")} – ${session.department?.name}`}
        subtitle={`${t("stockCounts.countDate")}: ${session.countDate}`}
        actions={
          isDraft && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="text-danger border-danger/30 hover:bg-danger/5"
                onClick={() => {
                  setCancelOpen(true);
                }}
              >
                {t("stockCounts.cancel", { defaultValue: "Cancel" })}
              </Button>
              {session.items?.length > 0 && (
                <Button
                  onClick={() => completeSession(id!)}
                  loading={completing}
                >
                  {t("stockCounts.complete")}
                </Button>
              )}
            </div>
          )
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <StatusBadge status={session.status} domain="stockCount" />
        <span className="text-sm text-muted-foreground">
          {t("stockCounts.itemsCounted", { count: session.items?.length ?? 0 })}
        </span>
      </div>

      {/* Items table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("stockCounts.countedItems")}</CardTitle>
        </CardHeader>
        <CardContent>
          {session.items?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("stockCounts.noItems")}
            </p>
          )}
          <div className="space-y-2">
            {session.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    {item.variant?.variantName}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {item.batch?.batchNumber}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-end">
                    <p className="text-xs text-muted-foreground">
                      {t("stockCounts.expected")}
                    </p>
                    <p className="font-medium">{item.expectedQuantity}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-muted-foreground">
                      {t("stockCounts.counted")}
                    </p>
                    <p className="font-medium">{item.countedQuantity}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-muted-foreground">
                      {t("stockCounts.variance")}
                    </p>
                    <p
                      className={cn(
                        "font-bold tabular-nums",
                        item.variance < 0
                          ? "text-danger"
                          : item.variance > 0
                            ? "text-success"
                            : "text-muted-foreground",
                      )}
                    >
                      {item.variance > 0 ? "+" : ""}
                      {item.variance}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add item form */}
      {isDraft && (
        <Card>
          <CardHeader>
            <CardTitle>{t("stockCounts.addItem")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t("stockCounts.material")}</Label>
                <Select
                  value={newItem.variantId}
                  onValueChange={(v) =>
                    setNewItem({ ...newItem, variantId: v, batchId: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(variantData?.data?.items ?? []).map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.variantName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label required>{t("stockCounts.batch")}</Label>
                  {batchesBusy && (
                    <Loader2 className="size-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                <Select
                  value={newItem.batchId}
                  onValueChange={(v) => setNewItem({ ...newItem, batchId: v })}
                  disabled={!newItem.variantId || batchesLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        batchesLoading
                          ? t("stockCounts.loadingBatches", {
                              defaultValue: "Loading batches…",
                            })
                          : "Select batch..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {!batchesLoading &&
                      newItem.variantId &&
                      (batchData?.data?.items ?? []).length === 0 && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          {t("stockCounts.noBatchesAvailable", {
                            defaultValue: "No batches available.",
                          })}
                        </div>
                      )}
                    {(batchData?.data?.items ?? []).map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.batchNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("stockCounts.countedQuantity")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={newItem.countedQuantity}
                  onChange={(e) =>
                    setNewItem({ ...newItem, countedQuantity: e.target.value })
                  }
                />
              </div>
            </div>
            {formError && <p className="text-xs text-danger">{formError}</p>}
            <Button onClick={handleAddItem} loading={adding}>
              <PlusCircle className="size-4" /> {t("stockCounts.addItem")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cancel confirm dialog */}
      <ConfirmActionDialog
        open={cancelOpen}
        onOpenChange={(v) => !cancelling && setCancelOpen(v)}
        title={t("stockCounts.cancelTitle", {
          defaultValue: "Discard Stock Count",
        })}
        description={t("stockCounts.cancelWarning", {
          defaultValue:
            "This will discard this draft stock count and all counted items. This action cannot be undone.",
        })}
        confirmLabel={t("stockCounts.cancel", { defaultValue: "Discard" })}
        loading={cancelling}
        onConfirm={handleCancel}
      />
    </div>
  );
}
