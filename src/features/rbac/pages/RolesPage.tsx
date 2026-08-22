import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Save, Plus } from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import AppSearchInput from "@/components/shared/AppSearchInput";
import { Badge } from "@/components/primitive/badge";
import { Button } from "@/components/primitive/button";
import { Checkbox } from "@/components/primitive/checkbox";
import { Skeleton } from "@/components/primitive/skeleton";
import { Label } from "@/components/primitive/label";
import { Input } from "@/components/primitive/input";
import { Textarea } from "@/components/primitive/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/primitive/dialog";
import {
  useGetRolesQuery,
  useGetPermissionsQuery,
  useSetRolePermissionsMutation,
  useCreateRoleMutation,
} from "@/api/rbac.api";
import type { Role, Permission } from "@/lib/apiTypes";

export default function RolesPage() {
  const { t } = useTranslation("rbac");

  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery();
  const { data: permsData, isLoading: permsLoading } = useGetPermissionsQuery();
  const [setPerms, { isLoading: saving }] = useSetRolePermissionsMutation();
  const [createRole, { isLoading: creating }] = useCreateRoleMutation();

  const roles: Role[] = rolesData?.data ?? [];
  const permissions: Permission[] = permsData?.data ?? [];

  const [search, setSearch] = useState("");
  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [checkedCodes, setCheckedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedRole) {
      const codes = new Set(
        selectedRole.rolePermissions?.map((rp) => rp.permission.code) ?? [],
      );
      setCheckedCodes(codes);
    }
  }, [selectedRole]);

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const cat = p.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const toggle = (code: string) => {
    setCheckedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    await setPerms({
      id: selectedRole.id,
      permissionCodes: Array.from(checkedCodes),
    });
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

  async function handleCreateRole() {
    if (!NAME_PATTERN.test(newRoleName)) {
      setCreateError(t("roles.nameFormatError"));
      return;
    }
    setCreateError(null);
    try {
      const res = await createRole({
        name: newRoleName,
        description: newRoleDescription || undefined,
      }).unwrap();
      setCreateOpen(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedRole(res.data as Role);
    } catch (e: unknown) {
      setCreateError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  return (
    <div className="p-6">
      <AppPageHeader
        title={t("roles.title")}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-2" />
            {t("roles.newRole")}
          </Button>
        }
      />
      <div className="flex gap-6">
        {/* Roles list */}
        <div className="w-56 shrink-0 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
            {t("roles.rolesList")}
          </p>
          <AppSearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("roles.searchRoles")}
          />
          <div className="space-y-1 mt-2">
            {rolesLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : filteredRoles.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                {t("roles.noRolesFound")}
              </p>
            ) : (
              filteredRoles.map((r) => {
                const roleNameKey = `roles.roleNames.${r.name}`;
                const displayName = t(roleNameKey, { defaultValue: r.name });

                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r)}
                    className={`w-full text-start px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedRole?.id === r.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {displayName}
                    {r.isSystem && (
                      <Badge className="ml-2 text-xs py-0" variant="neutral">
                        {t("roles.system")}
                      </Badge>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Permissions matrix */}
        <div className="flex-1">
          {!selectedRole ? (
            <p className="text-sm text-muted-foreground">
              {t("roles.selectRole")}
            </p>
          ) : permsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-6">
              {selectedRole.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedRole.description}
                </p>
              )}

              {/* 10. Translate Categories and Permission Names */}
              {Object.entries(grouped).map(([cat, perms]) => (
                <div key={cat}>
                  <h3 className="text-sm font-semibold capitalize mb-2 text-muted-foreground">
                    {/* Use the category code as a key in rbac.json permissions.categories */}
                    {t(`permissions.categories.${cat}`, {
                      defaultValue: cat.replace(/_/g, " "),
                    })}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={checkedCodes.has(p.code)}
                          onCheckedChange={() => toggle(p.code)}
                          disabled={selectedRole.isSuperAdmin === true}
                        />
                        <span>
                          {/* Use the permission code as a key in rbac.json permissions.codes */}
                          {t(`permissions.codes.${p.code}`, {
                            defaultValue: p.name,
                          })}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {!selectedRole.isSuperAdmin && (
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="size-4 mr-2" />{" "}
                  {t("roles.savePermissions")}{" "}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Role Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("roles.newRole")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label required>{t("roles.name")}</Label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder={t("roles.namePlaceholder")}
              />
              <p className="text-xs text-muted-foreground">
                {t("roles.nameHint")}
              </p>
            </div>
            <div className="space-y-1">
              <Label>{t("roles.description")}</Label>
              <Textarea
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                rows={3}
              />
            </div>
            {createError && (
              <p className="text-xs text-danger">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={creating || !newRoleName}
            >
              {t("common:actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
