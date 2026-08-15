import { useCurrentUser } from "@/hooks/usePermission";
import { useGetUserPermissionsQuery } from "@/api/rbac.api";
import AppPageHeader from "@/components/shared/AppPageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitive/card";
import { Badge } from "@/components/primitive/badge";
import { Skeleton } from "@/components/primitive/skeleton";
import { useTranslation } from "react-i18next";
function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePage() {
  const { t } = useTranslation("users");
  const user = useCurrentUser();

  const effectivePerms = user?.permissions ?? [];

  if (!user)
    return (
      <div className="p-6">
        <Skeleton className="h-48 w-full" />
      </div>
    );

  const fields = [
    { label: t("fields.fullName"), value: user.fullName },
    { label: t("fields.phone"), value: user.phone ?? "—" },
    { label: t("fields.email"), value: user.email ?? "—" },
    { label: t("fields.role"), value: user.role?.name ?? "—" },
    { label: t("fields.department"), value: user.department?.name ?? "—" },
    { label: t("fields.status"), value: user.status },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <AppPageHeader title={t("myProfile")} />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
              {initials(user.fullName)}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user.fullName}</h2>
              <p className="text-sm text-muted-foreground">{user.role?.name}</p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                  {f.label}
                </dt>
                <dd className="text-sm font-medium mt-0.5 capitalize">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("effectivePermissions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {effectivePerms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("noPermissions")}
              </p>
            ) : (
              effectivePerms.map((p) => (
                <Badge key={p} variant="neutral" className="text-xs font-mono">
                  {p}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
