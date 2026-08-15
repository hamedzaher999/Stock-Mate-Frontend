import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable, { ColumnDef } from "@/components/shared/AppDataTable";
import AppSearchInput from "@/components/shared/AppSearchInput";
import StatusBadge from "@/components/shared/StatusBadge";
import AppPermissionGate from "@/components/shared/AppPermissionGate";
import { Button } from "@/components/primitive/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/primitive/select";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/formatters";
import { useGetPurchaseReceiptsQuery } from "@/api/purchasing.api";
import type { PurchaseReceipt } from "@/lib/apiTypes";
import { Input } from "@/components/primitive/input";
const RECEIPT_STATUSES = [
  "pending_confirmation",
  "confirmed",
  "cancelled",
] as const;

export default function PurchaseReceiptsPage() {
  const { t } = useTranslation("purchasing");
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [purchaseRequestId, setPurchaseRequestId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetPurchaseReceiptsQuery({
    page,
    limit: 20,
    ...(purchaseRequestId ? { purchaseRequestId } : {}),
  });

  // Backend doesn't support search/status on this list endpoint yet,
  // so we filter client-side on the current page's results.
  const filteredItems = useMemo(() => {
    let items = data?.data?.items ?? [];
    if (status) {
      items = items.filter((r) => r.status === status);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.receivedBy?.fullName?.toLowerCase().includes(q) ||
          r.purchaseRequestId.toLowerCase().includes(q),
      );
    }
    return items;
  }, [data, status, search]);

  const columns: ColumnDef<PurchaseReceipt>[] = [
    {
      key: "id",
      header: t("receipts.receiptNumber"),
      cell: (r) => (
        <span className="font-mono text-xs">{r.id.slice(0, 8)}</span>
      ),
    },
    {
      key: "date",
      header: t("receipts.receivedDate"),
      cell: (r) => formatDate(r.receivingDate),
    },
    {
      key: "receivedBy",
      header: t("receipts.receivedBy"),
      cell: (r) => r.receivedBy?.fullName ?? "—",
    },
    {
      key: "confirmedBy",
      header: t("receipts.confirmedBy"),
      cell: (r) => r.confirmedBy?.fullName ?? "—",
    },
    {
      key: "status",
      header: t("receipts.status"),
      cell: (r) => <StatusBadge status={r.status} domain="purchaseReceipt" />,
    },
  ];

  return (
    <div className="p-6">
      <AppPageHeader
        title={t("receipts.title")}
        actions={
          <AppPermissionGate permission={PERMISSIONS.RECEIVE_PURCHASE}>
            <Button onClick={() => navigate("/purchasing/receipts/new")}>
              <Plus className="size-4 mr-2" />
              {t("receipts.new")}
            </Button>
          </AppPermissionGate>
        }
      />
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <AppSearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("receipts.searchPlaceholder")}
          className="max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder={t("common:filters.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("common:filters.all")}</SelectItem>
            {RECEIPT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status:purchaseReceipt.${s}`, {
                  defaultValue: s.replace(/_/g, " "),
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="w-64"
          placeholder={t("receipts.filterByPR")}
          value={purchaseRequestId}
          onChange={(e) => {
            setPurchaseRequestId(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <AppDataTable
        data={data?.data ? { ...data.data, items: filteredItems } : data?.data}
        columns={columns}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        onPageChange={setPage}
        onRowClick={(r) => navigate(`/purchasing/receipts/${r.id}`)}
      />
    </div>
  );
}
