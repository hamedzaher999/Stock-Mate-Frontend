import { useTranslation } from "react-i18next";
import { Button } from "@/components/primitive/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface AppPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}

export default function AppPagination({ page, totalPages, total, limit, onPageChange }: AppPaginationProps) {
  const { t } = useTranslation();
  const from = Math.min((page - 1) * limit + 1, total);
  const to = Math.min(page * limit, total);

  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 border-t border-border">
      <p className="text-xs text-muted-foreground">
        {t("table.showing", { from, to, total })}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => onPageChange(1)} disabled={page === 1} className="h-8 w-8">
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onPageChange(page - 1)} disabled={page === 1} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm px-2 min-w-[80px] text-center">
          {page} / {totalPages}
        </span>
        <Button variant="ghost" size="icon" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} className="h-8 w-8">
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
