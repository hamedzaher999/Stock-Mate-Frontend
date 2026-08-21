import AppErrorState from "@/components/shared/AppErrorState";
import { Loader2, Plus, UserCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppDataTable, { ColumnDef } from "@/components/shared/AppDataTable";
import AppSearchInput from "@/components/shared/AppSearchInput";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/primitive/button";
import { Switch } from "@/components/primitive/switch";
import { Label } from "@/components/primitive/label";
import { Input } from "@/components/primitive/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/primitive/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useCurrentUser } from "@/hooks/usePermission";
import { formatDate } from "@/lib/formatters";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserStatusMutation,
} from "@/api/users.api";
import { useGetRolesQuery } from "@/api/rbac.api";
import { useGetDepartmentsQuery } from "@/api/departments.api";
import type { UserListItem, Role, Department } from "@/lib/apiTypes";

interface Form {
  fullName: string;
  phoneNumber: string;
  email: string;
  roleId: string;
  departmentId: string;
}
const EMPTY: Form = {
  fullName: "",
  phoneNumber: "",
  email: "",
  roleId: "",
  departmentId: "",
};

export default function UsersPage() {
  const { t } = useTranslation("users");
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [roleId, setRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading, isFetching, isError, refetch } = useGetUsersQuery({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(roleId ? { roleId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(status ? { status: status as "active" | "inactive" } : {}),
  });
  const [create, { isLoading: creating }] = useCreateUserMutation();
  const [updateStatus] = useUpdateUserStatusMutation();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { data: rolesData } = useGetRolesQuery();
  const { data: deptsData } = useGetDepartmentsQuery();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);

  // Deactivation confirm dialog
  const [deactivateTarget, setDeactivateTarget] = useState<UserListItem | null>(
    null,
  );

  const handleCreate = async () => {
    if (!form.phoneNumber && !form.email) {
      setFormError(t("errors.phoneOrEmailRequired"));
      return;
    }
    setFormError(null);
    await create({
      fullName: form.fullName,
      phone: form.phoneNumber || undefined,
      email: form.email || undefined,
      roleId: form.roleId,
      departmentId: form.departmentId || undefined,
    });
    setOpen(false);
    setForm(EMPTY);
  };

  async function handleToggle(user: UserListItem, newActive: boolean) {
    if (!newActive) {
      // Confirm before deactivating
      setDeactivateTarget(user);
    } else {
      setTogglingId(user.id);
      try {
        await updateStatus({ id: user.id, status: "active" }).unwrap();
      } finally {
        setTogglingId(null);
      }
    }
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    setTogglingId(deactivateTarget.id);
    try {
      await updateStatus({
        id: deactivateTarget.id,
        status: "inactive",
      }).unwrap();
    } finally {
      setTogglingId(null);
      setDeactivateTarget(null);
    }
  }

  const columns: ColumnDef<UserListItem>[] = [
    { key: "name", header: t("fields.fullName"), cell: (r) => r.fullName },
    { key: "phone", header: t("fields.phone"), cell: (r) => r.phone ?? "—" },
    { key: "email", header: t("fields.email"), cell: (r) => r.email ?? "—" },
    { key: "role", header: t("fields.role"), cell: (r) => r.role?.name ?? "—" },
    {
      key: "dept",
      header: t("fields.department"),
      cell: (r) => r.department?.name ?? "—",
    },
    {
      key: "status",
      header: t("fields.status"),
      cell: (r) => <StatusBadge status={r.status} domain="user" />,
    },
    {
      key: "created",
      header: t("fields.createdAt"),
      cell: (r) => formatDate(r.createdAt),
    },
    {
      key: "toggle",
      header: t("active"),
      cell: (r) => {
        const isSelf = currentUser?.id === r.id;
        const isSuperAdmin = r.role?.isSuperAdmin === true;
        const isToggling = togglingId === r.id;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={r.status === "active"}
              onCheckedChange={(v) => handleToggle(r, v)}
              onClick={(e) => e.stopPropagation()}
              disabled={isSelf || isSuperAdmin || isToggling}
            />
            {isToggling && (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
        );
      },
    },
    {
      key: "manage",
      header: "",
      cell: (r) => {
        const isSelf = currentUser?.id === r.id;
        const isSuperAdmin = r.role?.isSuperAdmin === true;
        if (isSelf || isSuperAdmin) return null;
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/users/${r.id}`);
            }}
            title={t("manageUser")}
          >
            <UserCircle className="size-4" />
          </Button>
        );
      },
    },
  ];

  const roles: Role[] = rolesData?.data ?? [];
  const depts: Department[] = deptsData?.data?.items ?? [];

  return (
    <div className="p-6">
      <AppPageHeader
        title={t("title")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4 mr-2" />
            {t("addUser")}
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
          placeholder={t("searchPlaceholder")}
          className="max-w-xs"
        />
        <Select
          value={roleId}
          onValueChange={(v) => {
            setRoleId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("filters.allRoles")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("common:filters.all")}</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={departmentId}
          onValueChange={(v) => {
            setDepartmentId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("common:filters.allDepartments")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("common:filters.all")}</SelectItem>
            {depts.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("common:filters.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("common:filters.all")}</SelectItem>
            <SelectItem value="active">{t("status:user.active")}</SelectItem>
            <SelectItem value="inactive">
              {t("status:user.inactive")}
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
          onRowClick={(r) => {
            const isSelf = currentUser?.id === r.id;
            const isSuperAdmin = r.role?.isSuperAdmin === true;
            if (isSelf || isSuperAdmin) return;
            navigate(`/users/${r.id}`);
          }}
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
              <Label>{t("fields.fullName")}</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("fields.phone")}</Label>
              <Input
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm({ ...form, phoneNumber: e.target.value })
                }
                placeholder="+963..."
              />
            </div>
            <div className="space-y-1">
              <Label>{t("fields.email")}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            {formError && <p className="text-xs text-danger">{formError}</p>}
            <div className="space-y-1">
              <Label>{t("fields.role")}</Label>
              <Select
                value={form.roleId}
                onValueChange={(v) => setForm({ ...form, roleId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("fields.role")} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("fields.department")}</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => setForm({ ...form, departmentId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("fields.department")} />
                </SelectTrigger>
                <SelectContent>
                  {depts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
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
            <Button
              onClick={handleCreate}
              disabled={creating || !form.fullName || !form.roleId}
            >
              {t("common:actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirm Dialog */}
      <Dialog
        open={!!deactivateTarget}
        onOpenChange={(v) => !v && setDeactivateTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deactivateTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("deactivateConfirm", { name: deactivateTarget?.fullName })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeactivate}>
              {t("common:actions.deactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
