import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FileDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import { Button } from "@/components/primitive/button";
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import { Skeleton } from "@/components/primitive/skeleton";
import AppPageHeader from "@/components/shared/AppPageHeader";

interface SummaryCard {
  label: string;
  value: string | number;
  color?: string;
}

interface ReportShellProps {
  title: string;
  subtitle?: string;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  filters?: ReactNode;
  onExport: () => void;
  exporting?: boolean;
  summaryCards: SummaryCard[];
  chart?: ReactNode;
  breakdownTitle?: string;
  breakdown?: ReactNode;
  table: ReactNode;
  isLoading?: boolean;
}

export default function ReportShell({
  title,
  subtitle,
  from,
  to,
  onFromChange,
  onToChange,
  filters,
  onExport,
  exporting,
  summaryCards,
  chart,
  breakdownTitle,
  breakdown,
  table,
  isLoading,
}: ReportShellProps) {
  const { t } = useTranslation("reports");

  return (
    <div className="p-6 space-y-6">
      <AppPageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button variant="outline" onClick={onExport} loading={exporting}>
            <FileDown className="size-4" />
            {t("exportExcel")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("filters.from")}</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => onFromChange(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("filters.to")}</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => onToChange(e.target.value)}
                className="w-40"
              />
            </div>
            {filters}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {summaryCards.map((c) => (
              <Card key={c.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {c.label}
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 ${c.color ?? "text-foreground"}`}
                  >
                    {c.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {chart && (
            <Card>
              <CardHeader>
                <CardTitle>{t("trend")}</CardTitle>
              </CardHeader>
              <CardContent>{chart}</CardContent>
            </Card>
          )}

          {breakdown && (
            <Card>
              <CardHeader>
                <CardTitle>{breakdownTitle ?? t("byDepartment")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">{breakdown}</CardContent>
            </Card>
          )}

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {table}
          </div>
        </>
      )}
    </div>
  );
}
