import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/primitive/skeleton";
import AppEmptyState from "./AppEmptyState";
import AppPagination from "./AppPagination";

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface AppDataTableProps<T> {
  data?: { items: T[]; total: number; page: number; limit: number; totalPages: number };
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  onPageChange?: (p: number) => void;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export default function AppDataTable<T>({
  data,
  columns,
  isLoading,
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
    return <AppEmptyState />;
  }

  return (
    <div>
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
                  <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
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
  );
}
