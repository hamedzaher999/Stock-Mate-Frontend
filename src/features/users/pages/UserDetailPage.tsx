import SessionsList from "@/components/shared/SessionsList";
import {
  useGetUserSessionsQuery,
  useRevokeUserSessionMutation,
  useRevokeAllUserSessionsMutation,
} from "@/api/sessions.api";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Save } from "lucide-react";
import AppPageHeader from "@/components/shared/AppPageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import { Button } from "@/components/primitive/button";
import { Label } from "@/components/primitive/label";
import { Input } from "@/components/primitive/input";
import { Skeleton } from "@/components/primitive/skeleton";
import { Badge } from "@/components/primitive/badge";
import { Checkbox } from "@/components/primitive/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/primitive/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/primitive/tabs";
import { useCurrentUser } from "@/hooks/usePermission";
import { useGetUserByIdQuery, useUpdateUserMutation } from "@/api/users.api";
import {
  useGetRolesQuery,
  useGetPermissionsQuery,
  useGetUserPermissionsQuery,
  useAddUserPermissionMutation,
  useDeleteUserPermissionMutation,
  useResetUserPermissionsMutation,
} from "@/api/rbac.api";
import { useGetDepartmentsQuery } from "@/api/departments.api";
import { DOCTOR_ROLE_NAME } from "@/lib/roleConstants";
import type { Permission } from "@/lib/apiTypes";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/primitive/dialog";

interface ProfileForm {
  fullName: string;
  phone: string;
  email: string;
  roleId: string;
  departmentId: string;
  specialty: string;
}

function ProfileTab({ userId }: { userId: string }) {
  const { t } = useTranslation("users");
  const { data, isLoading } = useGetUserByIdQuery(userId);
  const user = data?.data;
  const { data: rolesData } = useGetRolesQuery();
  const { data: deptsData } = useGetDepartmentsQuery();
  const [updateUser, { isLoading: saving }] = useUpdateUserMutation();

  const [form, setForm] = useState<ProfileForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName,
        phone: user.phone ?? "",
        email: user.email ?? "",
        roleId: user.role?.id ?? "",
        departmentId: user.department?.id ?? "",
        specialty: user.specialty ?? "",
      });
    }
  }, [user]);

  const roles = rolesData?.data ?? [];
  const depts = deptsData?.data?.items ?? [];
  const isDoctorRole =
    roles.find((r) => r.id === form?.roleId)?.name === DOCTOR_ROLE_NAME;

  async function handleSave() {
    if (!form) return;
    setError(null);
    setSuccess(false);
    try {
      await updateUser({
        id: userId,
        data: {
          fullName: form.fullName,
          phone: form.phone || undefined,
          email: form.email || undefined,
          roleId: form.roleId || undefined,
          departmentId: form.departmentId || undefined,
          specialty: form.specialty || undefined,
        },
      }).unwrap();
      setSuccess(true);
    } catch (e: unknown) {
      setError(
        (e as { data?: { message?: string } })?.data?.message ?? "Error",
      );
    }
  }

  if (isLoading || !form) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editProfile")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-w-lg">
        <div className="space-y-1.5">
          <Label required>{t("fields.fullName")}</Label>
          <Input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("fields.phone")}</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+963..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("fields.email")}</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("fields.role")}</Label>
            <Select
              value={form.roleId}
              onValueChange={(v) => setForm({ ...form, roleId: v })}
            >
              <SelectTrigger>
                <SelectValue />
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
          <div className="space-y-1.5">
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
        {isDoctorRole && (
          <div className="space-y-1.5">
            <Label required>{t("fields.specialty")}</Label>
            <Input
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            />
          </div>
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
        {success && (
          <p className="text-xs text-success">{t("profileUpdated")}</p>
        )}
        <Button onClick={handleSave} loading={saving}>
          <Save className="size-4 mr-2" />
          {t("common:actions.save")}
        </Button>
      </CardContent>
    </Card>
  );
}

function PermissionsTab({ userId }: { userId: string }) {
  const { t } = useTranslation("users");
  const currentUser = useCurrentUser();
  const { data: permsData } = useGetPermissionsQuery();
  const { data: userPermsData, isLoading } = useGetUserPermissionsQuery(userId);
  const [addPermission] = useAddUserPermissionMutation();
  const [removePermission] = useDeleteUserPermissionMutation();
  const [resetPermissions, { isLoading: resetting }] =
    useResetUserPermissionsMutation();

  const permissions: Permission[] = permsData?.data ?? [];
  const effective = new Set(userPermsData?.data?.effectivePermissions ?? []);
  const overrides = userPermsData?.data?.overrides ?? [];
  const overrideByCode = new Map(overrides.map((o) => [o.permission.code, o]));

  const isSelf = currentUser?.id === userId;

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const cat = p.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  async function togglePermission(code: string, currentlyEffective: boolean) {
    if (isSelf) return;
    await addPermission({
      userId,
      permissionCode: code,
      effect: currentlyEffective ? "revoke" : "grant",
    });
  }

  async function clearOverride(code: string) {
    await removePermission({ userId, permissionCode: code });
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("permissionsTab")}</CardTitle>
        {!isSelf && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetPermissions(userId)}
            loading={resetting}
          >
            {t("resetToDefault")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isSelf && (
          <p className="text-sm text-muted-foreground">
            {t("cannotEditOwnPermissions")}
          </p>
        )}
        {Object.entries(grouped).map(([cat, perms]) => (
          <div key={cat}>
            <h3 className="text-sm font-semibold capitalize mb-2 text-muted-foreground">
              {cat.replace(/_/g, " ")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {perms.map((p) => {
                const isEffective = effective.has(p.code);
                const override = overrideByCode.get(p.code);
                return (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={isEffective}
                      onCheckedChange={() =>
                        togglePermission(p.code, isEffective)
                      }
                      disabled={isSelf}
                    />
                    <span>{p.name}</span>
                    {override && (
                      <Badge
                        variant={
                          override.effect === "grant" ? "success" : "danger"
                        }
                        className="text-[10px] py-0"
                      >
                        {override.effect}
                      </Badge>
                    )}
                    {override && !isSelf && (
                      <button
                        className="text-[10px] text-muted-foreground hover:text-foreground underline"
                        onClick={(e) => {
                          e.preventDefault();
                          clearOverride(p.code);
                        }}
                      >
                        {t("clearOverride")}
                      </button>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
function SessionsTab({ userId }: { userId: string }) {
  const { t } = useTranslation("sessions");
  const currentUser = useCurrentUser();
  const { data, isLoading } = useGetUserSessionsQuery(userId);
  const [revokeSession] = useRevokeUserSessionMutation();
  const [revokeAll, { isLoading: revokingAll }] =
    useRevokeAllUserSessionsMutation();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeAllOpen, setConfirmRevokeAllOpen] = useState(false);

  const sessions = data?.data ?? [];
  const isSelf = currentUser?.id === userId;

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId);
    try {
      await revokeSession({ userId, sessionId }).unwrap();
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAll() {
    await revokeAll(userId).unwrap();
    setConfirmRevokeAllOpen(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("userSessions.title")}</CardTitle>
        {!isSelf && sessions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-danger border-danger/30 hover:bg-danger/5"
            onClick={() => setConfirmRevokeAllOpen(true)}
            loading={revokingAll}
          >
            {t("userSessions.revokeAll")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isSelf && (
          <p className="text-sm text-muted-foreground mb-4">
            {t("userSessions.viewingOwnHint")}
          </p>
        )}
        <SessionsList
          sessions={sessions}
          isLoading={isLoading}
          onRevoke={handleRevoke}
          revokingId={revokingId}
          emptyMessage={t("userSessions.empty")}
        />
      </CardContent>

      <Dialog
        open={confirmRevokeAllOpen}
        onOpenChange={setConfirmRevokeAllOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("userSessions.revokeAllTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("userSessions.revokeAllConfirm")}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRevokeAllOpen(false)}
            >
              {t("common:actions.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleRevokeAll}>
              {t("userSessions.revokeAll")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
export default function UserDetailPage() {
  const { t } = useTranslation("users");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data } = useGetUserByIdQuery(id!);
  const user = data?.data;

  if (!id) return <></>;

  return (
    <div className="p-6 space-y-6">
      <AppPageHeader
        title={user?.fullName ?? t("manageUser")}
        subtitle={user?.role?.name}
        actions={user && <StatusBadge status={user.status} domain="user" />}
      />

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">{t("profileTab")}</TabsTrigger>
          <TabsTrigger value="permissions">{t("permissionsTab")}</TabsTrigger>
          <TabsTrigger value="sessions">{t("sessionsTab")}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileTab userId={id} />
        </TabsContent>
        <TabsContent value="permissions">
          <PermissionsTab userId={id} />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsTab userId={id} />
        </TabsContent>
      </Tabs>

      <Button variant="ghost" onClick={() => navigate("/users")}>
        {t("common:actions.back")}
      </Button>
    </div>
  );
}
