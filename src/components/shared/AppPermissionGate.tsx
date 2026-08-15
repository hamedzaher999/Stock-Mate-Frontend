import type { ReactNode } from "react";
import { usePermission, useHasAny } from "@/hooks/usePermission";

interface PermissionGateProps {
  permission?: string;
  anyOf?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export default function AppPermissionGate({ permission, anyOf, fallback = null, children }: PermissionGateProps) {
  const hasSingle = usePermission(permission ?? "");
  const hasAny = useHasAny(anyOf ?? []);

  if (permission && !hasSingle) return <>{fallback}</>;
  if (anyOf && !hasAny) return <>{fallback}</>;

  return <>{children}</>;
}
