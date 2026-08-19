import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useGetLiveStockQuery } from "@/api/inventory.api";
import { Card, CardContent } from "@/components/primitive/card";
import { Badge } from "@/components/primitive/badge";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppPagination from "@/components/shared/AppPagination";
import AppEmptyState from "@/components/shared/AppEmptyState";
import { Skeleton } from "@/components/primitive/skeleton";
import { formatDate, isExpired } from "@/lib/formatters";
import DepartmentSelector, {
  useDepartmentSelector,
} from "@/components/shared/DepartmentSelector";
import type { LiveStockRow } from "@/lib/apiTypes";
import { cn } from "@/lib/utils";
import AppErrorState from "@/components/shared/AppErrorState";
const EXPIRY_WARNING_DAYS = 15;

function isExpiringSoonDays(
  dateStr: string | undefined | null,
  days: number,
): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);
  return d.getTime() <= threshold.getTime() && d.getTime() > Date.now();
}

function StockCard({
  row,
  thresholds,
}: {
  row: LiveStockRow;
  thresholds?: { minimumStock?: number; maximumStock?: number };
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation("inventory");

  const belowMin =
    thresholds?.minimumStock != null &&
    row.totalQuantity < thresholds.minimumStock;
  const aboveMax =
    thresholds?.maximumStock != null &&
    row.totalQuantity > thresholds.maximumStock;

  const hasExpiredBatch = row.batches?.some((b) => isExpired(b.expirationDate));
  const hasExpiringBatch = row.batches?.some(
    (b) =>
      !isExpired(b.expirationDate) &&
      isExpiringSoonDays(b.expirationDate, EXPIRY_WARNING_DAYS),
  );

  return (
    <Card>
      <CardContent className="p-4">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="text-start">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{row.variantName}</p>
              {belowMin && (
                <Badge variant="danger">{t("liveStock.belowMin")}</Badge>
              )}
              {aboveMax && (
                <Badge variant="warning">{t("liveStock.aboveMax")}</Badge>
              )}
              {hasExpiredBatch && (
                <Badge variant="danger">{t("liveStock.hasExpired")}</Badge>
              )}
              {!hasExpiredBatch && hasExpiringBatch && (
                <Badge variant="warning">
                  {t("liveStock.hasExpiringSoon")}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {row.sku} · {row.product?.name}
            </p>
            {thresholds &&
              (thresholds.minimumStock != null ||
                thresholds.maximumStock != null) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("liveStock.thresholdRange", {
                    min: thresholds.minimumStock ?? "—",
                    max: thresholds.maximumStock ?? "—",
                  })}
                </p>
              )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-end">
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  belowMin && "text-danger",
                  aboveMax && "text-warning",
                )}
              >
                {row.totalQuantity}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.unit?.abbreviation ?? row.unit?.name}
              </p>
            </div>
            {expanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </button>
        {expanded && (
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            {row.batches?.map((b) => {
              const expired = isExpired(b.expirationDate);
              const expiring =
                !expired &&
                isExpiringSoonDays(b.expirationDate, EXPIRY_WARNING_DAYS);
              return (
                <div
                  key={b.batchId}
                  className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-mono font-medium">
                      {b.batchNumber}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        Exp: {formatDate(b.expirationDate)}
                      </p>
                      {expired && (
                        <Badge variant="danger">{t("liveStock.expired")}</Badge>
                      )}
                      {expiring && (
                        <Badge variant="warning">
                          {t("liveStock.expiringSoon")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {b.quantity}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LiveStockPage() {
  const { t } = useTranslation("inventory");
  const [deptId, setDeptId] = useState("");
  const [page, setPage] = useState(1);

  const {
    resolved,
    noAccess,
    isLoading: deptLoading,
  } = useDepartmentSelector("stock");

  useEffect(() => {
    if (resolved && !deptId) {
      setDeptId(resolved.id);
    }
  }, [resolved, deptId]);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetLiveStockQuery(
      { departmentId: deptId, page, limit: 20 },
      { skip: !deptId },
    );

  if (deptLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-48 w-full" />
      </div>
    );

  if (noAccess) {
    return (
      <div>
        <AppPageHeader title={t("liveStock.title")} />
        <AppEmptyState
          title={t("common:forbidden")}
          description={t("liveStock.noAccess")}
        />
      </div>
    );
  }

  const items = data?.data?.items ?? [];
  const showInitialSkeleton = isLoading;
  const showRefetchOverlay = isFetching && !isLoading;

  return (
    <div>
      <AppPageHeader title={t("liveStock.title")} />
      <div className="mb-6">
        <DepartmentSelector
          context="stock"
          value={deptId}
          onChange={(id) => {
            setDeptId(id);
            setPage(1);
          }}
        />
      </div>

      {!deptId && (
        <p className="text-muted-foreground text-sm">
          {t("liveStock.selectDepartment")}
        </p>
      )}

      {deptId && showInitialSkeleton && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {deptId && isError && !showInitialSkeleton && (
        <AppErrorState onRetry={() => refetch()} />
      )}

      {deptId &&
        !showInitialSkeleton &&
        !isError &&
        items.length === 0 &&
        !showRefetchOverlay && (
          <AppEmptyState
            title={t("liveStock.emptyTitle", {
              defaultValue: "No stock found",
            })}
            description={t("liveStock.emptyDescription", {
              defaultValue: "This department has no recorded stock yet.",
            })}
          />
        )}

      {deptId &&
        !showInitialSkeleton &&
        !isError &&
        (items.length > 0 || showRefetchOverlay) && (
          <div className="relative">
            <div
              className={
                showRefetchOverlay
                  ? "pointer-events-none opacity-60 transition-opacity duration-150 space-y-3"
                  : "transition-opacity duration-150 space-y-3"
              }
            >
              {items.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : (
                items.map((row) => (
                  <StockCard
                    key={row.variantId}
                    row={row}
                    thresholds={{
                      minimumStock: row.minimumStock ?? undefined,
                      maximumStock: row.maximumStock ?? undefined,
                    }}
                  />
                ))
              )}
              {data?.data && items.length > 0 && (
                <AppPagination
                  page={data.data.page}
                  totalPages={data.data.totalPages}
                  total={data.data.total}
                  limit={data.data.limit}
                  onPageChange={setPage}
                />
              )}
            </div>

            {showRefetchOverlay && (
              <div className="absolute inset-0 flex items-start justify-center pt-10">
                <div className="flex items-center gap-2 rounded-full bg-card border border-border shadow-md px-3 py-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>
                    {t("liveStock.updating", { defaultValue: "Updating…" })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
