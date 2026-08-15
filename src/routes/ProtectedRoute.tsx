import { Navigate, Outlet } from "react-router-dom";
import { useIsAuthenticated } from "@/hooks/usePermission";
import { useGetMeQuery } from "@/api/auth.api";
import { useDispatch } from "react-redux";
import { setUser } from "@/features/auth/auth.slice";
import { useEffect } from "react";
import { Skeleton } from "@/components/primitive/skeleton";

export default function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();
  const dispatch = useDispatch();

  const { data, isLoading } = useGetMeQuery(undefined, {
    skip: isAuthenticated,
  });

  useEffect(() => {
    if (data?.data) dispatch(setUser(data.data));
  }, [data, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated && !data?.data) return <Navigate to="/login" replace />;

  return <Outlet />;
}
