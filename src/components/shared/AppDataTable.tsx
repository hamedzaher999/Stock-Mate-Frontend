import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/primitive/skeleton";
import AppEmptyState from "./AppEmptyState";
import AppPagination from "./AppPagination";
import { Loader2 } from "lucide-react";
export interface ColumnDef<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface AppDataTableProps<T> {
  data?: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  /** True on every fetch including background refetches (e.g. RTK Query's `isFetching`). */
  isFetching?: boolean;
  onPageChange?: (p: number) => void;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export default function AppDataTable<T>({
  data,
  columns,
  isLoading,
  isFetching,
  onPageChange,
  rowKey,
  onRowClick,
}: AppDataTableProps<T>) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];

  if (!items.length) {
    // Still show a subtle fetching hint if a refetch is in flight over an empty result
    // (e.g. filters changed and we're waiting on the new, possibly non-empty, page).
    if (isFetching) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm">
            {t("table.updating", { defaultValue: "Updating…" })}
          </p>
        </div>
      );
    }
    return <AppEmptyState />;
  }

  const showRefetchOverlay = !!isFetching && !isLoading;

  return (
    <div className="relative">
      <div
        className={
          showRefetchOverlay
            ? "pointer-events-none opacity-60 transition-opacity duration-150"
            : "transition-opacity duration-150"
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wide ${col.className ?? ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${col.className ?? ""}`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && onPageChange && (
          <AppPagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            limit={data.limit}
            onPageChange={onPageChange}
          />
        )}
      </div>

      {showRefetchOverlay && (
        <div className="absolute inset-0 flex items-start justify-center pt-10">
          <div className="flex items-center gap-2 rounded-full bg-card border border-border shadow-md px-3 py-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            <span>{t("table.updating", { defaultValue: "Updating…" })}</span>
          </div>
        </div>
      )}
    </div>
  );
}
