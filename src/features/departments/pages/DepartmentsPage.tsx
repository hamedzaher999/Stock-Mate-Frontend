import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable from "@/components/shared/AppDataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/primitive/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import { Input } from "@/components/primitive/input";
import { Label } from "@/components/primitive/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitive/select";
import { Switch } from "@/components/primitive/switch";

import { formatDate } from "@/lib/formatters";
import type { Department } from "@/lib/apiTypes";
import type { ColumnDef } from "@/components/shared/AppDataTable";
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import { Skeleton } from "@/components/primitive/skeleton";
import { useGetUsersQuery } from "@/api/users.api";
import {
  useUpdateDepartmentMutation,
  useUpdateDepartmentManagerMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentStatusMutation,
} from "@/api/departments.api";
import AppErrorState from "@/components/shared/AppErrorState";
import AppSearchInput from "@/components/shared/AppSearchInput";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
const DEPT_TYPES = [
  "clinical",
  "pharmacy",
  "warehouse",
  "administrative",
  "central_warehouse",
  "standard",
];

export default function DepartmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");

  const { data, isLoading, isFetching, isError, refetch } =
    useGetDepartmentsQuery({
      page,
      limit: 20,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(statusFilter ? { isActive: statusFilter === "active" } : {}),
      ...(managerFilter ? { hasManager: managerFilter === "yes" } : {}),
    });
  const [create, { isLoading: creating }] = useCreateDepartmentMutation();
  const [updateStatus] = useUpdateDepartmentStatusMutation();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleStatusToggle(id: string, isActive: boolean) {
    setTogglingId(id);
    try {
      await updateStatus({ id, isActive }).unwrap();
    } finally {
      setTogglingId(null);
    }
  }
  const [updateDepartment, { isLoading: savingDetails }] =
    useUpdateDepartmentMutation();
  const [updateManager, { isLoading: savingManager }] =
    useUpdateDepartmentManagerMutation();
  const { t } = useTranslation();

  // ── Create dialog ──────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "standard",
    location: "",
  });

  const handleCreate = async () => {
    await create({ name: form.name, type: form.type });
    setOpen(false);
    setForm({ name: "", type: "standard", location: "" });
  };

  // ── Detail / edit dialog ────────────────────────────────────
  const [detailTarget, setDetailTarget] = useState<Department | null>(null);
  const [detailForm, setDetailForm] = useState({ name: "" });
  const [managerId, setManagerId] = useState<string>("");
  const [detailError, setDetailError] = useState<string | null>(null);

  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery(
    { status: "active", limit: 100 },
    { skip: !detailTarget },
  );
  const eligibleUsers = usersData?.data?.items ?? [];

  function openDetail(dept: Department) {
    setDetailTarget(dept);
    setDetailForm({ name: dept.name });
    setManagerId(dept.managerId ?? "");
    setDetailError(null);
  }

  async function handleSaveDetails() {
    if (!detailTarget) return;
    if (!detailForm.name.trim()) {
      setDetailError(
        t("fields.name") +
          " " +
          t("form.required", { defaultValue: "is required" }),
      );
      return;
    }
    setDetailError(null);
    try {
      if (detailForm.name !== detailTarget.name) {
        await updateDepartment({
          id: detailTarget.id,
          data: { name: detailForm.name },
        }).unwrap();
      }

      const currentManagerId = detailTarget.managerId ?? "";
      if (managerId !== currentManagerId) {
        await updateManager({
          id: detailTarget.id,
          managerId: managerId || null,
        }).unwrap();
      }

      setDetailTarget(null);
    } catch (e: unknown) {
      setDetailError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  const columns: ColumnDef<Department>[] = [
    { key: "name", header: t("fields.name"), cell: (r) => r.name },
    {
      key: "type",
      header: t("fields.type"),
      cell: (r) => <StatusBadge status={r.type} domain="department_type" />,
    },
    {
      key: "manager",
      header: t("fields.manager"),
      cell: (r) => r.manager?.fullName ?? "—",
    },
    {
      key: "status",
      header: t("fields.isActive"),
      cell: (r) => (
        <StatusBadge
          status={r.isActive ? "active" : "inactive"}
          domain="department"
        />
      ),
    },
    {
      key: "created",
      header: t("fields.created"),
      cell: (r) => formatDate(r.createdAt),
    },
    {
      key: "toggle",
      header: t("fields.isActive"),
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={r.isActive}
            onCheckedChange={(v) => handleStatusToggle(r.id, v)}
            onClick={(e) => e.stopPropagation()}
            disabled={togglingId === r.id}
          />
          {togglingId === r.id && (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openDetail(r);
          }}
        >
          <Pencil className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <AppPageHeader
        title={t("title")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4 mr-2" />
            {t("addDepartment")}
          </Button>
        }
      />

      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <AppSearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder={t("searchPlaceholder", {
            defaultValue: "Search departments...",
          })}
          className="max-w-xs"
        />
        <Select
          value={typeFilter || "__all__"}
          onValueChange={(v) => {
            setTypeFilter(v === "__all__" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder={t("common:filters.allTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("common:filters.all")}</SelectItem>
            {DEPT_TYPES.map((dt) => (
              <SelectItem key={dt} value={dt} className="capitalize">
                {t(`types.${dt}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter || "__all__"}
          onValueChange={(v) => {
            setStatusFilter(v === "__all__" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("common:filters.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("common:filters.all")}</SelectItem>
            <SelectItem value="active">{t("status:user.active")}</SelectItem>
            <SelectItem value="inactive">
              {t("status:user.inactive")}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={managerFilter || "__all__"}
          onValueChange={(v) => {
            setManagerFilter(v === "__all__" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue
              placeholder={t("filters.allManagerStatus", {
                defaultValue: "Manager: All",
              })}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("common:filters.all")}</SelectItem>
            <SelectItem value="yes">
              {t("filters.hasManager", { defaultValue: "Has manager" })}
            </SelectItem>
            <SelectItem value="no">
              {t("filters.noManager", { defaultValue: "No manager" })}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError && !isLoading ? (
        <AppErrorState onRetry={() => refetch()} />
      ) : (
        <AppDataTable
          data={data?.data}
          columns={columns}
          isLoading={isLoading}
          isFetching={isFetching}
          rowKey={(r) => r.id}
          onPageChange={setPage}
          onRowClick={openDetail}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t("fields.name")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("fields.type")}</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPT_TYPES.map((dt) => (
                    <SelectItem key={dt} value={dt} className="capitalize">
                      {t(`types.${dt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={creating || !form.name}>
              {t("common:actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail / Edit Dialog */}
      <Dialog
        open={!!detailTarget}
        onOpenChange={(v) => !v && setDetailTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("fields.name")} — {t("common:actions.edit")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label required>{t("fields.name")}</Label>
              <Input
                value={detailForm.name}
                onChange={(e) =>
                  setDetailForm({ ...detailForm, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("fields.type")}</Label>
              <div className="flex items-center gap-2">
                {detailTarget && (
                  <StatusBadge
                    status={detailTarget.type}
                    domain="department_type"
                  />
                )}
                <span className="text-xs text-muted-foreground">
                  {t("typeNotEditable", {
                    defaultValue: "Type cannot be changed after creation.",
                  })}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("fields.manager")}</Label>
              {usersLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select
                  value={managerId || "__none__"}
                  onValueChange={(v) => setManagerId(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("selectManager", {
                        defaultValue: "Select manager...",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      {t("noManager", { defaultValue: "No manager" })}
                    </SelectItem>
                    {eligibleUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName}
                        {u.role?.name ? ` (${u.role.name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {detailTarget && (
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
                <div>
                  <p className="uppercase tracking-wide">
                    {t("fields.isActive")}
                  </p>
                  <p className="mt-0.5">
                    <StatusBadge
                      status={detailTarget.isActive ? "active" : "inactive"}
                      domain="department"
                    />
                  </p>
                </div>
                <div>
                  <p className="uppercase tracking-wide">
                    {t("fields.created")}
                  </p>
                  <p className="mt-0.5 text-foreground">
                    {formatDate(detailTarget.createdAt)}
                  </p>
                </div>
              </div>
            )}

            {detailError && (
              <p className="text-xs text-danger">{detailError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailTarget(null)}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              onClick={handleSaveDetails}
              loading={savingDetails || savingManager}
            >
              {t("common:actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
