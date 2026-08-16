import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Trash2 } from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable, { ColumnDef } from "@/components/shared/AppDataTable";
import AppErrorState from "@/components/shared/AppErrorState";
import AppEmptyState from "@/components/shared/AppEmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import DepartmentSelector, {
  useDepartmentSelector,
} from "@/components/shared/DepartmentSelector";
import { Button } from "@/components/primitive/button";
import { Badge } from "@/components/primitive/badge";
import { Label } from "@/components/primitive/label";
import { Skeleton } from "@/components/primitive/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/primitive/dialog";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDateTime } from "@/lib/formatters";
import type { DisposalTransfer } from "@/lib/apiTypes";
import {
  useGetDisposalCandidatesQuery,
  useGetDisposalTransfersQuery,
  useInitiateDisposalTransferMutation,
} from "@/api/disposal.api";
const STATUSES = ["all", "initiated", "confirmed", "cancelled"] as const;

export default function DisposalTransfersPage() {
  const { t } = useTranslation("disposal");
  const navigate = useNavigate();
  const canManage = usePermission(PERMISSIONS.MANAGE_DISPOSAL_TRANSFERS);

  const [deptId, setDeptId] = useState("");
  const {
    resolved,
    noAccess,
    isLoading: deptLoading,
    scoped,
    departments,
  } = useDepartmentSelector("disposal");

  useEffect(() => {
    if (resolved && !deptId) setDeptId(resolved.id);
  }, [resolved, deptId]);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");

  const { data, isLoading, isFetching, isError, refetch } =
    useGetDisposalTransfersQuery({
      page,
      limit: 20,
      ...(deptId ? { departmentId: deptId } : {}),
      ...(status !== "all" ? { status } : {}),
    });

  const [initiateOpen, setInitiateOpen] = useState(false);
  const [initiateDeptId, setInitiateDeptId] = useState("");
  const [initiateError, setInitiateError] = useState<string | null>(null);
  const [initiateTransfer, { isLoading: initiating }] =
    useInitiateDisposalTransferMutation();

  const { data: candidatesData, isFetching: candidatesFetching } =
    useGetDisposalCandidatesQuery(initiateDeptId, { skip: !initiateDeptId });
  const candidates = candidatesData?.data;
  const candidateCount =
    (candidates?.damaged.length ?? 0) +
    (candidates?.expired.length ?? 0) +
    (candidates?.nearExpiry.length ?? 0);

  function openInitiate() {
    setInitiateDeptId(deptId);
    setInitiateError(null);
    setInitiateOpen(true);
  }

  async function handleInitiate() {
    if (!initiateDeptId) {
      setInitiateError(t("transfers.selectDepartment"));
      return;
    }
    setInitiateError(null);
    try {
      const res = await initiateTransfer({
        departmentId: initiateDeptId,
      }).unwrap();
      setInitiateOpen(false);
      navigate(`/disposal/transfers/${res.data.id}`);
    } catch (e: unknown) {
      setInitiateError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  const columns: ColumnDef<DisposalTransfer>[] = [
    {
      key: "id",
      header: t("transfers.transferId"),
      cell: (r) => (
        <span className="font-mono text-xs">{r.id.slice(0, 8)}</span>
      ),
    },
    {
      key: "dept",
      header: t("transfers.department"),
      cell: (r) => r.department?.name,
    },
    {
      key: "items",
      header: t("transfers.items"),
      cell: (r) => r.items?.length ?? 0,
    },
    {
      key: "initiatedBy",
      header: t("transfers.initiatedBy"),
      cell: (r) => r.initiatedBy?.fullName,
    },
    {
      key: "date",
      header: t("transfers.date"),
      cell: (r) => formatDateTime(r.initiatedAt),
    },
    {
      key: "status",
      header: t("transfers.status"),
      cell: (r) => <StatusBadge status={r.status} domain="disposalTransfer" />,
    },
  ];

  if (deptLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-48 w-full" />
      </div>
    );

  if (noAccess) {
    return (
      <div className="p-6">
        <AppPageHeader title={t("title")} />
        <AppEmptyState title={t("noAccessTitle")} description={t("noAccess")} />
      </div>
    );
  }

  // Unrestricted users (scoped === false) can browse all departments' transfers.
  const canBrowseAllDepartments = !scoped;

  return (
    <div className="p-6">
      <AppPageHeader
        title={t("title")}
        actions={
          <div className="flex items-center gap-3">
            {canBrowseAllDepartments ? (
              <Select
                value={deptId || "__all__"}
                onValueChange={(v) => {
                  setDeptId(v === "__all__" ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-56">
                  <SelectValue
                    placeholder={t("common:filters.allDepartments")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">
                    {t("common:filters.all")}
                  </SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <DepartmentSelector
                context="disposal"
                value={deptId}
                onChange={(id) => setDeptId(id)}
              />
            )}
            {canManage && deptId && (
              <Button onClick={openInitiate}>
                <Trash2 className="size-4" />
                {t("transfers.initiate")}
              </Button>
            )}
            <Link to="/disposal/candidates">
              <Button variant="outline">
                <Search className="size-4" />
                {t("candidates.viewCandidates")}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex gap-3 mb-4 flex-wrap">
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s === "all"
                  ? t("common:filters.all")
                  : t(`status:disposalTransfer.${s}`, { defaultValue: s })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!deptId && !canBrowseAllDepartments ? (
        <p className="text-sm text-muted-foreground">{t("selectDepartment")}</p>
      ) : isError && !isLoading ? (
        <AppErrorState onRetry={() => refetch()} />
      ) : (
        <AppDataTable
          data={data?.data}
          columns={columns}
          isLoading={isLoading}
          isFetching={isFetching}
          rowKey={(r) => r.id}
          onPageChange={setPage}
          onRowClick={(r) => navigate(`/disposal/transfers/${r.id}`)}
        />
      )}

      {/* Initiate Dialog */}
      <Dialog open={initiateOpen} onOpenChange={setInitiateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("transfers.initiateTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label required>{t("transfers.department")}</Label>
              <DepartmentSelector
                context="disposal"
                value={initiateDeptId}
                onChange={(id) => setInitiateDeptId(id)}
              />
            </div>

            {initiateDeptId && (
              <div className="rounded-xl bg-muted/50 p-3 space-y-2">
                {candidatesFetching ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{t("transfers.checkingCandidates")}</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {t("transfers.candidatesFound", {
                        count: candidateCount,
                      })}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="danger">
                        {t("transfers.damagedCount", {
                          count: candidates?.damaged.length ?? 0,
                        })}
                      </Badge>
                      <Badge variant="warning">
                        {t("transfers.expiredCount", {
                          count: candidates?.expired.length ?? 0,
                        })}
                      </Badge>
                      <Badge variant="info">
                        {t("transfers.nearExpiryCount", {
                          count: candidates?.nearExpiry.length ?? 0,
                        })}
                      </Badge>
                    </div>
                    {candidateCount === 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t("transfers.nothingEligible")}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {initiateError && (
              <p className="text-xs text-danger">{initiateError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInitiateOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              onClick={handleInitiate}
              loading={initiating}
              disabled={!initiateDeptId || candidateCount === 0}
            >
              {t("transfers.initiate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
