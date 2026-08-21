import {
  useGetSupplierByIdQuery,
  useGetSupplierVariantsQuery,
} from "@/api/suppliers.api";
import { Button } from "@/components/primitive/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import { Skeleton } from "@/components/primitive/skeleton";
import AppDataTable, { ColumnDef } from "@/components/shared/AppDataTable";
import AppEmptyState from "@/components/shared/AppEmptyState";
import AppErrorState from "@/components/shared/AppErrorState";
import AppPageHeader from "@/components/shared/AppPageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { VariantListItem } from "@/lib/apiTypes";
import { formatDate } from "@/lib/formatters";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

export default function SupplierDetailPage() {
  const { t } = useTranslation("suppliers");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useGetSupplierByIdQuery(id!);
  const supplier = data?.data;

  const [page, setPage] = useState(1);
  const {
    data: variantsData,
    isLoading: variantsLoading,
    isFetching: variantsFetching,
    isError: variantsError,
    refetch: refetchVariants,
  } = useGetSupplierVariantsQuery({ id: id!, page, limit: 20 }, { skip: !id });

  const columns: ColumnDef<VariantListItem>[] = [
    {
      key: "name",
      header: t("common:variants.variantName", { defaultValue: "Variant" }),
      cell: (r) => <span className="font-medium">{r.variantName}</span>,
    },
    {
      key: "sku",
      header: t("common:variants.sku", { defaultValue: "SKU" }),
      cell: (r) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.sku}</code>
      ),
    },
    {
      key: "product",
      header: t("common:variants.product", { defaultValue: "Product" }),
      cell: (r) => r.product?.name ?? "—",
    },
    {
      key: "unit",
      header: t("common:variants.unit", { defaultValue: "Unit" }),
      cell: (r) => r.unit?.abbreviation ?? r.unit?.name ?? "—",
    },
    {
      key: "status",
      header: t("common:variants.status", { defaultValue: "Status" }),
      cell: (r) => (
        <StatusBadge
          status={r.isActive ? "active" : "inactive"}
          domain="user"
        />
      ),
    },
  ];

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
  if (!supplier)
    return (
      <div className="p-6">
        <AppEmptyState
          title={t("common:actions.notFound")}
          description={t("detail.notFoundDescription", {
            defaultValue:
              "This supplier may have been removed or you don't have access to it.",
          })}
        />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <AppPageHeader
        title={supplier.name}
        subtitle={t("detail.createdAt", {
          date: formatDate(supplier.createdAt),
          defaultValue: `Added ${formatDate(supplier.createdAt)}`,
        })}
        actions={
          <StatusBadge
            status={supplier.isActive ? "active" : "inactive"}
            domain="user"
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("detail.suppliedVariants", {
                  defaultValue: "Supplied Variants",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {variantsError && !variantsLoading ? (
                <div className="p-4">
                  <AppErrorState onRetry={() => refetchVariants()} />
                </div>
              ) : (
                <AppDataTable
                  data={variantsData?.data}
                  columns={columns}
                  isLoading={variantsLoading}
                  isFetching={variantsFetching}
                  rowKey={(r) => r.id}
                  onPageChange={setPage}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("fields.phone")}
                </span>
                <span>{supplier.phone ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("fields.email")}
                </span>
                <span>{supplier.email ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("fields.address")}
                </span>
                <span className="text-end max-w-48">
                  {supplier.address ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("detail.registered", { defaultValue: "Registered" })}
                </span>
                <span>{formatDate(supplier.createdAt)}</span>
              </div>
              {supplier.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("detail.lastUpdated", { defaultValue: "Last updated" })}
                  </span>
                  <span>{formatDate(supplier.updatedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Button variant="ghost" onClick={() => navigate(-1)}>
        {t("common:actions.back")}
      </Button>
    </div>
  );
}
