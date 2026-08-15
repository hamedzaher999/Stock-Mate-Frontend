import { Navigate, Outlet } from "react-router-dom";
import { usePermission, useHasAny } from "@/hooks/usePermission";

interface PermissionRouteProps {
  permission?: string;
  anyOf?: string[];
}

export default function PermissionRoute({ permission, anyOf }: PermissionRouteProps) {
  const hasSingle = usePermission(permission ?? "");
  const hasAny = useHasAny(anyOf ?? []);

  if (permission && !hasSingle) return <Navigate to="/403" replace />;
  if (anyOf?.length && !hasAny) return <Navigate to="/403" replace />;

  return <Outlet />;
}
